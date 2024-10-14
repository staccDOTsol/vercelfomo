"use client";

import { Button } from "@nextui-org/react";
import { Image } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/app/assets/images/logo_color.svg";
import MenuButton from "@/components/menu-button";
import "@solana/wallet-adapter-react-ui/styles.css";
import { connected } from "process";
import { useWallet } from "@solana/wallet-adapter-react";

export default function TopMenu({ toggleSidebar }: { toggleSidebar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const {connected} = useWallet()
	return (
    <div>
      <div className="flex items-center justify-between w-full p-4 md:hidden">
        {pathname !== "/" && <Image src={Logo.src} alt="Logo" width={80} height={80} />}
        <MenuButton  toggleSidebar={toggleSidebar}/>
      </div>
      <div className="hidden md:flex items-center justify-between gap-1 md:gap-2 w-full p-4">
        <div className="flex flex-1 md:flex-none items-center gap-1 md:gap-2">
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" aria-label="Portfolio">
            <Icon icon="tabler:trending-up" />
            Portfolio
          </Button>
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" onPress={() => router.push("/swap")} aria-label="Swap">
            <Icon icon="tabler:trending-up" />
            Swap
          </Button>
        </div>
        <div className="flex flex-1 md:flex-none items-center gap-1 md:gap-2">
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" aria-label="Telegram">
            <Icon icon="tabler:trending-up" />
            Telegram
          </Button>
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" aria-label="Twitter">
            <Icon icon="tabler:trending-up" />
            Twitter
          </Button>
        </div>
      </div>
    </div>
	);
}
