import { NextResponse } from 'next/server';

const tableData = Array.from({ length: 100 }).map(() => ({
  timeAgo: `${Math.floor(Math.random() * 60) + 1}m ago`,
  type: Math.random() > 0.5 ? 'Buy' : 'Sell',
  usd: (Math.random() * 10).toFixed(2),
  fomo3dFun: (Math.random() * 1000).toFixed(2),
  sol: (Math.random() * 0.1).toFixed(5),
  price: (Math.random() * 0.1).toFixed(5),
  maker: Math.random().toString(36).substring(2, 8),
}));

export async function GET() {
  return NextResponse.json({
    success: true,
    data: tableData,
    total: tableData.length,
  });
}
