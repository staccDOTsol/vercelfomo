"use client";

import { useParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Peppa from "@/app/assets/images/peppa.avif";
import Image from "next/image";
import { Button, Card, CardBody, Divider, Progress, Tab, Tabs } from "@nextui-org/react";
import SingleTokenSidebar from "@/components/single-token-sidebar";

export default function TokenPage() {
	const { token } = useParams();
	const [devCount, setDevCount] = useState(0);

	const container = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (devCount === 0) {
			setDevCount(1);
			const script = document.createElement("script");
			script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
			script.type = "text/javascript";
			script.async = true;
			script.innerHTML = `
      {
        "autosize": true,
        "symbol": "NASDAQ:AAPL",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "allow_symbol_change": false,
        "backgroundColor": "#000000",
        "border_color": "#272727",
        "calendar": false,
        "support_host": "https://www.tradingview.com"
      }`;
			container?.current?.appendChild(script);
		}
	}, []);

  const demoToken = {
    name: "Peppa",
    symbol: "PEPPA",
    price: 1000,
    marketCap: 23000,
    image: Peppa.src,
  }

	return (
		<div className="grid grid-cols-12 min-h-screen">
			<div className="hidden md:block tradingview-widget-container w-full h-screen col-span-9" ref={container}>
				<div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
			</div>
			<div className="col-span-12 md:col-span-3">
				<SingleTokenSidebar token={demoToken} />
			</div>
		</div>
	);
}
