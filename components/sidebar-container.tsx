"use client";
import { Image } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Sidebar, { SidebarItem } from "@/components/sidebar";
import Logo from "@/app/assets/images/logo_color.svg";

import {
	Button,
	Input,
	ScrollShadow,
	Spacer,
	User,
} from "@nextui-org/react";
import { useState, useEffect } from "react";

const sidebarItems: SidebarItem[] = [
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

const user = {
  id: 1,
  name: "Jonathon",
  avatar: "https://i.pravatar.cc/150?img=3",
}

export default function SidebarContainer({ toggleSidebar }: { toggleSidebar: () => void }) {

	return (
		<div className="fixed top-0 left-0 flex h-full w-72 flex-col border-r-small border-divider p-6 bg-black">
      <Button onClick={toggleSidebar} className="absolute top-4 right-4 bg-transparent md:hidden" size="md" isIconOnly>
      <Icon icon="material-symbols-light:close" width={30} />
      </Button>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 px-2 w-full justify-center">
					<Image src={Logo.src} alt="Logo" width={150} height={150} />
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
				/>
			</div>

			<ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
				<Sidebar
					defaultSelectedKey={'watchlist'}
					iconClassName="group-data-[selected=true]:text-primary-foreground"
					itemClasses={{
						base: "data-[selected=true]:bg-primary-400 dark:data-[selected=true]:bg-[#9648fe] data-[hover=true]:bg-default-300/20 dark:data-[hover=true]:bg-default-200/40",
						title: "group-data-[selected=true]:text-primary-foreground",
					}}
					items={sidebarItems}
				/>
				<Spacer y={8} />
			</ScrollShadow>

			<Button className="mb-4 h-16 items-center justify-between" variant="light">
				<User
					avatarProps={{
						size: "sm",
						isBordered: false,
						src: user.avatar,
					}}
					className="justify-start transition-transform"
					name={user.name}
				/>
				<Icon className="text-default-400" icon="lucide:chevrons-up-down" width={16} />
			</Button>
		</div>
	);
};
