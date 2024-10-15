import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const CACHE_TTL = 3600; // 1 hour
const CACHE_STALE_TTL = 300; // 5 minutes

let redisClient: Redis | null = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL as string);
  }
  return redisClient;
}

export async function GET(request: NextRequest) {
  const redis = getRedisClient();
  const searchQuery = request.nextUrl.searchParams.get('search') || '';

  try {
    const cacheKey = searchQuery ? `filteredTokens:${searchQuery}` : 'allTokens';
    
    // Try to get data from cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      
      // If cache is not stale, return immediately
      if (Date.now() - timestamp < CACHE_STALE_TTL * 1000) {
        return NextResponse.json(data);
      }
      
      // If cache is stale, return stale data and refresh in background
      refreshCache(redis, searchQuery).catch(console.error);
      return NextResponse.json(data);
    }

    // If no cache, fetch and cache data
    const tokens = await fetchAndCacheTokens(redis, searchQuery);
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Failed to fetch or filter tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch or filter tokens' }, { status: 500 });
  }
}

async function fetchAndCacheTokens(redis: Redis, searchQuery: string) {
  const response = await fetch('https://cache.jup.ag/all-tokens');
  const fetchedTokens = await response.json();
  const tokens = fetchedTokens.map((token: any) => ({
    address: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
  }));

  const filteredTokens = searchQuery
    ? tokens.filter((token: any) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tokens;

  const cacheKey = searchQuery ? `filteredTokens:${searchQuery}` : 'allTokens';
  const cacheValue = JSON.stringify({ data: filteredTokens, timestamp: Date.now() });
  
  await redis.set(cacheKey, cacheValue, 'EX', CACHE_TTL).catch(console.error);
  
  return filteredTokens;
}

async function refreshCache(redis: Redis, searchQuery: string) {
  await fetchAndCacheTokens(redis, searchQuery);
}