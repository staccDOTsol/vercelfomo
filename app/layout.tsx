"use client";
import "@/styles/globals.css";
import clsx from "clsx";

import SidebarContainer from "@/components/sidebar-container";

import { Providers } from "./providers";

import { useState } from "react";
import { motion } from "framer-motion";
import MenuButton from "@/components/menu-button";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	return (
		<html suppressHydrationWarning lang="en">
			<head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jersey+10&display=swap" rel="stylesheet" />
      </head>
			<body className={clsx("min-h-screen bg-background antialiased jersey-10-regular")}>
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
