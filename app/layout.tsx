"use client";
import "@/styles/globals.css";
import clsx from "clsx";

import SidebarContainer from "@/components/sidebar-container";

import { Providers } from "./providers";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MenuButton from "@/components/menu-button";

function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth <= 768); // Example breakpoint for mobile
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);

		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	return isMobile;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const isMobile = useIsMobile(); // Add this line

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
							animate={{ x: isMobile ? (isSidebarOpen ? 0 : "-100%") : 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className="absolute md:relative z-10 h-screen"
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
