import { NextResponse } from 'next/server';

const randomImages = [
  "https://cdn.dexscreener.com/cms/images/0tZZqAG6HlWujfGI?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/1guEcvKhme-YNIdN?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/IDpdes8WFkjzbs3U?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/UlnqZA7xlUwgTN3T?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/rju4lVYLH_Kvw5Pb?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/MetlE3bcCvmL4mOu?width=160&height=160&fit=crop&quality=95&format=auto",
  "https://cdn.dexscreener.com/cms/images/am2kxHelmFSgrpnA?width=160&height=160&fit=crop&quality=95&format=auto"
];

const mockData = Array.from({ length: 20 }, (_, index) => ({
  id: index + 1,
  image: randomImages[Math.floor(Math.random() * randomImages.length)],
  shortName: `Coin${index + 1}`,
  name: `Coin Name ${index + 1}`,
  summary: `This is a summary for Coin Name ${index + 1}.`,
  percentComplete: Math.floor(Math.random() * 100),
  txns: Math.floor(Math.random() * 1000),
  totalVolume: `${(Math.random() * 100000).toFixed(2)}`,
  twitter: "https://twitter.com",
  telegram: "https://t.me",
  website: "https://example.com"
}));

export async function GET() {
  return NextResponse.json(mockData);
}
