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
const PROGRAM_IDS = ['65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9', 'Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r'];
const LP_PROGRAM_ID = 'CVF4q3yFpyQwV8DLDiJ9Ew6FFLE1vr5ToRzsXYQTaNrj';
const cache = new Map();

async function fetchWithRetry(url: string, options: any, retries = 5, backoff = 300) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const jsonData = await response.json();
        cache.set(cacheKey, jsonData);
        return jsonData;
      }
      if (response.status !== 429) throw new Error(`HTTP error! status: ${response.status}`);
      console.log(`Rate limited. Retrying in ${backoff}ms...`);
    } catch (error) {
      console.log(`Error occurred. Retrying in ${backoff}ms...`, error);
      if (i === retries - 1) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, backoff));
    backoff *= 2;
  }
}

async function fetchTokenMetadata(mintAddresses: string[]) {
  try {
    const response = await fetchWithRetry(HELIUS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetBatch',
        params: { ids: mintAddresses },
      }),
    });
    
    return response.result.map((asset: any) => ({
      id: asset.id,
      content: {
        metadata: asset.content?.metadata,
        links: asset.content?.links,
        image: asset.content?.files?.[0]?.uri || asset.content?.links?.image || 'https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api/get-asset/get-asset-batch'
      }
    }));
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
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-chain': 'solana',
      'X-API-KEY': BIRDEYE_API_KEY,
    },
  };

  try {
    const fetchPromises = tokenAddresses.map(address => 
      fetchWithRetry(`${BIRDEYE_BASE_URL}/token_overview?address=${address}`, options)
        .then(jsonData => jsonData.success ? jsonData.data : null)
        .catch(error => {
          console.error(`Error fetching or parsing data for address: ${address}`, error);
          return null;
        })
    );

    return await Promise.all(fetchPromises);
  } catch (err) {
    console.error('Error fetching Birdeye data:', err);
    return tokenAddresses.map(() => null);
  }
}

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
    return newVirtualSolReserves - this.virtualSolReserves;
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
  const allAccountsData = await Promise.all(PROGRAM_IDS.map(programId => fetchProgramAccounts(connection, programId)));

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
      const amm = new AMM(
        data.readBigUInt64LE(0),
        data.readBigUInt64LE(8),
        data.readBigUInt64LE(16),
        data.readBigUInt64LE(24),
        data.readBigUInt64LE(32),
        program
      );
      amm.programId = programId;

      const signatures = await connection.getSignaturesForAddress(account.pubkey, { limit: 50 });
      const transactions = await connection.getParsedTransactions(signatures.map((sig) => sig.signature), {maxSupportedTransactionVersion: 0});

      for (const tx of transactions) {
        if (!tx) continue;
        for (const tokenTransfer of tx.meta?.postTokenBalances ?? []) {
          const [maybeUs] = PublicKey.findProgramAddressSync(
            [Buffer.from('bonding-curve'), new PublicKey(tokenTransfer.mint).toBuffer()],
            new PublicKey(programId)
          );
          if (maybeUs.equals(account.pubkey)) {
            amm.mintPubkey = new PublicKey(tokenTransfer.mint);
            amm.apiV3Token = toApiV3Token({
              address: amm.mintPubkey.toBase58(),
              programId: programId === '65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9'
                ? TOKEN_2022_PROGRAM_ID.toString()
                : TOKEN_PROGRAM_ID.toString(),
              decimals: 6,
            });
            amms.push(amm);
            return;
          }
        }
      }
    });

    await Promise.all(ammPromises);
  }

  const mintAddresses = amms.map(amm => amm.mintPubkey?.toBase58()).filter(Boolean) as string[];
  const [metadataResults, birdeyeResults] = await Promise.all([
    fetchTokenMetadata(mintAddresses),
    fetchBirdeyeData(mintAddresses)
  ]);

  amms.forEach((amm, index) => {
    const metadata = metadataResults[index];
    amm.metadata = metadata?.content?.metadata
      ? {
          image: metadata.content.links?.image || null,
          name: metadata.content.metadata.name || null,
          symbol: metadata.content.metadata.symbol || null,
        }
      : null;
    amm.birdeyeData = birdeyeResults[index];
  });

  return amms;
}

async function calculateAge(connection: Connection, address: PublicKey): Promise<number | null> {
  try {
    const transactions = await connection.getSignaturesForAddress(address, { limit: 1 });
    if (transactions.length === 0 || !transactions[0].blockTime) return null;
    return Math.floor(Date.now() / 1000) - transactions[0].blockTime;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

async function generatePairs(count: number) {
  const connection = new Connection(
    'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW'
  );

  const programs: { [key: string]: Program<any> } = {};
  // @ts-ignore
  const provider = new AnchorProvider(connection, undefined, {})

  const allProgramIds = [...PROGRAM_IDS, LP_PROGRAM_ID];
  await Promise.all(allProgramIds.map(async (programId) => {
    const IDL = await Program.fetchIdl(new PublicKey(programId), provider);
    if (IDL) {
      programs[programId] = new Program(IDL, provider);
    }
  }));

  const amms = await generateAMMs(connection, programs);
  const ammSlice = amms.slice(0, count);

  const pairs = await Promise.all(ammSlice.map(async (amm) => {
    if (!amm.mintPubkey) return null;

    let relevantMint: PublicKey;
    let isBondingCurve: boolean;

    if (PROGRAM_IDS.includes(amm.programId as string)) {
      relevantMint = amm.mintPubkey;
      isBondingCurve = true;
    } else if (amm.programId === LP_PROGRAM_ID) {
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
      volume: birdeyeData?.v24hUSD ? `$${birdeyeData.v24hUSD.toFixed(2)}` : 'N/A',
      makers: birdeyeData?.uniqueWallet24h ?? 'N/A',
      '5m': birdeyeData?.priceChange30mPercent ? `${birdeyeData.priceChange30mPercent.toFixed(2)}%` : 'N/A',
      '1h': birdeyeData?.priceChange1hPercent ? `${birdeyeData.priceChange1hPercent.toFixed(2)}%` : 'N/A',
      '6h': birdeyeData?.priceChange6hPercent ? `${birdeyeData.priceChange6hPercent.toFixed(2)}%` : 'N/A',
      '24h': birdeyeData?.priceChange24hPercent ? `${birdeyeData.priceChange24hPercent.toFixed(2)}%` : 'N/A',
      liquidity: birdeyeData?.liquidity ? `$${birdeyeData.liquidity.toFixed(2)}` : 'N/A',
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