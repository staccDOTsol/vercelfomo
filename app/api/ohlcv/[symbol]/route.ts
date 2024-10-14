import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import BN from 'bn.js'
import {CpmmPoolInfoLayout} from 'tokengobbler'

// AMM class remains the same for programs[0] and programs[1]
class AMM {
    constructor(
      public virtualSolReserves: bigint,
      public virtualTokenReserves: bigint,
      public realSolReserves: bigint,
      public realTokenReserves: bigint,
      public initialVirtualTokenReserves: bigint,
    ) {}
    metadata:
      | {
          image: string | null;
          name: string | null;
          symbol: string | null;
        }
      | null = null;
    mintPubkey: PublicKey | null = null;
    programId: string | null = null;
    apiV3Token: any | null = null;
  
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
  
  // New AMM class for LP_PROGRAM_ID with different price assessment
  class LPAMM {
    constructor(
      public virtualSolReserves: bigint,
      public virtualTokenReserves: bigint,
      public realSolReserves: bigint,
      public realTokenReserves: bigint,
      public initialVirtualTokenReserves: bigint,
      public mintPubkey: PublicKey
    ) {}
    // Implement different price assessment methods based on the Rust code
    // ... implement methods like getBuyPrice, getSellPrice, applyBuy, applySell ...
  }
const REDIS_URL = process.env.REDIS_URL as string;
const RPC_URL = 'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW';

const redis = new Redis(REDIS_URL);
const connection = new Connection(RPC_URL);

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    // The key in Redis is 'OHLCV:<mint_address>'
    const ohlcvKey = `OHLCV:${symbol}`;
    let ohlcvJson = await redis.hget(ohlcvKey, 'data');

    if (!ohlcvJson) {
      console.error(`No OHLCV data found for symbol: ${symbol}`);
      return NextResponse.json(
        { error: 'No OHLCV data found for this symbol' },
        { status: 404 }
      );
    }

    let ohlcvData = JSON.parse(ohlcvJson);

    // Filter out empty objects from the data
    let filteredOhlcvData: any = ohlcvData.filter(
      (item: any) => Object.keys(item).length > 0
    );

    // Update OHLCV data
    const mintPubkey = new PublicKey(symbol);
    const amm = await createAMM(connection, mintPubkey);
    if (amm) {
      const currentPrice = await getCurrentPrice(amm, connection);

      // Create a new OHLCV data point
      const newOHLCV: any = createNewOHLCVData(currentPrice);

      // Ensure the data is in ascending order by time
      filteredOhlcvData = filteredOhlcvData.map((item: any) => ({
        ...item,
        timestamp: item.timestamp || item[1]
      })).sort((a: any, b: any) => a.timestamp - b.timestamp);

      // Add the new OHLCV data point
      filteredOhlcvData.push(newOHLCV);

      // Deduplicate, sort, and ensure ascending order
      filteredOhlcvData = filteredOhlcvData
        .filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.timestamp === item.timestamp)
        )
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

      // Final check to remove any remaining out-of-order entries
      filteredOhlcvData = filteredOhlcvData.reduce((acc: any[], current: any) => {
        if (acc.length === 0 || current.timestamp > acc[acc.length - 1].timestamp) {
          acc.push(current);
        } else {
          console.error(`Removed out-of-order entry with timestamp: ${current.timestamp}`);
        }
        return acc;
      }, []);

      // Store updated OHLCV data back to Redis
      await redis.hset(ohlcvKey, 'data', JSON.stringify(filteredOhlcvData));
    }
    console.log(filteredOhlcvData);
    return NextResponse.json(filteredOhlcvData);
  } catch (error) {
    console.error('Error fetching or updating OHLCV data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch or update OHLCV data' },
      { status: 500 }
    );
  }
}

const PROGRAM_IDS = [
    '65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9',
    'Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r',
  ];
const LP_PROGRAM_ID = 'CVF4q3yFpyQwV8DLDiJ9Ew6FFLE1vr5ToRzsXYQTaNrj';

const ammCache = new Map<string, AMM | LPAMM>();

async function createAMM(connection: Connection, mintPubkey: PublicKey): Promise<AMM | LPAMM | null> {
  const cacheKey = mintPubkey.toBase58();
  if (ammCache.has(cacheKey)) {
    return ammCache.get(cacheKey)!;
  }

  let amm: AMM | LPAMM | null = null;

  for (const programId of PROGRAM_IDS) {
    const [pubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPubkey.toBuffer()],
      new PublicKey(programId)
    );
    const accountInfo = await connection.getAccountInfo(pubkey);
    if (accountInfo) {
      const data = Buffer.from(accountInfo.data).slice(8);
      amm = new AMM(
        data.readBigUInt64LE(0),
        data.readBigUInt64LE(8),
        data.readBigUInt64LE(16),
        data.readBigUInt64LE(24),
        data.readBigUInt64LE(32),
      );
      break;
    }
  }

  if (!amm) {
    const poolInfo = await connection.getAccountInfo(mintPubkey);
    if (poolInfo && poolInfo.owner.equals(new PublicKey(LP_PROGRAM_ID))) {
      const poolState = poolInfo.data.slice(CpmmPoolInfoLayout.span);
      const poolAmm = {
        virtual_sol_reserves: poolState.readBigUInt64LE(0),
        virtual_token_reserves: poolState.readBigUInt64LE(8),
        real_sol_reserves: poolState.readBigUInt64LE(16),
        real_token_reserves: poolState.readBigUInt64LE(24),
        initial_virtual_token_reserves: poolState.readBigUInt64LE(32)
      };
      amm = new LPAMM(
        BigInt(poolAmm.virtual_sol_reserves.toString()),
        BigInt(poolAmm.virtual_token_reserves.toString()),
        BigInt(poolAmm.real_sol_reserves.toString()),
        BigInt(poolAmm.real_token_reserves.toString()),
        BigInt(poolAmm.initial_virtual_token_reserves.toString()),
        mintPubkey
      );
    }
  }

  if (amm) {
    ammCache.set(cacheKey, amm);
  }

  return amm;
}

const priceCache = new Map<string, { price: number, timestamp: number }>();
const PRICE_CACHE_TTL = 60000; // 1 minute

async function getCurrentPrice(amm: AMM | LPAMM, connection: Connection): Promise<number> {
  const cacheKey = amm instanceof LPAMM ? amm.mintPubkey.toBase58() : 'AMM';
  const cachedPrice = priceCache.get(cacheKey);
  
  if (cachedPrice && Date.now() - cachedPrice.timestamp < PRICE_CACHE_TTL) {
    return cachedPrice.price;
  }

  let price: number;

  if (amm instanceof AMM) {
    const solAmount = amm.getBuyPrice(BigInt(1000000)); // 1 token
    price = Number(solAmount) / 1e9; // Convert lamports to SOL
  } else if (amm instanceof LPAMM) {
    const poolInfo = await connection.getAccountInfo(amm.mintPubkey);
    if (!poolInfo || !poolInfo.data) {
      throw new Error('Failed to fetch pool info');
    }
    const poolState = poolInfo.data.slice(CpmmPoolInfoLayout.span);
    const poolAmm = {
      virtual_sol_reserves: poolState.readBigUInt64LE(0),
      virtual_token_reserves: poolState.readBigUInt64LE(8),
      real_sol_reserves: poolState.readBigUInt64LE(16),
      real_token_reserves: poolState.readBigUInt64LE(24)
    };
    
    const virtualPrice = Number(poolAmm.virtual_sol_reserves.toString()) / Number(poolAmm.virtual_token_reserves.toString());
    const realPrice = Number(poolAmm.real_sol_reserves.toString()) / Number(poolAmm.real_token_reserves.toString());
    price = (virtualPrice + realPrice) / 2;
  } else {
    throw new Error("Unknown AMM type");
  }

  priceCache.set(cacheKey, { price, timestamp: Date.now() });
  return price;
}

function createNewOHLCVData(currentPrice: number) {
  const now = Date.now() / 1000;

  return {
    open: currentPrice,
    high: currentPrice,
    low: currentPrice,
    close: currentPrice,
    timestamp: now,
    open5m: currentPrice,
    timestamp5m: now,
    open1h: currentPrice,
    timestamp1h: now,
    open6h: currentPrice,
    timestamp6h: now,
    open24h: currentPrice,
    timestamp24h: now,
  };
}