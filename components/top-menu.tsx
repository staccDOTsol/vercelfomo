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
    <div className="flex">
      <div className="flex items-center justify-between w-full p-4 md:hidden">
        {pathname !== "/" && <Image src={Logo.src} alt="Logo" width={80} height={80} />}
      </div>
      <div className="flex items-center justify-between gap-1 md:gap-2 w-fit md:w-full p-4">
        <div className="hidden md:flex flex-1 md:flex-none items-center gap-1 md:gap-2">
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" onPress={() => router.push("/portfolio")} aria-label="Portfolio">
            <Icon icon="tabler:trending-up" />
            Portfolio
          </Button>
          <Button variant="flat" size="sm" className="text-sm md:text-md flex-1 md:flex-none" onPress={() => router.push("/swap")} aria-label="Swap">
            <Icon icon="tabler:trending-up" />
            Swap
          </Button>
        </div>
        <div className="flex flex-1 md:flex-none items-center gap-1 md:gap-2">
          <Button
            variant="flat"
            size="sm"
            className="text-sm md:text-md h-10 w-10 md:w-fit p-0 md:p-2 gap-0 md:gap-2 min-w-0 md:min-w-16"
            aria-label="Telegram"
            onPress={() => window.open("https://t.me/fomo3dGobbler", "_blank")}
          >
            <Icon icon="fa6-brands:telegram" />
            <span className="hidden md:block">Telegram</span>
          </Button>

          <Button
            variant="flat"
            size="sm"
            className="text-sm md:text-md h-10 w-10 md:w-fit p-0 md:p-2 gap-0 md:gap-2 min-w-0 md:min-w-16"
            aria-label="Twitter"
            onPress={() => window.open("https://x.com/FOMO3DdotFUN", "_blank")}
          >
            <Icon icon="fa6-brands:x-twitter" />
            <span className="hidden md:block">Twitter</span>
          </Button>

          <MenuButton toggleSidebar={toggleSidebar}/>
        </div>
      </div>
    </div>
	);
}
