"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { usePathname } from "next/navigation";

interface SidebarItem {
  key: string;
  href: string;
  icon: string;
  title: string;
}

export default function Sidebar({ defaultSelectedKey, items, toggleSidebar }: { defaultSelectedKey: string; items: SidebarItem[]; toggleSidebar: () => void }) {
	const [activePage, setActivePage] = useState("");

  const pathName = usePathname();

  const getActivePage = () => {
    if (!pathName) return "";

		switch (true) {
      case pathName === "/":
        return "watchlist"
      case /^\/multi-chart(\/.*)?$/.test(pathName): 
        return "multicharts" 
			default:
				return "";
		}
  }


	return (
		<div className="flex flex-col gap-2 px-2 z-50">
			{items.map((item: SidebarItem) => (
				<Link
					key={item.key}
					href={item.href}
					className={`flex items-center gap-2 text-lg rounded-xl py-1 px-2 ${getActivePage() === item.key ? "bg-primary/50 text-white/100" : "text-white/50"}`}
          onClick={() => {
            toggleSidebar();
          }}
				>
					<Icon icon={item.icon} width={20} />
					<span className="pt-1">{item.title}</span>
				</Link>
			))}
		</div>
	);
}
