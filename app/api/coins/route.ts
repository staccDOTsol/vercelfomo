import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export async function GET(request: NextRequest) {
  const redis = new Redis(process.env.REDIS_URL as string);

  try {
    const data = await redis.get('serializedPairsNew');
    if (!data) {
      return NextResponse.json({ error: 'No data found in Redis' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(data as string));
  } catch (error) {
    // Handle any errors
    return NextResponse.json({ error: 'Failed to fetch data from Redis' }, { status: 500 });
  } finally {
    redis.disconnect();
  }
}
