import { NextResponse } from 'next/server';
import axios from 'axios';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  CpmmPoolInfoLayout,
  fetchMultipleMintInfos,
  RAYMint,
  SOLMint,
  splAccountLayout,
  toApiV3Token,
} from '@raydium-io/raydium-sdk-v2';
import Decimal from 'decimal.js-light';
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { BN } from 'bn.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const BIRDEYE_BASE_URL = 'https://public-api.birdeye.so/defi';
const PROGRAM_IDS = ['65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9', 'Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r']
const cache = new Map();

async function fetchWithRetry(url: string, options: any, retries = 5, backoff = 300) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  // if (cache.has(cacheKey)) {
  //   return cache.get(cacheKey);
  // }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429) {
        const jsonData = await response.json();
        // cache.set(cacheKey, jsonData);
        return jsonData;
      }
      console.log(`Rate limited. Retrying in ${backoff}ms...`);
    } catch (error) {
      console.log(`Error occurred. Retrying in ${backoff}ms...`);
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    backoff *= 2;
  }
  throw new Error('Max retries reached');
}

async function fetchTokenMetadata(mintAddresses: string[]) {
  const cacheKey = `tokenMetadata-${mintAddresses.join(',')}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const randomDelay = Math.floor(Math.random() * 1000) + 500; // Random delay between 500-1500ms
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    const response = await fetchWithRetry(HELIUS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetBatch',
        params: {
          ids: mintAddresses
        },
      }),
    });
    
    const { result } = await response;
    
    // Process the result to extract relevant metadata
    const processedResult = result.map((asset: any) => ({
      id: asset.id,
      content: {
        metadata: asset.content?.metadata,
        links: asset.content?.links,
        image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || 'https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api/get-asset/get-asset-batch'
      }
    }));
    
    cache.set(cacheKey, processedResult);
    return processedResult;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return [];
  }
}
async function fetchProgramAccounts(connection: Connection, programId: string) {
  const cacheKey = `programAccounts-${programId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const accounts = await connection.getProgramAccounts(new PublicKey(programId), {
    encoding: 'base64',
    filters: [{ dataSize: 49 }],
  });
  cache.set(cacheKey, accounts);
  return accounts;
}

async function fetchBirdeyeData(tokenAddresses: string[]) {
  const cacheKey = `birdeyeData-${tokenAddresses.join(',')}`;
  if (cache.has(cacheKey) && cache.get(cacheKey) != null) {
    return cache.get(cacheKey);
  }

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-chain': 'solana',
      'X-API-KEY': BIRDEYE_API_KEY,
    },
  };

  try {
    const fetchPromises = tokenAddresses.map(async (address) => {
      try {
        const response = await fetchWithRetry(`${BIRDEYE_BASE_URL}/token_overview?address=${address}`, options);
        const jsonData = await response;
        if (!jsonData.success) {
          console.error(`Birdeye API returned unsuccessful response for address: ${address}`);
          return null;
        } else {
          return jsonData.data;
        }
      } catch (error) {
        console.error(`Error fetching or parsing data for address: ${address}`, error);
        return null;
      }
    });

    const result = await Promise.all(fetchPromises);
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error fetching Birdeye data:', err);
    return tokenAddresses.map(() => null);
  }
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
    const final_token_amount =
      token_amount > this.realTokenReserves ? this.realTokenReserves : token_amount;
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
  // Function implementation goes here
  const amms: AMM[] = [];
  const allAccountsData = await Promise.all(PROGRAM_IDS.map(programId => fetchProgramAccounts(connection, programId)));

  for (let i = 0; i < PROGRAM_IDS.length; i++) {
    const programId = PROGRAM_IDS[i];
    const program = programs[programId];
    if (!program) {
      console.error(`Program not found for programId: ${programId}`);
      continue;
    }

    const accountsData = allAccountsData[i];

    const ammPromises = accountsData.map(async (account:any) => {
      const data = Buffer.from(account.account.data).slice(8);
      const virtualSolReserves = data.readBigUInt64LE(0);
      const virtualTokenReserves = data.readBigUInt64LE(8);
      const realSolReserves = data.readBigUInt64LE(16);
      const realTokenReserves = data.readBigUInt64LE(24);
      const initialVirtualTokenReserves = data.readBigUInt64LE(32);
      const amm = new AMM(
        virtualSolReserves,
        virtualTokenReserves,
        realSolReserves,
        realTokenReserves,
        initialVirtualTokenReserves,
        program
      );
      amm.programId = programId;

      // Fetch mint public key
      const signatures = await connection.getSignaturesForAddress(account.pubkey, { limit: 50 });
      const transactions = await connection.getParsedTransactions(signatures.map((sig) => sig.signature), {maxSupportedTransactionVersion: 0});

      let mintPubkey: PublicKey | null = null;
      for (const tx of transactions) {
        if (!tx) continue;
        for (const tokenTransfer of tx.meta?.postTokenBalances ?? []) {
          const [maybeUs] = PublicKey.findProgramAddressSync(
            [Buffer.from('bonding-curve'), new PublicKey(tokenTransfer.mint).toBuffer()],
            new PublicKey(programId)
          );
          if (maybeUs.equals(account.pubkey)) {
            mintPubkey = new PublicKey(tokenTransfer.mint);
            break;
          }
        }
        if (mintPubkey) break;
      }

      if (mintPubkey) {
        amm.mintPubkey = mintPubkey;
        amm.apiV3Token = toApiV3Token({
          address: amm.mintPubkey?.toBase58(),
          programId:
            programId === '65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9'
              ? TOKEN_2022_PROGRAM_ID.toString()
              : TOKEN_PROGRAM_ID.toString(),
          decimals: 6,
        });

        amms.push(amm);
      }
    });

    await Promise.all(ammPromises);
  }

  // Batch fetch metadata
  const mintAddresses = amms.map(amm => amm.mintPubkey?.toBase58()).filter(Boolean) as string[];
  const [metadataResults, birdeyeResults] = await Promise.all([
    fetchTokenMetadata(mintAddresses),
    fetchBirdeyeData(mintAddresses)
  ]);

  amms.forEach((amm, index) => {
    const metadata = metadataResults[index];
    const birdeyeData = birdeyeResults[index];

    if (metadata?.content?.metadata) {
      amm.metadata = {
        image: metadata.content.links?.image || null,
        name: metadata.content.metadata.name || null,
        symbol: metadata.content.metadata.symbol || null,
      };
    }

    amm.birdeyeData = birdeyeData;
  });

  return amms;
}

async function calculateAge(connection: Connection, address: PublicKey): Promise<number | null> {
  try {
    // Fetch the most recent transaction for the given address
    const transactions = await connection.getSignaturesForAddress(address, { limit: 1 });
    
    if (transactions.length === 0) {
      return null; // No transactions found
    }

    const mostRecentTx = transactions[0];
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const txTimestamp = mostRecentTx.blockTime; // Transaction timestamp in seconds

    if (!txTimestamp ) {
      return null; // Transaction timestamp not available
    }

    // Calculate age in seconds
    const ageInSeconds = currentTimestamp - txTimestamp;

    return ageInSeconds;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

const BONDING_CURVE_PROGRAM_IDS = ['65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9', 'Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r'];
const LP_PROGRAM_ID = 'CVF4q3yFpyQwV8DLDiJ9Ew6FFLE1vr5ToRzsXYQTaNrj';

async function generatePairs(count: number) {
  const connection = new Connection(
    'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW'
  );

  // Initialize programs
  const programs: { [key: string]: Program<any> } = {};
  // @ts-ignore
  const provider = new AnchorProvider(connection, undefined, {})

  const allProgramIds = [...BONDING_CURVE_PROGRAM_IDS, LP_PROGRAM_ID];
  await Promise.all(allProgramIds.map(async (programId) => {
    const IDL = await Program.fetchIdl(new PublicKey(programId), provider);
    if (IDL) {
      programs[programId] = new Program(IDL as any, provider);
    }
  }));

  const amms = await generateAMMs(connection, programs);
  const ammSlice = amms.slice(0, count);

  const pairs = await Promise.all(ammSlice.map(async (amm) => {
    if (!amm.mintPubkey) return null;

    let relevantMint: PublicKey;
    let isBondingCurve: boolean;

    if (BONDING_CURVE_PROGRAM_IDS.includes(amm.programId as string)) {
      // Bonding curve AMM (single token)
      relevantMint = amm.mintPubkey;
      isBondingCurve = true;
    } else if (amm.programId === LP_PROGRAM_ID) {
      // LP AMM
      const poolInfo = await connection.getAccountInfo(amm.mintPubkey);
      if (!poolInfo || !poolInfo.data) return null;
      const decodedPoolInfo = CpmmPoolInfoLayout.decode(poolInfo.data);
      relevantMint = decodedPoolInfo.mintLp;
      isBondingCurve = false;
    } else {
      console.error(`Unknown program ID: ${amm.programId}`);
      return null;
    }

    const mintInfo = await connection.getParsedAccountInfo(relevantMint);
    if (!mintInfo.value) return null;

    // Fetch metadata and Birdeye data for the relevant mint
    const [metadataResult] = await fetchTokenMetadata([relevantMint.toBase58()]);
    const [birdeyeResult] = await fetchBirdeyeData([relevantMint.toBase58()]);
    
    const metadata = {...metadataResult?.content,...metadataResult.content.metadata};
    const birdeyeData = birdeyeResult;
    const age = await calculateAge(connection, relevantMint);
    
    return {
      id: amms.indexOf(amm) + 1,
      token: metadata?.name || birdeyeData?.name || 'Unknown',
      price: birdeyeData?.price ? `$${birdeyeData.price.toFixed(6)}` : 'N/A',
      age: age?.toString() ?? 'N/A',
      buys: birdeyeData?.buy24h ?? 'N/A',
      sells: birdeyeData?.sell24h ?? 'N/A',
      volume: birdeyeData?.v24hUSD
        ? `$${birdeyeData.v24hUSD.toFixed(2)}`
        : 'N/A',
      makers: birdeyeData?.uniqueWallet24h ?? 'N/A',
      '5m': birdeyeData?.priceChange30mPercent
        ? `${birdeyeData.priceChange30mPercent.toFixed(2)}%`
        : 'N/A',
      '1h': birdeyeData?.priceChange1hPercent
        ? `${birdeyeData.priceChange1hPercent.toFixed(2)}%`
        : 'N/A',
      '6h': birdeyeData?.priceChange6hPercent
        ? `${birdeyeData.priceChange6hPercent.toFixed(2)}%`
        : 'N/A',
      '24h': birdeyeData?.priceChange24hPercent
        ? `${birdeyeData.priceChange24hPercent.toFixed(2)}%`
        : 'N/A',
      liquidity: birdeyeData?.liquidity
        ? `$${birdeyeData.liquidity.toFixed(2)}`
        : 'N/A',
      mcap: birdeyeData?.mc ? `$${birdeyeData.mc.toFixed(2)}` : 'N/A',
      mint: {
        address: relevantMint.toBase58(),
        metadata: {
          description: metadata?.description || null,
          image: metadata?.image || birdeyeData?.logoURI || null,
          name: metadata?.name || birdeyeData?.name || null,
          symbol: metadata?.symbol || birdeyeData?.symbol || null,
        },
        birdeyeData,
      },
      programId: amm.programId,
      isBondingCurve,
    };
  }));

  return pairs.filter(Boolean);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '200', 10);
  const pairs = await generatePairs(count);

  // Convert BigInt values to strings before JSON serialization
  const serializedPairs = pairs.map((pair) => {
    return Object.fromEntries(
      Object.entries(pair as any).map(([key, value]) => {
        if (typeof value === 'bigint') {
          return [key, value.toString()];
        }
        return [key, value];
      })
    );
  });

  return NextResponse.json(serializedPairs);
}