import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '29000', 10);
  const search = searchParams.get('search') || '';

  const redis = new Redis(REDIS_URL as string);

  try {
    // Attempt to retrieve serialized pairs from Redis
    const serializedPairsNew = await redis.get('serializedPairsNew');

    if (serializedPairsNew) {
      // If data exists in Redis, parse it and return
      const pairs = JSON.parse(serializedPairsNew);
      const searchInObject = (obj: any, searchTerm: string): boolean => {
        if (typeof obj !== 'object' || obj === null) {
          return false;
        }
        
        return Object.values(obj).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          if (typeof value === 'object') {
            return searchInObject(value, searchTerm);
          }
          return false;
        });
      };
      
      const filteredPairs = pairs.filter((pair: any) => {
        return searchInObject(pair, search);
      });

      // Log the search query for debugging
      console.log(`Search query: ${search}`);

      // Log the number of filtered pairs
      console.log(`Number of filtered pairs: ${filteredPairs.length}`);

      // Return the filtered and sliced pairs
      return NextResponse.json(filteredPairs.slice(0, count));
    } else {
      // If data doesn't exist in Redis, return an empty array or handle as needed
      console.warn('No pairs data found in Redis cache');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error retrieving pairs from Redis:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await redis.disconnect();
  }
}
