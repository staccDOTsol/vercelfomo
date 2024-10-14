import { useQuery } from '@tanstack/react-query';

interface Pair {
  id: number;
  token: string;
  price: string;
  age: string;
  buys: string | number;
  sells: string | number;
  volume: string;
  makers: string | number;
  '5m': string;
  '1h': string;
  '6h': string;
  '24h': string;
  liquidity: string;
  mcap: string;
  mint: {
    address: string;
    metadata: {
      description: string | null;
      image: string | null;
      name: string | null;
      symbol: string | null;
    };
    birdeyeData: any;
  };
  programId: string;
  isBondingCurve: boolean;
}

const fetchPair = async (mint: string) => {
    const response = await fetch('/api/pairs/new');
    if (!response.ok) {
      throw new Error('Failed to fetch pair data');
    }
    const pairs: Pair[] = await response.json();
    const foundPair = pairs.find(p => p.mint.address === mint);
    if (!foundPair) {
      throw new Error('Pair not found');
    }
    return foundPair;
  };
  
  const usePair = (mint: string) => {
    const {
      data: pair,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["pair", mint],
      queryFn: () => fetchPair(mint),
      staleTime: 250000, // 4 minutes and 10 seconds, matching useCoins
    });
  
    return { pair, isLoading, error };
  };
  
  export default usePair;