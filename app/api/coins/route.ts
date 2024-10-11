import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Connection, PublicKey } from "@solana/web3.js";
import { CpmmPoolInfoLayout, toApiV3Token } from "@raydium-io/raydium-sdk-v2";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { kv } from "@vercel/kv";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const BIRDEYE_BASE_URL = "https://public-api.birdeye.so/defi";
const PROGRAM_IDS = ["65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9", "Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r"];
const BONDING_CURVE_PROGRAM_IDS = ["65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9", "Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r"];
const LP_PROGRAM_ID = "CVF4q3yFpyQwV8DLDiJ9Ew6FFLE1vr5ToRzsXYQTaNrj";

// Cache configuration
export const runtime = "edge";
export const preferredRegion = "auto";
export const revalidate = 3600; // 1 hour

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Implement a request queue to limit concurrent requests
const queue: (() => Promise<void>)[] = [];
const MAX_CONCURRENT_REQUESTS = 5;
let activeRequests = 0;

async function executeQueue() {
	if (activeRequests >= MAX_CONCURRENT_REQUESTS || queue.length === 0) return;
	activeRequests++;
	const task = queue.shift();
	if (task) {
		await task();
		activeRequests--;
		executeQueue();
	}
}

async function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		queue.push(async () => {
			try {
				const result = await fn();
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
		executeQueue();
	});
}

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 5, backoff = 300) {
	return enqueueRequest(async () => {
		for (let i = 0; i < retries; i++) {
			try {
				const response = await fetch(url, options);
				if (response.ok) {
					return await response.json();
				}
				if (response.status === 429) {
					console.log(`Rate limited. Retrying in ${backoff}ms...`);
				} else {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
			} catch (error) {
				if (i === retries - 1) throw error;
				console.log(`Attempt ${i + 1} failed. Retrying in ${backoff}ms...`);
			}
			await wait(backoff);
			backoff *= 2;
		}
		throw new Error("Max retries reached");
	});
}

async function cachedApiCall(apiName: string, url: string, options: RequestInit = {}, ttl = 3600) {
	const cacheKey = `${apiName}:${url}`;

	const cachedData = await kv.get(cacheKey);
	if (cachedData) {
		console.log(`Cache hit for ${apiName}`);
		return cachedData;
	}

	console.log(`Cache miss for ${apiName}. Fetching fresh data...`);
	const data = await fetchWithRetry(url, options);

	await kv.set(cacheKey, data, { ex: ttl });

	return data;
}

async function batchProcess<T>(items: string[], batchSize: number, processFn: (batch: string[]) => Promise<T[]>): Promise<T[]> {
	const results: T[] = [];
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await processFn(batch);
		results.push(...batchResults);
	}
	return results;
}

async function fetchHeliusData(mintAddresses: string[]) {
	return batchProcess(mintAddresses, 100, async (batch) => {
		const url = HELIUS_API_URL;
		const options = {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				jsonrpc: "2.0",
				id: "my-id",
				method: "getAssetBatch",
				params: { ids: batch },
			}),
		};
		return cachedApiCall("helius", url, options, 1800);
	});
}

async function fetchBirdeyeData(tokenAddresses: string[]) {
	return batchProcess(tokenAddresses, 50, async (batch) => {
		const fetchPromises = batch.map((address) => {
			const url = `${BIRDEYE_BASE_URL}/token_overview?address=${address}`;
			const options = {
				method: "GET",
				headers: {
					accept: "application/json",
					"x-chain": "solana",
					"X-API-KEY": BIRDEYE_API_KEY || "",
				},
			};
			return cachedApiCall("birdeye", url, options, 1800);
		});
		return Promise.all(fetchPromises);
	});
}

async function fetchProgramAccounts(connection: Connection, programId: string) {
	const accounts = await connection.getProgramAccounts(new PublicKey(programId), {
		encoding: "base64",
		filters: [{ dataSize: 49 }],
	});
	return accounts;
}

type BuyResult = {
	token_amount: bigint;
	sol_amount: bigint;
};

type SellResult = {
	token_amount: bigint;
	sol_amount: bigint;
};

class AMM {
	constructor(
		public virtualSolReserves: bigint,
		public virtualTokenReserves: bigint,
		public realSolReserves: bigint,
		public realTokenReserves: bigint,
		public initialVirtualTokenReserves: bigint,
		public program: Program<any>
	) {}
	metadata: {
		image: string | null;
		name: string | null;
		symbol: string | null;
	} | null = null;
	mintPubkey: PublicKey | null = null;
	programId: string | null = null;
	apiV3Token: any | null = null;
	birdeyeData: any | null = null;

	getBuyPrice(tokens: bigint): bigint {
		const productOfReserves = this.virtualSolReserves * this.virtualTokenReserves;
		const newVirtualTokenReserves = this.virtualTokenReserves - tokens;
		const newVirtualSolReserves = productOfReserves / newVirtualTokenReserves + BigInt(1);
		const amountNeeded = newVirtualSolReserves - this.virtualSolReserves;
		return amountNeeded;
	}

	applyBuy(token_amount: bigint): BuyResult {
		const final_token_amount = token_amount > this.realTokenReserves ? this.realTokenReserves : token_amount;
		const sol_amount = this.getBuyPrice(final_token_amount);

		this.virtualTokenReserves = this.virtualTokenReserves - final_token_amount;
		this.realTokenReserves = this.realTokenReserves - final_token_amount;

		this.virtualSolReserves = this.virtualSolReserves + sol_amount;
		this.realSolReserves = this.realSolReserves + sol_amount;

		return {
			token_amount: final_token_amount,
			sol_amount: sol_amount,
		};
	}

	applySell(token_amount: bigint): SellResult {
		this.virtualTokenReserves = this.virtualTokenReserves + token_amount;
		this.realTokenReserves = this.realTokenReserves + token_amount;

		const sell_price = this.getSellPrice(token_amount);

		this.virtualSolReserves = this.virtualSolReserves - sell_price;
		this.realSolReserves = this.realSolReserves - sell_price;

		return {
			token_amount: token_amount,
			sol_amount: sell_price,
		};
	}

	getSellPrice(tokens: bigint): bigint {
		const scaling_factor = this.initialVirtualTokenReserves;
		const token_sell_proportion = (tokens * scaling_factor) / this.virtualTokenReserves;
		const sol_received = (this.virtualSolReserves * token_sell_proportion) / scaling_factor;
		return sol_received < this.realSolReserves ? sol_received : this.realSolReserves;
	}
}

async function generateAMMs(connection: Connection, programs: { [key: string]: Program<any> }): Promise<AMM[]> {
	const amms: AMM[] = [];
	console.info("[[[ Fetching program accounts... ]]]", Math.floor(Date.now() / 1000));

	const allAccountsData = await Promise.all(PROGRAM_IDS.map((programId) => fetchProgramAccounts(connection, programId)));

	for (let i = 0; i < PROGRAM_IDS.length; i++) {
		const programId = PROGRAM_IDS[i];
		const program = programs[programId];
		if (!program) {
			console.error(`Program not found for programId: ${programId}`);
			continue;
		}

		const accountsData = allAccountsData[i];

		const ammPromises = accountsData.map(async (account: any) => {
			const data = Buffer.from(account.account.data).slice(8);
			const virtualSolReserves = data.readBigUInt64LE(0);
			const virtualTokenReserves = data.readBigUInt64LE(8);
			const realSolReserves = data.readBigUInt64LE(16);
			const realTokenReserves = data.readBigUInt64LE(24);
			const initialVirtualTokenReserves = data.readBigUInt64LE(32);
			const amm = new AMM(virtualSolReserves, virtualTokenReserves, realSolReserves, realTokenReserves, initialVirtualTokenReserves, program);
			amm.programId = programId;

			// Fetch mint public key
			const signatures = await connection.getSignaturesForAddress(account.pubkey, { limit: 10 });
			const transactionSignatures = signatures.map((sig) => sig.signature);

			// Fetch transactions in parallel
			const transactions = await connection.getParsedTransactions(transactionSignatures, {
				maxSupportedTransactionVersion: 0,
			});

			let mintPubkey: PublicKey | null = null;
			outerLoop: for (const tx of transactions) {
				if (!tx) continue;
				for (const tokenTransfer of tx.meta?.postTokenBalances ?? []) {
					const [maybeUs] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), new PublicKey(tokenTransfer.mint).toBuffer()], new PublicKey(programId));
					if (maybeUs.equals(account.pubkey)) {
						mintPubkey = new PublicKey(tokenTransfer.mint);
						break outerLoop;
					}
				}
			}

			if (mintPubkey) {
				amm.mintPubkey = mintPubkey;
				amm.apiV3Token = toApiV3Token({
					address: amm.mintPubkey?.toBase58(),
					programId: programId === "65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9" ? TOKEN_2022_PROGRAM_ID.toString() : TOKEN_PROGRAM_ID.toString(),
					decimals: 6,
				});

				amms.push(amm);
			}
		});

		await Promise.all(ammPromises);
	}

	return amms;
}

async function generatePairs(count: number) {
	const connection = new Connection("https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW");

	// Initialize programs
	const programs: { [key: string]: Program<any> } = {};
	// @ts-ignore
	const provider = new AnchorProvider(connection, undefined, {});

	const allProgramIds = [...PROGRAM_IDS, LP_PROGRAM_ID];

	// Looping through program IDs
	await Promise.all(
		allProgramIds.map(async (programId) => {
			const IDL = await Program.fetchIdl(new PublicKey(programId), provider);
			if (IDL) {
				programs[programId] = new Program(IDL as any, provider);
			}
		})
	);

	const amms = await generateAMMs(connection, programs);
	const ammSlice = amms.slice(0, count);

	const mintAddresses = ammSlice.map((amm) => amm.mintPubkey?.toBase58()).filter(Boolean) as string[];

	const [metadataResults, birdeyeResults] = await Promise.all([fetchHeliusData(mintAddresses), fetchBirdeyeData(mintAddresses)]);

	const pairs = ammSlice.map((amm, index) => {
		if (!amm.mintPubkey) return null;

		const metadata: any = metadataResults[index] || {};
		const birdeyeData = birdeyeResults[index];

		return {
			id: amm.mintPubkey.toBase58(),
			image: metadata.content?.links?.image || birdeyeData?.logoURI || "https://via.assets.so/img.jpg?w=400&h=150&tc=blue&bg=#000000&t=",
			shortName: metadata.content?.metadata?.symbol || birdeyeData?.symbol || `Coin${index + 1}`,
			name: metadata.content?.metadata?.name || birdeyeData?.name || `Coin Name ${index + 1}`,
			summary: metadata.content?.metadata?.description || `This is a summary for ${metadata.content?.metadata?.name || birdeyeData?.name || `Coin Name ${index + 1}`}.`,
			percentComplete: Math.floor(Math.random() * 100),
			txns: birdeyeData?.txns24h || Math.floor(Math.random() * 1000),
			totalVolume: birdeyeData?.v24hUSD ? `${birdeyeData.v24hUSD.toFixed(2)}` : `${(Math.random() * 100000).toFixed(2)}`,
			twitter: metadata.content?.links?.twitter || "https://twitter.com",
			telegram: metadata.content?.links?.telegram || "https://t.me",
			website: metadata.content?.links?.website || "https://example.com",
		};
	});

	return pairs.filter(Boolean);
}

export async function GET(request: NextRequest) {
	try {
		const count = parseInt(request.nextUrl.searchParams.get("count") || "10", 10);

		// Use the cache API for request-level caching
		const cacheKey = `pairs-${count}`;
		const cache = await caches.open("pairs-cache");
		let response = await cache.match(cacheKey);

		if (!response) {
			console.log("Cache miss. Generating new data...");
			const pairs = await generatePairs(count);

			response = new Response(JSON.stringify(pairs), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
				},
			});

			await cache.put(cacheKey, response.clone());
		} else {
			console.log("Cache hit. Returning cached data...");
		}

		return response;
	} catch (error) {
		console.error("Error in GET request:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const { secret } = await request.json();

		if (secret !== process.env.REVALIDATION_SECRET) {
			return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
		}

		revalidatePath("/api/pairs");
		return NextResponse.json({ revalidated: true, now: Date.now() });
	} catch (error) {
		console.error("Error in POST request:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
