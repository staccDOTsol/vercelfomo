"use client";

import { Icon } from "@iconify/react";
import { Button, Card, CardBody, Input, Progress, Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarStats from "@/components/sidebar-stats";
import SlippageInput from "@/components/slippage-input";
import AmountInput from "@/components/amount-input";
import { useEffect, useMemo, useState } from "react";
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import { AddressLookupTableAccount, Connection, PublicKey, SystemProgram, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction} from '@solana/web3.js'
import { BN } from "bn.js";
import { CREATE_CPMM_POOL_PROGRAM, getCreatePoolKeys, getPdaPoolAuthority, getPdaPoolId, makeDepositCpmmInInstruction, makeInitializeMetadata, METADATA_PROGRAM_ID, TokenInfo } from "tokengobbler";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { createJupiterApiClient } from "@jup-ag/api";
import { createAssociatedLedgerAccountInstruction } from "@raydium-io/raydium-sdk-v2";

class LPAMM {
	constructor(
	  public virtualSolReserves: bigint,
	  public virtualTokenReserves: bigint,
	  public realSolReserves: bigint,
	  public realTokenReserves: bigint,
	  public initialVirtualTokenReserves: bigint,
	) {}
  
	mintPubkey: PublicKey | null = null;
  
	getBuyPrice(tokens: bigint): bigint {
	  if (tokens === BigInt(0) || tokens > this.virtualTokenReserves) {
		throw new Error("Invalid token amount");
	  }
  
	  const productOfReserves = this.virtualSolReserves * this.virtualTokenReserves;
	  const newVirtualTokenReserves = this.virtualTokenReserves - tokens;
	  const newVirtualSolReserves = productOfReserves / newVirtualTokenReserves + BigInt(1);
	  return newVirtualSolReserves - this.virtualSolReserves;
	}
  
	getSellPrice(tokens: bigint): bigint {
	  if (tokens === BigInt(0) || tokens > this.virtualTokenReserves) {
		throw new Error("Invalid token amount");
	  }
  
	  const productOfReserves = this.virtualSolReserves * this.virtualTokenReserves;
	  const newVirtualTokenReserves = this.virtualTokenReserves + tokens;
	  const newVirtualSolReserves = productOfReserves / newVirtualTokenReserves;
	  const solAmount = this.virtualSolReserves - newVirtualSolReserves;
	  return solAmount < this.realSolReserves ? solAmount : this.realSolReserves;
	}
  
	applyBuy(tokenAmount: bigint): { tokenAmount: bigint; solAmount: bigint } {
	  const finalTokenAmount = tokenAmount < this.realTokenReserves ? tokenAmount : this.realTokenReserves;
	  const solAmount = this.getBuyPrice(finalTokenAmount);
  
	  this.virtualTokenReserves -= finalTokenAmount;
	  this.realTokenReserves -= finalTokenAmount;
	  this.virtualSolReserves += solAmount;
	  this.realSolReserves += solAmount;
  
	  return { tokenAmount: finalTokenAmount, solAmount };
	}
  
	applySell(tokenAmount: bigint): { tokenAmount: bigint; solAmount: bigint } {
	  const solAmount = this.getSellPrice(tokenAmount);
  
	  this.virtualTokenReserves += tokenAmount;
	  this.realTokenReserves += tokenAmount;
	  this.virtualSolReserves -= solAmount;
	  this.realSolReserves -= solAmount;
  
	  return { tokenAmount, solAmount };
	}
  
	getBuyTokensWithSol(solAmount: bigint): { tokenAmount: bigint; solAmount: bigint } {
	  if (solAmount <= 0n) {
		return { tokenAmount: 0n, solAmount: 0n };
	  }
  
	  // Calculate the product of virtual reserves
	  const n = this.virtualSolReserves * this.virtualTokenReserves;
  
	  // Calculate the new virtual sol reserves after the purchase
	  const i = this.virtualSolReserves + solAmount;
  
	  // Calculate the new virtual token reserves after the purchase
	  const r = n / i + 1n;
  
	  // Calculate the amount of tokens to be purchased
	  let s = this.virtualTokenReserves - r;
  
	  // Ensure we don't exceed the real token reserves
	  s = s < this.realTokenReserves ? s : this.realTokenReserves;
  
	  // Ensure we're not returning zero tokens
	  if (s === 0n && solAmount > 0n) {
		s = 1n;
	  }
  
	  return { tokenAmount: s, solAmount };
	}
  }
export default function SingleTokenSidebar({
	token,
}: {
	token: {
		mint: string;
		name: string;
		symbol: string;
		price: number;
		marketCap: number;
		image: string;
		quote?: string;
		isBondingCurve: boolean;
	};
}) {
	

	const [solusdc, setSolusdc] = useState(150);
    const [sellAmount, setSellAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const RPC_URL = 'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW';
    const wallet = useWallet();
    const connection = new Connection(RPC_URL);
    const aw = useAnchorWallet();

    // RPC URL and necessary program IDs
    const PROGRAM_ID = new PublicKey('65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9'); // Replace with your program ID
    const TOKEN_PROGRAM_ID_2022 = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
	const jupiterApi = createJupiterApiClient({ basePath: "https://superswap.fomo3d.fun" })
    // Buy function
    const handleBuy = async () => {
        if (!aw) return null;
		const provider = new AnchorProvider(connection, aw, {});
	const IDL = await Program.fetchIdl(new PublicKey("65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9"), provider)
	const	program =  new Program(IDL as any, provider);
        if (!wallet.publicKey || !program) {
            console.error('Wallet not connected or program not initialized');
            return;
        }
        setIsProcessing(true);
        try {
            const tokenMint = new PublicKey(token.mint); // Replace with actual token mint address

            const [bondingCurvePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('bonding-curve'), tokenMint.toBuffer()],
                PROGRAM_ID
            );
            const [globalPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('global')],
                PROGRAM_ID
            );

            const userTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                wallet.publicKey,
                true,
                TOKEN_PROGRAM_ID_2022
            );

            const bondingCurveTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                bondingCurvePda,
                true,
                TOKEN_PROGRAM_ID_2022
            );

            const amountLamports = new BN(parseFloat(amount) * 10 ** 9);
			// @ts-ignore
			let ix = await program.methods
                .buy(amountLamports, new BN(Number.MAX_SAFE_INTEGER))
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePda,
                    global: globalPda,
                    bondingCurveTokenAccount: bondingCurveTokenAccount,
                    userTokenAccount: userTokenAccount,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID_2022,
                    sysvarRecentSlothashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
                    hydra: new PublicKey('AZHP79aixRbsjwNhNeuuVsWD4Gdv1vbYQd8nWKMGZyPZ'), // Replace with actual hydra address
                    program: PROGRAM_ID,
                })
                .instruction();
			if (!token.isBondingCurve) {
				// Fetch coin data from the API
				const response = await fetch('/api/pairs/new');
				if (!response.ok) {
					throw new Error('Failed to fetch coin data');
				}
				const coinData = await response.json();
				console.log(coinData)
				// Find our token in the coin data
				const ourToken = coinData.find(coin => coin.mint === token.mint);
				if (!ourToken) {
					throw new Error('Our token not found in coin data');
				}

				// Use SOL as the output token
				const outputToken = coinData.find(coin => coin.mint === 'So11111111111111111111111111111111111111112');
				if (!outputToken) {
					throw new Error('SOL token not found in coin data');
				}

				const tokenAMint = new PublicKey(ourToken.mint);
				const tokenBMint = new PublicKey(outputToken.mint);
				const isFront = new BN(tokenAMint.toBuffer()).lte(new BN(tokenBMint.toBuffer()));
				
				const [mintA, mintB] = isFront ? [tokenAMint, tokenBMint] : [tokenBMint, tokenAMint];
				const aa = new BN(amountLamports.toString());
				const ab = new BN(0); // Assuming we're only depositing one token
				
				const configId = 0;
				const [ammConfigKey, _bump] = PublicKey.findProgramAddressSync(
					[Buffer.from('amm_config'), new BN(configId).toArrayLike(Buffer, 'be', 8)],
					CREATE_CPMM_POOL_PROGRAM
				);
				const poolKeys = getCreatePoolKeys({
					creator: wallet.publicKey,
					programId: CREATE_CPMM_POOL_PROGRAM,
					mintA,
					mintB,
					configId: ammConfigKey
				});
				poolKeys.configId = ammConfigKey;
				// Initialize Jupiter API
				// Fetch quote for swapping SOL to tokenA
				const quoteA = await jupiterApi.quoteGet({
					inputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
					outputMint: token.mint,
					amount: Number(amountLamports),
					slippageBps: 100, // 1% slippage
				});
				
				// Fetch quote for swapping SOL to tokenB
				const quoteB = await jupiterApi.quoteGet({
					inputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
					outputMint: outputToken.mint,
					amount: Number(amountLamports),
					slippageBps: 100, // 1% slippage
				});
				
				if (!quoteA || !quoteB) {
					throw new Error('Failed to fetch quotes');
				}
				// Perform swaps
				const swapResultA = await jupiterApi.swapInstructionsPost({
					swapRequest: {
						userPublicKey: wallet.publicKey.toBase58(),
						quoteResponse: quoteA
					},
				});
				const swapResultB = await jupiterApi.swapInstructionsPost({
					swapRequest: {
						userPublicKey: wallet.publicKey.toBase58(),
						quoteResponse: quoteB
					},
				});

				const deserializeInstruction = (instruction) => {
					return new TransactionInstruction({
						programId: new PublicKey(instruction.programId),
						keys: instruction.accounts.map((key) => ({
							pubkey: new PublicKey(key.pubkey),
							isSigner: key.isSigner,
							isWritable: key.isWritable,
						})),
						data: Buffer.from(instruction.data, "base64"),
					});
				};

				const getAddressLookupTableAccounts = async (keys) => {
					const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
						keys.map((key) => new PublicKey(key))
					);

					return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
						const addressLookupTableAddress = keys[index];
						if (accountInfo) {
							const addressLookupTableAccount = new AddressLookupTableAccount({
								key: new PublicKey(addressLookupTableAddress),
								state: AddressLookupTableAccount.deserialize(accountInfo.data),
							});
							acc.push(addressLookupTableAccount);
						}
						return acc;
					}, []);
				};

				const addressLookupTableAccounts = await getAddressLookupTableAccounts(swapResultA.addressLookupTableAddresses);
				addressLookupTableAccounts.push(...(await getAddressLookupTableAccounts(swapResultB.addressLookupTableAddresses)));

				const blockhash = (await connection.getLatestBlockhash()).blockhash;
			
				// Update tokenAAmount and tokenBAmount with the expected output amounts
				const tokenAAmount = new BN(quoteA.outAmount);
				const tokenBAmount = new BN(quoteB.outAmount);

				ix = makeDepositCpmmInInstruction(
					CREATE_CPMM_POOL_PROGRAM,
					wallet.publicKey,
					getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
					poolKeys.id,
					poolKeys.lpMint,
					getAssociatedTokenAddressSync(mintA, wallet.publicKey),
					getAssociatedTokenAddressSync(mintB, wallet.publicKey),
					poolKeys.tokenVaultA,
					poolKeys.tokenVaultB,
					mintA,
					mintB,
					poolKeys.lpMint,
					new BN(0), // LP amount, 0 for single-sided deposit
					tokenAAmount,
					tokenBAmount,
					TOKEN_PROGRAM_ID_2022,
					TOKEN_PROGRAM_ID_2022
				);
				const messageV0 = new TransactionMessage({
					payerKey: wallet.publicKey,
					recentBlockhash: blockhash,
					instructions: [
						deserializeInstruction(swapResultA.swapInstruction),
						deserializeInstruction(swapResultB.swapInstruction),
						createAssociatedTokenAccountInstruction(
							wallet.publicKey,
							getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey),
							wallet.publicKey,
							poolKeys.lpMint
						),
						ix
					],
				}).compileToV0Message(addressLookupTableAccounts);
				const transaction = new VersionedTransaction(messageV0);

			}
			else {
				const tx = new Transaction();
				tx.add(createAssociatedTokenAccountInstruction(
					wallet.publicKey,
					getAssociatedTokenAddressSync(new PublicKey(token), wallet.publicKey),
					wallet.publicKey,
					new PublicKey(token)
				));
				tx.add(ix);
				const signature = await wallet.sendTransaction(tx, connection);
				console.log('Transaction signature', signature);
				await connection.confirmTransaction(signature, 'processed');
			}
        } catch (error) {
            console.error('Error during buy:', error);
        }
        setIsProcessing(false);
    };

    // Sell function
    const handleSell = async () => {
        if (!aw) return null;
        const provider = new AnchorProvider(connection, aw, {});
        const IDL = await Program.fetchIdl(new PublicKey("65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9"), provider);
        const program = new Program(IDL as any, provider);
        if (!wallet.publicKey || !program) {
            console.error('Wallet not connected or program not initialized');
            return;
        }
        setIsProcessing(true);
        try {
            const tokenMint = new PublicKey(token.mint);

            const [bondingCurvePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('bonding-curve'), tokenMint.toBuffer()],
                PROGRAM_ID
            );
            const [globalPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('global')],
                PROGRAM_ID
            );

            const userTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                wallet.publicKey,
                true,
                TOKEN_PROGRAM_ID_2022
            );

            const bondingCurveTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                bondingCurvePda,
                true,
                TOKEN_PROGRAM_ID_2022
            );

            const sellAmountLamports = new BN(parseFloat(sellAmount) * 10 ** 9);
// @ts-ignore
            const ix = await program.methods
                .sell(sellAmountLamports, new BN(0))
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePda,
                    global: globalPda,
                    bondingCurveTokenAccount: bondingCurveTokenAccount,
                    userTokenAccount: userTokenAccount,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID_2022,
                    hydra: new PublicKey('AZHP79aixRbsjwNhNeuuVsWD4Gdv1vbYQd8nWKMGZyPZ'),
                    program: PROGRAM_ID,
                })
                .instruction();

            if (!token.isBondingCurve) {
                // Fetch coin data from the API
                const response = await fetch('/api/pairs/new');
                if (!response.ok) {
                    throw new Error('Failed to fetch coin data');
                }
                const coinData = await response.json();
                
                // Find the output token data (assuming it's SOL for selling)
                const outputToken = coinData.find(coin => coin.address === 'So11111111111111111111111111111111111111112');
                if (!outputToken) {
                    throw new Error('Output token (SOL) not found in coin data');
                }

                // Fetch quote for swapping token to SOL
                const quote = await jupiterApi.quoteGet({
                    inputMint: token.mint,
                    outputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
                    amount: Number(sellAmountLamports),
                    slippageBps: 100, // 1% slippage
                });
                
                if (!quote) {
                    throw new Error('Failed to fetch quote');
                }

                // Perform swap
                const swapResult = await jupiterApi.swapInstructionsPost({
                    swapRequest: {
                        userPublicKey: wallet.publicKey.toBase58(),
                        quoteResponse: quote
                    },
                });

                const deserializeInstruction = (instruction) => {
                    return new TransactionInstruction({
                        programId: new PublicKey(instruction.programId),
                        keys: instruction.accounts.map((key) => ({
                            pubkey: new PublicKey(key.pubkey),
                            isSigner: key.isSigner,
                            isWritable: key.isWritable,
                        })),
                        data: Buffer.from(instruction.data, "base64"),
                    });
                };

                const getAddressLookupTableAccounts = async (keys) => {
                    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
                        keys.map((key) => new PublicKey(key))
                    );

                    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
                        const addressLookupTableAddress = keys[index];
                        if (accountInfo) {
                            const addressLookupTableAccount = new AddressLookupTableAccount({
                                key: new PublicKey(addressLookupTableAddress),
                                state: AddressLookupTableAccount.deserialize(accountInfo.data),
                            });
                            acc.push(addressLookupTableAccount);
                        }
                        return acc;
                    }, []);
                };

                const addressLookupTableAccounts = await getAddressLookupTableAccounts(swapResult.addressLookupTableAddresses);

                const blockhash = (await connection.getLatestBlockhash()).blockhash;

                const messageV0 = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: blockhash,
                    instructions: [
                        ix,
                        deserializeInstruction(swapResult.swapInstruction)
                    ],
                }).compileToV0Message(addressLookupTableAccounts);
                const transaction = new VersionedTransaction(messageV0);

                const signature = await wallet.sendTransaction(transaction, connection);
                console.log('Transaction signature', signature);
                await connection.confirmTransaction(signature, 'processed');
            } else {
                const tx = new Transaction().add(ix);
                const signature = await wallet.sendTransaction(tx, connection);
                console.log('Transaction signature', signature);
                await connection.confirmTransaction(signature, 'processed');
            }
        } catch (error) {
            console.error('Error during sell:', error);
        }
        setIsProcessing(false);
    };
	const [amount, setAmount] = useState("");

	useEffect(() => {
		const fetchSolUsdcPrice = async () => {
			try {
				const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
				if (response.ok) {
					const data = await response.json();
					setSolusdc(data.solana.usd);
				} else {
					console.error('Failed to fetch SOL/USDC price');
				}
			} catch (error) {
				console.error('Error fetching SOL/USDC price:', error);
			}
		};

		fetchSolUsdcPrice();
		const intervalId = setInterval(fetchSolUsdcPrice, 60000); // Update every minute

		return () => clearInterval(intervalId);
	}, []);
	const router = useRouter();
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const fetchBalance = async () => {
			const publicKey = new PublicKey(token)
			
			try {
				const balance = await connection.getBalance(publicKey);
				const calculatedProgress = (balance / 85) * 10 ** 9;
				setProgress(Math.min(100, Math.max(0, calculatedProgress))); // Ensure progress is between 0 and 100
			} catch (error) {
				console.error("Error fetching balance:", error);
			}
		};

		fetchBalance();
		const intervalId = setInterval(fetchBalance, 60000); // Update every minute

		return () => clearInterval(intervalId);
	}, []);
	console.log(token)
	return (
		<>
      <div className="flex justify-between items-center p-3">
        <div className="text-xl">{token.symbol} / SOL</div>
        <Button isIconOnly className="bg-white/10" size="sm" onClick={() => router.back()} aria-label="Close">
          <Icon icon="material-symbols-light:close" />
        </Button>
      </div>

			<div>
				<Image src={token.image} alt="Peppa" unoptimized className="w-full h-full" width={100} height={100} />
			</div>

			<div className="p-3 flex flex-col gap-2">
				{token.isBondingCurve && 
				<Card className="bg-transparent border border-white/10">
					<CardBody>
						<div className="leading-none -mt-1 pb-1 text-lg">
							Progress <span className="text-primary">{progress}%</span>
						</div>
						<Progress value={progress} size="md" />
					</CardBody>
				</Card>
			}
				<div className="grid grid-cols-2 gap-2">
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Price</div>
							<span className="text-2xl leading-none">
								{(token.price / 10 ** 9).toFixed(9)} SOL
							</span>
						</CardBody>
					</Card>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Market Cap</div>
							<span className="text-2xl leading-none">${((token.price / 10 ** 9)* 1_000_000_000 )* solusdc}$</span>
						</CardBody>
					</Card>
				</div>

				<div>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="flex flex-col gap-2">
							<Tabs color="primary" aria-label="Tabs" radius="full" fullWidth>
								<Tab key="buy" title="Buy" />
								<Tab key="sell" title="Sell" />
							</Tabs>

							<AmountInput amount={amount} setAmount={setAmount}/>

              <SlippageInput />

              <div className="flex flex-col gap-2 items-center">
             {aw && aw.signAllTransactions != undefined &&  (
               <>
                 <Button 
                   color="primary" 
                   className="w-full" 
                   onClick={handleBuy}
                   isLoading={isProcessing}
                 >
                   Buy
                 </Button>
                 <Button 
                   color="secondary" 
                   className="w-full" 
                   onClick={handleSell}
                   isLoading={isProcessing}
                 >
                   Sell
                 </Button>
               </>
             )}

                <span className="text-white/50 text-md">You will receive min <span className="text-white">614</span> @PEPPA</span>
              </div>
						</CardBody>
					</Card>
				</div>
        {/* Display sidebar statistics */}
        {/* <div>
          <SidebarStats />
        </div> */}
			</div>
		</>
	);
}
