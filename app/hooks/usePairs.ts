import { useQuery } from "@tanstack/react-query";

export default function usePairs() {
	const fetchCoins = async () => {
		const response = await fetch("/api/pairs/new");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		return response.json();
	};

	const {
		data: pairs,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["coins"],
		queryFn: fetchCoins,
		staleTime: 250000,
	});

	return {
		pairs,
		isLoading,
		error,
	};
}
