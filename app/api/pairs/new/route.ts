import { NextResponse } from 'next/server';

const generateRandomPairs = (count: number) => {
  const tokens = ["SOL", "USDC", "USDT", "ETH", "BTC", "DOGE", "SHIB", "PEPE", "BONK", "MEME"];
  const pairs = [];

  for (let i = 0; i < count; i++) {
    const baseToken = tokens[Math.floor(Math.random() * tokens.length)];
    const quoteToken = tokens[Math.floor(Math.random() * tokens.length)];
    const tokenPair = `${baseToken}/${quoteToken}`;

    const price = (Math.random() * 1000).toFixed(5);
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    const age = `${hours}h ${minutes}m`;
    const buys = Math.floor(Math.random() * 10000) + 1000;
    const sells = Math.floor(Math.random() * 10000) + 1000;
    const volume = `$${(Math.random() * 10).toFixed(1)}M`;
    const makers = Math.floor(Math.random() * 5000) + 500;
    const generatePercentage = () => `${(Math.random() * 200 - 100).toFixed(2)}%`;
    const liquidity = `$${(Math.random() * 1000).toFixed(0)}k`;
    const mcap = `$${(Math.random() * 10).toFixed(1)}M`;

    pairs.push({
      id: i + 1,
      token: tokenPair,
      price: `$${price}`,
      age,
      buys,
      sells,
      volume,
      makers,
      "5m": generatePercentage(),
      "1h": generatePercentage(),
      "6h": generatePercentage(),
      "24h": generatePercentage(),
      liquidity,
      mcap,
    });
  }

  return pairs;
};

const pairs = generateRandomPairs(200);

export async function GET() {
  return NextResponse.json(pairs);
}
