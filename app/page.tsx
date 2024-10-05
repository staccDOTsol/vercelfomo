"use client";

import Image from "next/image";
import { Button, Card, CardBody, Divider, Progress, Tab, Tabs } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useCoins } from "@/app/hooks/useCoins";
import { useRouter } from 'next/navigation'
import ItemFilterBar from "@/components/item-filter-bar";

export default function Home() {
  const router = useRouter()
	const { data: coins, isLoading, error } = useCoins();

	if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
	if (error) return <div className="flex items-center justify-center h-screen">Error: {error.message}</div>;


	return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-between gap-2 w-full p-4">
          <div className="flex items-center gap-2">
            <Button variant="flat" size="sm" className="text-md">
              <Icon icon="tabler:trending-up" />
              Portfolio
            </Button>
            <Button variant="flat" size="sm" className="text-md">
              <Icon icon="tabler:trending-up" />
              Swap
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="flat" size="sm" className="text-md">
              <Icon icon="tabler:trending-up" />
              Telegram
            </Button>
            <Button variant="flat" size="sm" className="text-md">
              <Icon icon="tabler:trending-up" />
              Twitter
            </Button>
          </div>
        </div>
        <h1 className="text-[50px] font-bold text-center pt-10 md:pt-0 leading-none">FOMO 3D</h1>
        <p className="text-center text-xl opacity-70 pb-6 px-4">The future of crypto is here. Get a jump start on the next big token launch.</p>
        <div className="flex items-center gap-2 pb-10">
          <Button size="md" color="primary" className="text-lg">Get Started</Button>
          <Button size="md" color="secondary" variant="ghost" className="text-lg">Lauch Your Own Token</Button>
        </div>
        <Divider />
      </div>

      <section className="p-4">
        <div className="pb-4">
          <ItemFilterBar />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {coins && coins.length > 0 && coins.map((coin: any) => (
            <Card
              key={coin.id}
              isPressable
              onPress={() => {
                console.log(coin.id)
                router.push(`/token/${coin.id}`);
            }}>
              <CardBody className="flex flex-col gap-2">
                <div className="flex items-center gap-1 absolute top-2 right-2">
                  <div>
                    <Icon icon="arcticons:x-twitter" />
                  </div>
                  <div>
                    <Icon icon="arcticons:telegram" />
                  </div>
                  <div>
                    <Icon icon="arcticons:emoji-globe-with-meridians" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Image
                    unoptimized
                    src={coin.image}
                    width={70}
                    height={70}
                    alt="avatar"
                    className="rounded-lg aspect-square object-cover"
                  />
                  <div className="flex flex-col gap-0">
                    <h2 className="text-xl font-bold leading-none">
                      <span className="opacity-50">@{coin.shortName}</span> {coin.name}
                    </h2>
                    <p className="opacity-70">{coin.summary}</p>
                  </div>
                </div>

                <Divider />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-secondary">{coin.percentComplete}%</span>
                      <span>${coin.totalVolume}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>{coin.txns} txns</span>/<span>${coin.totalVolume} total</span>
                    </div>
                  </div>
                  <Progress value={coin.percentComplete} classNames={{ indicator: "bg-[#9648fe]" }} size="sm" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
	);
}
