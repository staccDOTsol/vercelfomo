"use client";
import { Image, Link } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/sidebar";
import Logo from "@/app/assets/images/logo_color.svg";

import { sidebarItems } from "@/local-data/sidebar-items";

import {
	Button,
	Input,
	ScrollShadow,
	Spacer,
	User,
} from "@nextui-org/react";

const user = {
  id: 1,
  name: "Jonathon",
  avatar: "https://i.pravatar.cc/150?img=3",
}

export default function SidebarContainer({ toggleSidebar, isSidebarOpen }: { toggleSidebar: () => void, isSidebarOpen: boolean }) {

	return (
    <>
      <div className="fixed top-0 left-0 flex h-full w-72 flex-col border-r-small border-divider p-6 bg-black z-50">
        <Button onClick={toggleSidebar} className="absolute top-4 right-4 bg-transparent md:hidden" size="md" isIconOnly aria-label="Close">
          <Icon icon="material-symbols-light:close" width={30} />
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-2 w-full justify-center">
            <Link href="/">
              <Image src={Logo.src} alt="Logo" width={150} height={150} />
            </Link>
          </div>
        </div>

        <Spacer y={8} />

        <div className="flex flex-col gap-y-2">
          <Input
            fullWidth
            aria-label="search"
            classNames={{
              base: "px-1",
              inputWrapper: "dark:bg-default-50",
            }}
            labelPlacement="outside"
            placeholder="Search..."
            startContent={<Icon className="text-default-500 [&>g]:stroke-[2px]" icon="solar:magnifer-linear" width={18} />}
          />
        </div>

        <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            items={sidebarItems}
            toggleSidebar={toggleSidebar}
          />
          <Spacer y={8} />
        </ScrollShadow>

        <Button className="h-16 items-center justify-between" variant="light" aria-label="Profile">
          <User
            avatarProps={{
              size: "sm",
              isBordered: false,
              src: user.avatar,
            }}
            className="justify-start transition-transform"
            name={user.name}
          />
          <Icon className="text-default-400" icon="lucide:chevrons-up-down" width={16} />
        </Button>
      </div>
    </>
	);
};
