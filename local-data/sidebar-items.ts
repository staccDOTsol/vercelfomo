interface SidebarItem {
  key: string;
  href: string;
  icon: string;
  title: string;
}

export const sidebarItems: SidebarItem[] = [
	{
		key: "watchlist",
		href: "/",
		icon: "solar:star-bold",
		title: "Watchlist",
	},
	{
		key: "alerts",
		href: "#",
		icon: "solar:bell-bold",
		title: "Alerts",
	},
	{
		key: "multicharts",
		href: "/multi-chart",
		icon: "solar:code-scan-bold",
		title: "Multicharts",
	},
	{
		key: "new-pairs",
		href: "#",
		icon: "solar:leaf-bold",
		title: "New Pairs",
	},
	{
		key: "gainers-losers",
		href: "#",
		icon: "solar:chart-square-bold",
		title: "Gainers and Losers",
	},
	{
		key: "portfolio",
		href: "#",
		icon: "solar:wallet-2-bold",
		title: "Portfolio",
	},
];