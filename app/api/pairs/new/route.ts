import { NextResponse } from 'next/server';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '29000', 10);

  const redisClient = createClient({ url: REDIS_URL });
  await redisClient.connect();

  try {
    // Attempt to retrieve serialized pairs from Redis
    const serializedPairsNew = await redisClient.get('serializedPairsNew');

    if (serializedPairsNew) {
      // If data exists in Redis, parse it and return
      const pairs = JSON.parse(serializedPairsNew);
      return NextResponse.json(pairs.slice(0, count));
    } else {
      // If data doesn't exist in Redis, return an empty array or handle as needed
      console.warn('No pairs data found in Redis cache');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error retrieving pairs from Redis:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await redisClient.disconnect();
  }
}