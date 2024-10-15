"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Card, CardBody, Divider, Link, Progress, Tab, Tabs } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import useCoins from "@/app/hooks/useCoins";
import { useRouter } from 'next/navigation'
import ItemFilterBar from "@/components/item-filter-bar";
import { useAutoAnimate } from '@formkit/auto-animate/react'

import Logo from "@/app/assets/images/logo_color.svg";
import usePairs from "./hooks/usePairs";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('trending');
  const [parent, enableAnimations] = useAutoAnimate()
  const router = useRouter();
  const { pairs: coins, isLoading, error } = usePairs();

  const filteredCoins = coins && coins.filter((coin: any) => {
    switch (activeFilter) {
      case 'new':
        return coin.is_new;
      case 'rising':
        return coin.is_rising;
      case 'top':
        return coin.is_top;
      case 'trending':
        return coin.is_trending;
      default:
        return true;
    }
  });

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">Loading...</div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">Error: {error.message}</div>
      ) : (
        <div>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-[50px] font-bold text-center pt-10 md:pt-0 leading-none hidden md:block">FOMO 3D</h1>
            <Image src={Logo.src} alt="Logo" width={150} height={150} className="mb-2 md:hidden" />
            <p className="text-center text-xl opacity-70 pb-6 px-4">The future of crypto is here. Get a jump start on the next big token launch.</p>
            <div className="flex items-center gap-2 pb-10">
              <Button size="md" color="primary" className="text-lg" aria-label="Get Started">Get Started</Button>
              <Button size="md" color="secondary" variant="ghost" className="text-lg" aria-label="Lauch Your Own Token" onClick={() => router.push('/launch')}>Lauch Your Own Token</Button>
            </div>
            <Divider />
          </div>

          <section className="p-4">
            <div className="pb-4 w-full">
              <ItemFilterBar setActiveFilter={setActiveFilter} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {filteredCoins && filteredCoins.length > 0 && filteredCoins.map((coin: any) => (
                <Card
                  key={coin.mint.address}
                  isPressable
                  onPress={() => {
                    console.log(coin.mint.address);
                    router.push(`/token/${coin.mint.address}`);
                  }}>
                  <CardBody className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 absolute top-2 right-2">
                      <Link href={coin.twitter} target="_blank" className="text-white/90">
                        <Icon icon="arcticons:x-twitter" />
                      </Link>
                      <Link href={coin.telegram} target="_blank" className="text-white/90">
                        <Icon icon="arcticons:telegram" />
                      </Link>
                      <Link href={coin.website} target="_blank" className="text-white/90">
                        <Icon icon="arcticons:emoji-globe-with-meridians" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-4">
                      <Image
                        unoptimized
                        src={coin.mint.metadata.image || "https://via.assets.so/img.jpg?w=400&h=150&tc=blue&bg=#000000&t="}
                        width={70}
                        height={70}
                        alt="avatar"
                        className="rounded-lg aspect-square object-cover"
                        placeholder="blur"
                        blurDataURL={"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="}
                      />
                      <div className="flex flex-col gap-0">
                        <h2 className="text-xl font-bold leading-none">
                          <span className="opacity-50">@{coin.mint.metadata.symbol}</span> {coin.mint.metadata.name}
                        </h2>
                        <p className="opacity-70">{coin.mint.metadata.description}</p>
                      </div>
                    </div>

                    <Divider />

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-secondary">{coin['1h'] || 'N/A'}</span>
                          <span>${coin.volume || 'N/A'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span>{coin.buys || 'N/A'} buys</span>/<span>{coin.sells || 'N/A'} sells</span>
                        </div>
                      </div>
                      <Progress value={parseFloat(coin['24h']) || 0} classNames={{ indicator: "bg-[#9648fe]" }} size="sm" />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
