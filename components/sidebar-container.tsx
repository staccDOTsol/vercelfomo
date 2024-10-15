"use client";

import { Image, Link } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/sidebar";
import Logo from "@/app/assets/images/logo_color.svg";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import useDebounce from "@/app/hooks/useDebounce";
import { sidebarItems } from "@/local-data/sidebar-items";

import { Button, Input, ScrollShadow, Spacer, User } from "@nextui-org/react";
import { WalletDisconnectButton, WalletModalButton } from "@solana/wallet-adapter-react-ui";
import SearchResultCard from "./SearchResultCard";

export default function SidebarContainer({ toggleSidebar, isSidebarOpen }: { toggleSidebar: () => void; isSidebarOpen: boolean }) {
	const { connected } = useWallet();

	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const [searchResults, setSearchResults] = useState([]);

	useEffect(() => {
		if (debouncedSearchQuery) {
			fetch(`/api/pairs/new?search=${encodeURIComponent(debouncedSearchQuery)}`)
				.then(response => response.json())
				.then(data => setSearchResults(data))
				.catch(error => console.error('Error fetching search results:', error));
		} else {
			setSearchResults([]);
		}
	}, [debouncedSearchQuery]);

	return (
		<>
			<div className="fixed top-0 left-0 flex h-full w-72 flex-col border-r-small border-divider p-6 bg-black z-50">
				<Button onClick={toggleSidebar} className="absolute top-4 right-4 bg-transparent md:hidden" size="md" isIconOnly aria-label="Close">
					<Icon icon="material-symbols-light:close" width={30} />
				</Button>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 px-2 w-full justify-center">
						<Link href="/">
							<Image src={Logo.src} alt="Logo" width={150} height={150} />
						</Link>
					</div>
				</div>

				<Spacer y={8} />

				<div className="flex flex-col gap-y-2">
					<Input
						fullWidth
						aria-label="search"
						classNames={{
							base: "px-1",
							inputWrapper: "dark:bg-default-50",
						}}
						labelPlacement="outside"
						placeholder="Search..."
						startContent={<Icon className="text-default-500 [&>g]:stroke-[2px]" icon="solar:magnifer-linear" width={18} />}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
					{searchResults.length > 0 ? (
						<div className="mb-4">
							{searchResults.map((result: any, index: number) => (
								<Link key={index} href={`/token/${result.mint.address}`}>
									<SearchResultCard result={result} />
								</Link>
							))}
						</div>
					) : (
						<Sidebar isSidebarOpen={isSidebarOpen} items={sidebarItems} toggleSidebar={toggleSidebar} />
					)}
					<Spacer y={8} />
				</ScrollShadow>

				<Spacer y={8} />

				{connected ? <WalletDisconnectButton /> : <WalletModalButton />}
			</div>
		</>
	);
}
