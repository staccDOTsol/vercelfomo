import { useQuery } from '@tanstack/react-query';

const fetchCoins = async () => {
  const response = await fetch('/api/coins');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const useCoins = () => {
  return useQuery({ queryKey: ['coins'], queryFn: fetchCoins });
};
