import { Tabs, Tab } from "@nextui-org/react";
import { Icon } from "@iconify/react";

export default function ItemFilterBar() {
	return (
		<Tabs aria-label="Options" color="primary" variant="bordered" classNames={{ base: "w-full md:w-fit", tabList: "w-full md:w-fit" }}>
			<Tab
				key="trending"
				title={
					<div className="flex items-center space-x-2">
						<Icon icon="tabler:trending-up" />
						<span className="text-[16px]">Trending</span>
					</div>
				}
			/>
			<Tab
				key="top"
				title={
					<div className="flex items-center space-x-2">
						<Icon icon="tabler:trending-up" />
						<span className="text-[16px]">Top</span>
					</div>
				}
			/>
			<Tab
				key="rising"
				title={
					<div className="flex items-center space-x-2">
						<Icon icon="solar:chart-2-bold" />
						<span className="text-[16px]">Rising</span>
					</div>
				}
			/>
			<Tab
				key="new"
				title={
					<div className="flex items-center space-x-2">
						<Icon icon="solar:leaf-bold" />
						<span className="text-[16px]">New</span>
					</div>
				}
			/>
		</Tabs>
	);
}
