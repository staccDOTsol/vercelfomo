"use client";

import { useParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Peppa from "@/app/assets/images/peppa.png";
import useActivity from "@/app/hooks/useActivty";
import { Button, Card, CardBody, Divider, Progress, Spinner, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs } from "@nextui-org/react";
import SingleTokenSidebar from "@/components/single-token-sidebar";
import { Icon } from "@iconify/react";

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
	};

  const { activity, isLoading, error } = useActivity();

	return (
		<div className="grid grid-cols-12" style={{ height: "calc(100vh - 60px)" }}>
			<div className="flex flex-col col-span-12 md:col-span-9 order-2 md:order-first">
				<div className="flex-1">
					<div className="hidden md:block tradingview-widget-container w-full h-screen single-chart overflow-hidden" ref={container}>
						<div className="tradingview-widget-container__widget flex-1" style={{ height: "60%", width: "100%" }}></div>
					</div>
				</div>
				<div className="bg-black/80 w-full h-[450px]">
					<div className="h-full">
						<Table
              isHeaderSticky
              isStriped
              className="h-full"
              classNames={{
                base: "h-full overflow-scroll rounded-none",
                wrapper: "rounded-none",
              }}
            >
							<TableHeader>
								<TableColumn className="text-md text-white">Date</TableColumn>
								<TableColumn className="text-md text-white">Type</TableColumn>
								<TableColumn className="text-md text-white">USD</TableColumn>
								<TableColumn className="text-md text-white">FOMO3D FUN</TableColumn>
								<TableColumn className="text-md text-white">SOL</TableColumn>
								<TableColumn className="text-md text-white">PRICE</TableColumn>
								<TableColumn className="text-md text-white">MAKER</TableColumn>
								<TableColumn className="text-md text-white">TXN</TableColumn>
							</TableHeader>

							<TableBody isLoading={isLoading} emptyContent={"No activity found"} loadingContent={<Spinner />} className="p-10">
								{activity && activity.data.map((row: any, index: any) => ( // Not sure what the actual data was so used any for now
									<TableRow key={index + 2}>
										<TableCell className="text-white/50 text-md">{row.timeAgo}</TableCell>
										<TableCell className={`text-md ${row.type === 'Buy' ? 'text-success' : 'text-danger'}`}>{row.type}</TableCell>
										<TableCell className={`text-md ${row.type === 'Buy' ? 'text-success' : 'text-danger'}`}>{row.usd}</TableCell>
										<TableCell className={`text-md ${row.type === 'Buy' ? 'text-success' : 'text-danger'}`}>{row.fomo3dFun}</TableCell>
										<TableCell className={`text-md ${row.type === 'Buy' ? 'text-success' : 'text-danger'}`}>{row.sol}</TableCell>
										<TableCell className={`text-md ${row.type === 'Buy' ? 'text-success' : 'text-danger'}`}>${row.price}</TableCell>
										<TableCell className="text-white text-md">{row.maker}</TableCell>
										<TableCell>
											<Button isIconOnly className="bg-white/10" size="sm" aria-label="Close">
												<Icon icon="material-symbols-light:arrow-forward" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			</div>
			<div className="col-span-12 md:col-span-3 border-t-2 md:border-0 border-white/10">
				<SingleTokenSidebar token={demoToken} />
			</div>
		</div>
	);
}
