"use client";

import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function TopMenu() {
  const router = useRouter();

	return (
		<div className="flex items-center justify-between gap-1 md:gap-2 w-full p-4">
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
	);
}
