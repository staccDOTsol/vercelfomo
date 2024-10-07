"use client";

import { Button, Checkbox, Divider, Input, Link, PopoverTrigger, Popover, Textarea, PopoverContent, SelectItem, Select } from "@nextui-org/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useForm, useField, Updater } from "@tanstack/react-form";

// Images
import RaydiumLogo from "@/app/assets/images/raydium.webp";
import GobblerLogo from "@/app/assets/images/gobbler.png";
import { Icon } from "@iconify/react";
import DexOption from "@/components/dex-option";

function IconDropZone({ onFileChange }: { onFileChange: (file: File) => void }) {
	const [iconFile, setIconFile] = useState<File | null>(null);
	const { getRootProps, getInputProps } = useDropzone({
		maxFiles: 1,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".webp"],
		},
		onDrop: (acceptedFiles: File[]) => {
			setIconFile(acceptedFiles[0]);
			onFileChange(acceptedFiles[0]);
		},
	});

	return (
		<div className="col-span-full md:col-span-1 aspect-video md:aspect-square flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<p className="text-xl">Icon</p>
				{iconFile && (
					<div
						className="flex items-center gap-2 text-sm text-white/50 cursor-pointer hover:text-white/100 transition-all duration-300"
						onClick={() => {
							setIconFile(null);
						}}
					>
						<Icon icon="fa6-solid:trash" className="w-2" />
						<p className="leading-none pt-0.5">Clear</p>
					</div>
				)}
			</div>
			<div
				{...getRootProps()}
				className="bg-[#27272a] rounded-lg p-4 flex flex-col items-center justify-center aspect-video md:aspect-square"
				style={{
					backgroundImage: `url(${iconFile ? URL.createObjectURL(iconFile) : ""})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<input {...getInputProps()} />
				{!iconFile && (
					<div className="flex items-center justify-center">
						<Icon icon="fa6-solid:image" className="w-10" />
						<p>upload</p>
					</div>
				)}
			</div>
		</div>
	);
}

function BannerDropZone({ onFileChange }: { onFileChange: (file: File) => void }) {
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const { getRootProps, getInputProps } = useDropzone({
		maxFiles: 1,
		accept: {
			"image/*": [".png", ".jpg", ".jpeg", ".webp"],
		},
		onDrop: (acceptedFiles: File[]) => {
			setBannerFile(acceptedFiles[0]);
			onFileChange(acceptedFiles[0]);
		},
	});

	return (
		<div className="col-span-3 flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<p className="text-xl">Banner</p>
				{bannerFile && (
					<div
						className="flex items-center gap-2 text-sm text-white/50 cursor-pointer hover:text-white/100 transition-all duration-300"
						onClick={() => {
							setBannerFile(null);
						}}
					>
						<Icon icon="fa6-solid:trash" className="w-2" />
						<p className="leading-none pt-0.5">Clear</p>
					</div>
				)}
			</div>
			<div
				{...getRootProps()}
				className="bg-[#27272a] rounded-lg p-4 flex flex-col items-center justify-center flex-1 aspect-video md:aspect-auto"
				style={{
					backgroundImage: `url(${bannerFile ? URL.createObjectURL(bannerFile) : ""})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<input {...getInputProps()} />
				{!bannerFile && (
					<div className="flex items-center justify-center">
						<Icon icon="fa6-solid:image" className="w-10" />
						<p>upload</p>
					</div>
				)}
			</div>
		</div>
	);
}

export default function LaunchPage() {
	const { Field, handleSubmit, state, setFieldValue, Subscribe } = useForm({
		defaultValues: {
			dex: "GOBBLER",
			tokenSymbol: "",
			tokenName: "",
			description: "",
			website: "",
			twitter: "",
			telegram: "",
			discord: "",
			otherLink: "",
			initialBuy: "",
			agreeTerms: false,
			icon: null,
			banner: null,
		},
		onSubmit: (values) => {
			console.log(values);
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				handleSubmit();
			}}
		>
			<div className="pb-10 pt-0 md:pt-6">
				<h1 className="text-3xl font-bold text-center px-4 pt-0 md:pt-4">Launch your token with FOMO3D</h1>
				<p className="text-xl text-center px-4">FOMO3D is a decentralized exchange that allows you to launch your token with ease.</p>
			</div>

			<Divider />

			<div className="w-full md:w-[800px] mx-auto pb-44 px-4 md:px-0">
				<h2 className="text-2xl font-bold text-center p-6">Choose a DEX</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Field
						name="dex"
						children={({ state, handleChange, handleBlur }) => (
							<>
								<DexOption
									isSelected={state.value === "GOBBLER"}
									setSelectedDex={() => handleChange("GOBBLER")}
									logo={GobblerLogo.src}
									name="GOBBLER"
									description="Earn LB rewards for life! 20% for created (that's you) and 70% fr top 50 holders"
									learnMoreLink="https://meteora.xyz"
								/>

								<DexOption
									isSelected={state.value === "raydium"}
									setSelectedDex={() => handleChange("raydium")}
									logo={RaydiumLogo.src}
									name="Raydium"
									description=""
									learnMoreLink=""
								/>
							</>
						)}
					/>
				</div>

				<div className="py-4">
					<Popover placement="right" showArrow={true} backdrop="blur" size="lg">
						<PopoverTrigger>
							<Button size="sm">
								<Icon icon="ph:gear" className="text-lg" />
								<span className="text-md inter">Fee Option</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full md:w-[400px] items-start justify-start py-4 px-6">
							<div className="h-full w-full flex flex-col flex-1">
								<div className="text-2xl font-bold pb-3">Fee Settings</div>
								<Divider />
								<div className="text-sm inter pt-4">Some cool text to go here to explain the fee settings. I dont know much about it so im just putting random content.</div>

								<div className="w-full my-4">
									<Select
										label="Fee Type"
										classNames={{
											label: "text-xs inter font-bold",
											value: "text-sm inter",
											listbox: "text-sm inter",
										}}
									>
										<SelectItem key="fixed" value="fixed">
											Fixed
										</SelectItem>
										<SelectItem key="percentage" value="percentage">
											Percentage
										</SelectItem>
									</Select>
								</div>

								<Button fullWidth color="primary" className="text-xl mt-auto">
									Update
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<div className="flex flex-col gap-4">
					<Field
						name="tokenSymbol"
						validators={{
							onSubmit: ({ value }) => (!value ? "Token symbol is required" : undefined),
						}}
						children={({ state, handleChange, handleBlur }) => (
							<Input
								label="Token Symbol"
								fullWidth
								classNames={{ input: "text-lg", label: "text-lg", errorMessage: "text-md" }}
								defaultValue={state.value}
								size="lg"
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
								errorMessage={state.meta.errors.join(",")}
								isInvalid={state.meta.errors.length > 0}
								onBlur={handleBlur}
							/>
						)}
					/>
					<Field
						name="tokenName"
						validators={{
							onSubmit: ({ value }) => (!value ? "Token name is required" : undefined),
						}}
						children={({ state, handleChange, handleBlur }) => (
							<Input
								label="Token Name"
								fullWidth
								classNames={{ input: "text-lg", label: "text-lg", errorMessage: "text-md" }}
								defaultValue={state.value}
								size="lg"
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
                errorMessage={state.meta.errors.join(",")}
								isInvalid={state.meta.errors.length > 0}
								onBlur={handleBlur}
							/>
						)}
					/>
					<Field
						name="description"
						validators={{
							onSubmit: ({ value }) => (!value ? "Description is required" : undefined),
						}}
						children={({ state, handleChange, handleBlur }) => (
							<Textarea
								label="Description"
								fullWidth
								classNames={{ input: "text-lg", label: "text-lg", errorMessage: "text-md" }}
								defaultValue={state.value}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
								size="lg"
                errorMessage={state.meta.errors.join(",")}
								isInvalid={state.meta.errors.length > 0}
								onBlur={handleBlur}
							/>
						)}
					/>
					<div className="grid grid-cols-1 md:grid-cols-4 grid-0 gap-y-4 md:gap-4 -mt-0 md:-mt-2">
						<Field name="icon" children={({ state, handleChange, handleBlur }) => <IconDropZone onFileChange={(image: any) => handleChange(image)} />} />

						<Field name="banner" children={({ state, handleChange, handleBlur }) => <BannerDropZone onFileChange={(image: any) => handleChange(image)} />} />
					</div>

					<Divider />

					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<Field
							name="website"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="Website"
									fullWidth
									classNames={{ input: "text-lg mt-0", label: "text-lg leading-none" }}
									labelPlacement="outside"
									placeholder="website link"
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									size="lg"
									onBlur={handleBlur}
								/>
							)}
						/>
						<Field
							name="twitter"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="X/Twitter"
									fullWidth
									classNames={{ input: "text-lg mt-0", label: "text-lg leading-none" }}
									labelPlacement="outside"
									placeholder="x link"
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									onBlur={handleBlur}
									size="lg"
								/>
							)}
						/>
						<Field
							name="telegram"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="Telegram"
									fullWidth
									classNames={{ input: "text-lg mt-0", label: "text-lg leading-none" }}
									labelPlacement="outside"
									placeholder="telegram link"
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									onBlur={handleBlur}
									size="lg"
								/>
							)}
						/>
						<Field
							name="discord"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="Discord"
									fullWidth
									classNames={{ input: "text-lg mt-0", label: "text-lg leading-none" }}
									labelPlacement="outside"
									placeholder="discord link"
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									onBlur={handleBlur}
									size="lg"
								/>
							)}
						/>
						<Field
							name="otherLink"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="Other Link"
									fullWidth
									classNames={{ input: "text-lg mt-0", label: "text-lg leading-none" }}
									labelPlacement="outside"
									placeholder="other link"
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									onBlur={handleBlur}
									size="lg"
								/>
							)}
						/>
					</div>

					<Divider />

					<div>
						<Field
							name="initialBuy"
							children={({ state, handleChange, handleBlur }) => (
								<Input
									label="Initial Buy"
									description="Optional: be the very first person to buy your token"
									fullWidth
									classNames={{
										input: "text-lg relative top-[6.2px]",
										label: "text-lg leading-none",
										description: "text-lg",
									}}
									type="number"
									startContent={
										<div className="flex items-center gap-2 relative top-[4px]">
											<Icon icon="token-branded:solana" className="w-4" />
											<span>SOL</span>
										</div>
									}
									defaultValue={state.value}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value)}
									onBlur={handleBlur}
								/>
							)}
						/>
					</div>

					<Field
						name="agreeTerms"
						children={({ state, handleChange }) => (
							<Checkbox checked={state.value} onChange={(e) => handleChange(e.target.checked)}>
								I agree to the FOMO3D <Link href="#">Terms of Service</Link>
							</Checkbox>
						)}
					/>

					<Button type="submit" fullWidth color="primary" className="text-xl" startContent={<Icon icon="fa6-solid:rocket" className="w-4" />}>
						Launch
					</Button>
				</div>
			</div>
		</form>
	);
}
