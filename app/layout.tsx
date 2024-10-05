"use client";
import "@/styles/globals.css";
import clsx from "clsx";

import { Jersey_10 } from "next/font/google";

import SidebarContainer from "@/components/sidebar-container";

import { Providers } from "./providers";

import { useState } from "react";
import { motion } from "framer-motion";
import MenuButton from "@/components/menu-button";

const jersey = Jersey_10({
	subsets: ["latin"],
	weight: ["400"],
	variable: "--font-jersey",
	fallback: ["sans-serif"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<html suppressHydrationWarning lang="en">
			<head />
			<body className={clsx("min-h-screen bg-background antialiased", jersey.className)}>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<div className="h-dvh flex">
						<motion.div
							initial={{ x: "-100%" }}
							animate={{ x: isSidebarOpen ? 0 : "-100%" }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className="absolute z-10 h-screen"
						>
							<SidebarContainer toggleSidebar={toggleSidebar} />
						</motion.div>

						<div className="flex flex-col flex-1">
							<MenuButton toggleSidebar={toggleSidebar} />

							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
