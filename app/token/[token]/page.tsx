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
import usePair from "@/app/hooks/usePair";

export default function TokenPage() {
	let { token } = useParams();
	if (typeof token === 'string' && token.split('-').length > 1) {
		token = token.split('-')[1];
	}


	const [chartData, setChartData] = useState<any>(null);
	const [coinData, setCoinData] = useState<any>(null);
	const [isChartDataLoading, setIsChartDataLoading] = useState<boolean>(true);
	const [isCoinDataLoading, setIsCoinDataLoading] = useState<boolean>(true);
	const chartContainerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<IChartApi | null>(null);

	const selectedCoin = usePair(token as string)
	const [lastClose, setLastClose] = useState(0)
	useEffect(() => {
		// Fetch OHLCV data for the specific token
		async function fetchChartData() {
			try {
				const response = await fetch(`/api/ohlcv/${token}`);
				if (response.ok) {
					const rawData = await response.json();
					const processedData = rawData
					
						.map((item: any) => ({
							time: Math.floor(item.timestamp *1000), // Convert seconds to milliseconds
							open: Number(item.open) * 10**9,
							high: Number(item.high) * 10**9,
							low: Number(item.low) * 10**9,
							close: Number(item.close) * 10**9,
							volume: Number(item.volume)
						}));
						console.log(processedData);
						if (processedData.length > 0) {
							const lastCloseValue = processedData[processedData.length - 1].close;
							setLastClose(lastCloseValue);
							console.log('Last close value:', lastCloseValue);

							try {
									const data = selectedCoin
									console.log(coinData);
									console.log(lastClose)
									setCoinData({
										name: data.mint.metadata.name,
										symbol: data.mint.metadata.symbol,
										price: lastCloseValue,
										marketCap: data.marketCap,
										image: data.mint.metadata.image,
										isBondingCurve: data.isBondingCurve
									});
							} catch (error) {
								console.error('Failed to fetch coin data:', error);
							} finally {
								setIsCoinDataLoading(false);
							}
						} else {
							console.log('No data available');
						}
					// Remove duplicate timestamps and sort in ascending order
					const uniqueProcessedData = processedData
						.filter((item: any, index: any, self: any) =>
							index === self.findIndex((t: any) => t.time === item.time)
						)
						.sort((a: any, b: any) => a.time - b.time)
						.filter((item: any, index: any, self: any) => 
							index === 0 || item.time > self[index - 1].time
						)
					// Filter out equal timestamps, keeping only the first occurrence
					const filteredData = uniqueProcessedData.filter((item: any, index: number, self: any[]) =>
						index === self.findIndex((t: any) => t.time === item.time)
					);

					// Sort the filtered data by timestamp in ascending order
					const sortedData = filteredData.sort((a: any, b: any) => a.time - b.time);
					setChartData([]);
				} else {

				setChartData([]);

				try {
					const data = selectedCoin
					console.log(coinData);
					console.log(lastClose)
					setCoinData({
						name: data.mint.metadata.name,
						symbol: data.mint.metadata.symbol,
						price: 0,
						marketCap: data.marketCap,
						image: data.mint.metadata.image,
						isBondingCurve: data.isBondingCurve
					});
					setIsCoinDataLoading(false);
					setIsChartDataLoading(false);
				} catch (error) {
					console.error('Failed to fetch coin data:', error);
					// Fetch token metadata using Helius API
					
				} finally {
					setIsCoinDataLoading(false);
					setIsChartDataLoading(false);
				}
			
					console.error('Failed to fetch OHLCV data:', response.statusText);
				}
			} catch (error) {
				setChartData([]);

				try {
					const data = selectedCoin
					console.log(coinData);
					console.log(lastClose)
					setCoinData({
						name: data.mint.metadata.name,
						symbol: data.mint.metadata.symbol,
						price: 0,
						marketCap: data.marketCap,
						image: data.mint.metadata.image,
						isBondingCurve: data.isBondingCurve
					});
				} catch (error) {
					console.error('Failed to fetch coin data:', error);
				} finally {
					setIsCoinDataLoading(false);
					setIsChartDataLoading(false);
				}
				console.error('Failed to fetch OHLCV data:', error);
			} finally {
				setIsChartDataLoading(false);
			}
		}


		fetchChartData();

		// Set up intervals to fetch data every 5 minutes
		const chartDataIntervalId = setInterval(fetchChartData, 1 * 1000);

		// Clean up intervals on component unmount
		return () => {
			clearInterval(chartDataIntervalId);
		};
	}, [token]);

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
			.sort((a, b) => b.high - a.high); // Sort by highest price descending

		candlestickSeries.setData(formattedData);

		// Add volume series
		const volumeSeries = chart.addHistogramSeries({
			color: '#26a69a',
			priceFormat: {
				type: 'volume',
			},
			priceScaleId: '',
		});

		const volumeData = formattedData.map((d) => ({
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

	if (isChartDataLoading || isCoinDataLoading) {
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
              data={chartData}
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
