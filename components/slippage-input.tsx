"use client";

import { Button, Card, CardBody, Input } from "@nextui-org/react";
import { useState } from "react";

export default function SlippageInput() {
	const [slippage, setSlippage] = useState("");

	const handleButtonClick = (value: string) => {
		setSlippage(value);
	};

	return (
		<Card className="bg-transparent border border-white/10">
			<CardBody className="p-0 flex flex-col gap-0">
				<Input
					type="number"
					placeholder="0.00"
					labelPlacement="outside"
					aria-label="Slippage"
					value={slippage}
					onChange={(e) => setSlippage(e.target.value)}
					classNames={{
						input: ["bg-transparent", "rounded-b-none", "pt-[2px]", "hover:bg-transparent", "text-lg"],
						inputWrapper: ["bg-transparent", "rounded-b-none", "hover:bg-transparent"],
					}}
					startContent={<span className="text-white/50">Slippage</span>}
				/>

				<div className="bg-white/10 grid grid-cols-6 gap-0">
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("5")}>
						5%
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("10")}>
						10%
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("15")}>
						15%
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("20")}>
						20%
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("25")}>
						25%
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("50")}>
						50%
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
