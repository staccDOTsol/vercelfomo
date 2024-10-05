"use client";

import { Icon } from "@iconify/react";
import { Button, Card, CardBody, Input, Progress, Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

							<Card className="bg-transparent border border-white/10">
								<CardBody className="p-0 flex flex-col gap-0">
									<Input
										type="number"
										placeholder="0.00"
										labelPlacement="outside"
                    aria-label="Amount"
                    classNames={{
                      input: [
                        "bg-transparent",
                        "rounded-b-none",
                        "pt-[2px]",
                        "hover:bg-transparent",
                        "text-lg"
                      ],
                      inputWrapper: [
                        "bg-transparent",
                        "rounded-b-none",
                        "hover:bg-transparent",
                      ],
                    }}
										startContent={
											<Icon icon="token-branded:sol" />
										}
									/>

                  <div className="bg-white/10 grid grid-cols-6 gap-0">
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">0.01</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">0.25</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">0.5</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">1</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">2</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">5</Button>
                  </div>
								</CardBody>
							</Card>

              <Card className="bg-transparent border border-white/10">
								<CardBody className="p-0 flex flex-col gap-0">
									<Input
										type="number"
										placeholder="0.00"
										labelPlacement="outside"
                    aria-label="Slippage"
                    classNames={{
                      input: [
                        "bg-transparent",
                        "rounded-b-none",
                        "pt-[2px]",
                        "hover:bg-transparent",
                        "text-lg"
                      ],
                      inputWrapper: [
                        "bg-transparent",
                        "rounded-b-none",
                        "hover:bg-transparent",
                      ],
                    }}
										startContent={
											<span className="text-white/50">Slippage</span>
										}
									/>

                  <div className="bg-white/10 grid grid-cols-6 gap-0">
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">5%</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">10%</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">15%</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">20%</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">25%</Button>
                    <Button size="sm" className="bg-transparent text-md hover:bg-white/10">50%</Button>
                  </div>
								</CardBody>
							</Card>

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
			</div>
		</>
	);
}
