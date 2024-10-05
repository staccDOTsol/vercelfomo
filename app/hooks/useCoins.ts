import { useQuery } from "@tanstack/react-query";

export default function useCoins() {
	const fetchCoins = async () => {
		const response = await fetch("/api/coins");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		return response.json();
	};

	const {
		data: coins,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["coins"],
		queryFn: fetchCoins,
		staleTime: 250000,
	});

	return {
		coins,
		isLoading,
		error,
	};
}
