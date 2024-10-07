import { useQuery } from "@tanstack/react-query";

export default function usePairs() {
	const fetchActivity = async () => {
		const response = await fetch("/api/activity");
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		return response.json();
	};

	const {
		data: activity,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["activity"],
		queryFn: fetchActivity,
		staleTime: 250000,
	});

	return {
		activity,
		isLoading,
		error,
	};
}
