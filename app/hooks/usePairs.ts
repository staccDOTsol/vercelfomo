import { useQuery } from "@tanstack/react-query";

export default function usePairs(isBondingCurveOnly: boolean = false, isGobblerOnly: boolean = false) {
	const fetchPairs = async () => {
		const response = await fetch("/api/pairs/new?count=500");
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
			select: (data) => data.filter((pair:any) => pair.token !== 'Unknown'),
		queryKey: ["pairs", isBondingCurveOnly, isGobblerOnly],
		queryFn: fetchPairs,
		staleTime: 250000,
	});

	return {
		pairs,
		isLoading,
		error,
	};
}
