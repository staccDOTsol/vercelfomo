"use client";

import { Button } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { clsx } from "clsx";
import { usePathname } from "next/navigation";

export default function MenuButton({ toggleSidebar }: { toggleSidebar: () => void }) {
	const pathName = usePathname();

	const getButtonTopPosition = () => {
    console.log(pathName)
		switch (true) {
			case /^\/token(\/.*)?$/.test(pathName):
				return "top-16";
			default:
				return "top-14";
		}
	};

	return (
		<Button onClick={toggleSidebar} className={clsx("absolute left-4 md:hidden", getButtonTopPosition())} size="md" isIconOnly>
			<Icon icon="iconoir:menu" width={20} />
		</Button>
	);
}
