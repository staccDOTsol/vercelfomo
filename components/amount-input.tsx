"use client";

import { Button, Card, CardBody, Input } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function AmountInput() {
	const [amount, setAmount] = useState("");

	const handleButtonClick = (value: string) => {
		setAmount(value);
	};

	return (
		<Card className="bg-transparent border border-white/10">
			<CardBody className="p-0 flex flex-col gap-0">
				<Input
					type="number"
					placeholder="0.00"
					labelPlacement="outside"
					aria-label="Amount"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					classNames={{
						input: ["bg-transparent", "rounded-b-none", "pt-[2px]", "hover:bg-transparent", "text-lg"],
						inputWrapper: ["bg-transparent", "rounded-b-none", "hover:bg-transparent"],
					}}
					startContent={<Icon icon="token-branded:sol" />}
				/>

				<div className="bg-white/10 grid grid-cols-6 gap-0">
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("0.01")}>
						0.01
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("0.25")}>
						0.25
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("0.5")}>
						0.5
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("1")}>
						1
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("2")}>
						2
					</Button>
					<Button size="sm" className="bg-transparent text-md hover:bg-white/10" onClick={() => handleButtonClick("5")}>
						5
					</Button>
				</div>
			</CardBody>
		</Card>
	);
}
