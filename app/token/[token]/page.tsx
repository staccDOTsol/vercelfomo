"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useActivity from "@/app/hooks/useActivty";
import { Button, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import SingleTokenSidebar from "@/components/single-token-sidebar";
import { Icon } from "@iconify/react";
import { ColorType, createChart, IChartApi } from 'lightweight-charts';
import { CrosshairMode, LineStyle } from 'lightweight-charts';
import TvChartsHolder from "@/components/tv-charts-holder";
import TvChart from "@/components/tv-chart";
import useCoins from "@/app/hooks/useCoins";

export default function TokenPage() {
	let { token }: {token:string} = useParams();
	if (typeof token === 'string' && token.split('-').length > 1) {
		token = token.split('-')[1];
	}
	if (Array.isArray(token)) {
		token = token.join('-');
	}
	interface Pair {
	  id: number;
	  token: string;
	  price: string;
	  age: string;
	  buys: string | number;
	  sells: string | number;
	  volume: string;
	  makers: string | number;
	  '5m': string;
	  '1h': string;
	  '6h': string;
	  '24h': string;
	  liquidity: string;
	  mcap: string;
	  mint: {
		address: string;
		metadata: {
		  description: string | null;
		  image: string | null;
		  name: string | null;
		  symbol: string | null;
		};
		birdeyeData: any;
	  };
	  programId: string;
	  isBondingCurve: boolean;
	}
	
	  const [pair, setPair] = useState<Pair | null>(null);
	  const [isLoading, setIsLoading] = useState<boolean>(true);
	  const [chartData, setChartData] = useState<any>(null);
	  const [coinData, setCoinData] = useState<any>(null);
	  const [lastClose, setLastClose] = useState(0);

	  useEffect(() => {
		const fetchPair = async () => {
		  setIsLoading(true);
		  try {
			const response = await fetch('/api/pairs/new');
			if (!response.ok) {
			  throw new Error('Failed to fetch pair data');
			}
			const pairs: Pair[] = await response.json();
			console.log(pairs)
			const foundPair = pairs.find(p => p.mint.address === token);
			console.log(foundPair)
			if (foundPair) {
			  setPair(foundPair);
			}
		  } catch (err) {
			console.error('Error fetching pair:', err);
		  } finally {
			setIsLoading(false);
		  }
		};

		fetchPair();
	  }, [token]); // Add token to the dependency array

	  useEffect(() => {
		const fetchChartData = async () => {
		  try {
			const response = await fetch(`/api/ohlcv/${token}`);
			if (response.ok) {
			  const rawData = await response.json();
			  const processedData = rawData.map((item: any) => ({
				time: Math.floor(item.timestamp * 1000),
				open: Number(item.open) * 10**9,
				high: Number(item.high) * 10**9,
				low: Number(item.low) * 10**9,
				close: Number(item.close) * 10**9,
				volume: Number(item.volume)
			  }));

			  if (processedData.length > 0 && processedData[processedData.length - 1].close != null) {
				const lastCloseValue = processedData[processedData.length - 1].close;
				setLastClose(lastCloseValue);
				setChartData(processedData);

				if (pair) {
				  setCoinData({
					...pair,
					mint: token,
					programId: pair.programId,
					name: pair.mint.metadata.name,
					symbol: pair.mint.metadata.symbol,
					price: lastCloseValue,
					marketCap: 0,
					image: pair.mint.metadata.image,
					isBondingCurve: pair.isBondingCurve,
				  });
				}
			  } else {
				setChartData([]);
				if (pair) {
				  setCoinData({
					...pair,

					mint: token,
					programId: pair.programId,
					name: pair.mint.metadata.name,
					symbol: pair.mint.metadata.symbol,
					price: 0,
					marketCap: 0,
					image: pair.mint.metadata.image,
					isBondingCurve: pair.isBondingCurve
				  });
				}
			  }
			} else {
			  throw new Error('Failed to fetch OHLCV data');
			}
		  } catch (error) {
			console.error('Failed to fetch OHLCV data:', error);
			setChartData([]);
			if (pair) {
			  setCoinData({					...pair,

				mint: token,
				programId: pair.programId,
				name: pair.mint.metadata.name,
				symbol: pair.mint.metadata.symbol,
				price: 0,
				marketCap: 0,
				image: pair.mint.metadata.image,
				isBondingCurve: pair.isBondingCurve
			  });
			}
		  }
		};

		fetchChartData();
		const intervalId = setInterval(fetchChartData, 60000); // Fetch every minute

		return () => clearInterval(intervalId);
	  }, [token, pair]); // Add token and pair to the dependency array

	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);

	useEffect(() => {
		if (!chartContainerRef.current || !chartData) return;

		const chart = createChart(chartContainerRef.current, {
			width: chartContainerRef.current.clientWidth,
			height: chartContainerRef.current.clientHeight,
			layout: {
				background: { type: ColorType.Solid, color: '#131722' },
				textColor: '#d1d4dc',
			},
			grid: {
				vertLines: { color: '#2B2B43' },
				horzLines: { color: '#2B2B43' },
			},
			crosshair: {
				mode: CrosshairMode.Normal,
				vertLine: {
					width: 1,
					color: '#758696',
					style: LineStyle.Solid,
				},
				horzLine: {
					width: 1,
					color: '#758696',
					style: LineStyle.Solid,
				},
			},
			timeScale: {
				borderColor: '#2B2B43',
			},
		});

		chartRef.current = chart;

		const candlestickSeries = chart.addCandlestickSeries({
			upColor: '#26a69a',
			downColor: '#ef5350',
			borderVisible: false,
			wickUpColor: '#26a69a',
			wickDownColor: '#ef5350',
		});

		const priceFactor = 100000000; // 10^8 to convert from 1e-8 to whole numbers
		const formattedData = chartData
			.map((point: any) => ({
				time: point.time,
				open: point.open * priceFactor,
				high: point.high * priceFactor,
				low: point.low * priceFactor,
				close: point.close * priceFactor,
			}))
			.sort((a: any, b: any) => b.high - a.high); // Sort by highest price descending

		candlestickSeries.setData(formattedData);

		// Add volume series
		const volumeSeries = chart.addHistogramSeries({
			color: '#26a69a',
			priceFormat: {
				type: 'volume',
			},
			priceScaleId: '',
		});

		const volumeData = formattedData.map((d: any) => ({
			time: d.time,
			value: 0,
			color: d.close > d.open ? '#26a69a' : '#ef5350',
		}));

		volumeSeries.setData(volumeData);

		const handleResize = () => {
			if (chartContainerRef.current) {
				chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
			if (chartRef.current) {
				chart.remove();
				chartRef.current = null;
			}
		};
	}, [chartData]);

	const { activity, isLoading: isActivityLoading, error } = useActivity();

	if (isLoading || !pair) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!chartData || !coinData) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-white">Failed to load token data.</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-12" style={{ height: "calc(100vh - 60px)" }}>
			<div className="flex flex-col col-span-12 md:col-span-9 order-2 md:order-first">
			<div className="flex-1">
			<TvChart
              key={`${token}`} 
              symbol={token} 
              removeChart={() => {}} 
            />
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

							<TableBody
								isLoading={isActivityLoading}
								emptyContent={"No activity found"}
								loadingContent={<Spinner />}
								className="p-10"
							>
								{activity && activity.data.map((row: any, index: number) => (
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
				<SingleTokenSidebar token={coinData} />
			</div>
		</div>
	);
}