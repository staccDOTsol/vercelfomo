"use client";

import { Icon } from "@iconify/react";
import { Button, Card, CardBody, Input, Progress, Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarStats from "@/components/sidebar-stats";
import SlippageInput from "@/components/slippage-input";
import AmountInput from "@/components/amount-input";
export default function SingleTokenSidebar({
	token,
}: {
	token: {
		name: string;
		symbol: string;
		price: number;
		marketCap: number;
		image: string;
	};
}) {
	const router = useRouter();

	return (
		<>
      <div className="flex justify-between items-center p-3">
        <div className="text-xl">@PEPPA / SOL</div>
        <Button isIconOnly className="bg-white/10" size="sm" onClick={() => router.back()}>
          <Icon icon="material-symbols-light:close" />
        </Button>
      </div>

			<div>
				<Image src={token.image} alt="Peppa" unoptimized className="w-full h-full" width={100} height={100} />
			</div>

			<div className="p-3 flex flex-col gap-2">
				<Card className="bg-transparent border border-white/10">
					<CardBody>
						<div className="leading-none -mt-1 pb-1 text-lg">
							Progress <span className="text-primary">50%</span>
						</div>
						<Progress value={50} size="md" />
					</CardBody>
				</Card>

				<div className="grid grid-cols-2 gap-2">
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Price</div>
							<span className="text-2xl leading-none">$1000</span>
						</CardBody>
					</Card>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Market Cap</div>
							<span className="text-2xl leading-none">$23k</span>
						</CardBody>
					</Card>
				</div>

				<div>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="flex flex-col gap-2">
							<Tabs color="primary" aria-label="Tabs" radius="full" fullWidth>
								<Tab key="buy" title="Buy" />
								<Tab key="sell" title="Sell" />
							</Tabs>

							<AmountInput />

              <SlippageInput />

              <div className="flex flex-col gap-2 items-center">
                <Button
                  className="bg-primary text-white rounded-full text-lg"
                  startContent={<Icon icon="tabler:wallet" />}
                  fullWidth
                >
                  Connect Wallet
                </Button>

                <span className="text-white/50 text-md">You will receive min <span className="text-white">614</span> @PEPPA</span>
              </div>
						</CardBody>
					</Card>
				</div>

        <div>
          <SidebarStats />
        </div>
			</div>
		</>
	);
}
