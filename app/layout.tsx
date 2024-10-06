"use client";
import "@/styles/globals.css";
import clsx from "clsx";

import SidebarContainer from "@/components/sidebar-container";

import { Providers } from "./providers";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import MenuButton from "@/components/menu-button";
import { Icon } from "@iconify/react";
import { Button } from "@nextui-org/react";
import TopMenu from "@/components/top-menu";

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
			<body className={clsx("min-h-screen bg-background antialiased jersey-10-regular")}>
				<Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
					<div className="h-dvh flex">
						<motion.div
							initial={{ x: "-100%" }}
							animate={{ x: isMobile ? (isSidebarOpen ? 0 : "-100%") : 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className="fixed top-0 left-0 z-50 h-screen w-72"
						>
							<SidebarContainer toggleSidebar={toggleSidebar} />
						</motion.div>

						<div className={`flex flex-col flex-1 md:pl-72 ${isSidebarOpen ? "h-0 overflow-hidden" : ""}`}>
              <TopMenu />

							<MenuButton toggleSidebar={toggleSidebar} />

							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
