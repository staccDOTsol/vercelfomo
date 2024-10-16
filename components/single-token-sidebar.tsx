"use client";

import { Icon } from "@iconify/react";
import { Button, Card, CardBody, Input, Progress, Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarStats from "@/components/sidebar-stats";
import SlippageInput from "@/components/slippage-input";
import AmountInput from "@/components/amount-input";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AddressLookupTableAccount, ComputeBudgetProgram, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction} from '@solana/web3.js'
import { BN } from "bn.js";
import { CREATE_CPMM_POOL_PROGRAM, getCreatePoolKeys, getPdaPoolAuthority, getPdaPoolId, makeDepositCpmmInInstruction, makeInitializeMetadata, makeWithdrawCpmmInInstruction, METADATA_PROGRAM_ID, TokenInfo } from "tokengobbler";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
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
  
  }
export default function SingleTokenSidebar({
	token,
}: {
	token: {
		completed: number;
		baseTokenMint: string;
		quoteTokenMint: string;
		mint: string;
		name: string;
		symbol: string;
		price: number;
		marketCap: number;
		image: string;
		quote?: string;
		isBondingCurve: boolean;
		programId: string
	};
}) {
	const fetchQuote = useCallback(async (inputMint: string, outputMint: string, amount: number) => {
		if (!inputMint || !outputMint || !amount) return null;
		try {
		  const quote = await jupiterApi.quoteGet({
			inputMint: inputMint,
			outputMint: outputMint,
			maxAccounts: 12,
			computeAutoSlippage: true,
			amount: Math.floor(amount/2),
			slippageBps: 1000, // 1% slippage
		  });
		  return quote;
		} catch (error) {
		  const jupiterApi2 = createJupiterApiClient()
		  const quote = await jupiterApi2.quoteGet({
			  inputMint: inputMint,
			  outputMint: outputMint,
			  maxAccounts: 12,
			  amount: Math.floor(amount/2),
			  slippageBps: 1000, // 1% slippage
			  computeAutoSlippage: true,
			});	
		  return quote;
		}
	  }, []);

	const [solusdc, setSolusdc] = useState(150);
    const [sellAmount, setSellAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const RPC_URL = 'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW';
    const wallet = useWallet();
    const connection = new Connection(RPC_URL, "confirmed");
    const aw = useAnchorWallet();

    // RPC URL and necessary program IDs

	const PROGRAM_IDS = [
		'65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9',
		'Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r',
	  ];
	const jupiterApi = createJupiterApiClient({ basePath: "https://superswap.fomo3d.fun" })
    // Buy function
    const handleBuy = async () => {
        if (!aw) return null;
		const PROGRAM_ID = new PublicKey(token.programId)
		const provider = new AnchorProvider(connection, aw, {});
	const IDL = await Program.fetchIdl(new PublicKey(token.programId), provider)
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
			const ai = await connection.getAccountInfo(tokenMint)
            const userTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                wallet.publicKey,
                true,
                ai?.owner || TOKEN_PROGRAM_ID
            );

            const bondingCurveTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                bondingCurvePda,
                true,
				ai?.owner || TOKEN_PROGRAM_ID
            );

            const  amountLamports = new BN(parseFloat(amount) * 10 ** 9);
			const ammAcc = await connection.getAccountInfo(bondingCurvePda)
			const data = ammAcc?.data.slice(8)
			const amm = new LPAMM(
			data?.readBigUInt64LE(0) || BigInt(0),
			data?.readBigUInt64LE(8) || BigInt(0),
			data?.readBigUInt64LE(16) || BigInt(0),
			data?.readBigUInt64LE(24) || BigInt(0),
			data?.readBigUInt64LE(32) || BigInt(0)
			)
console.log(token)
			const { tokenAmount } = amm.getBuyTokensWithSol(BigInt(amountLamports.toString()));

			if (!token.isBondingCurve) {

				const tokenAMint = new PublicKey(token.baseTokenMint );
				const tokenBMint = new PublicKey(token.quoteTokenMint);
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
				const quoteA = await fetchQuote(
					'So11111111111111111111111111111111111111112', // SOL mint address
					mintA.toString(),
					Number(amountLamports)
				);
				
				// Fetch quote for swapping SOL to tokenB
				const quoteB = await fetchQuote(
					'So11111111111111111111111111111111111111112', // SOL mint address
					mintB.toString(),
					Number(amountLamports)
				);
				
				if (!quoteA || !quoteB) {
					throw new Error('Failed to fetch quotes');
				}
				
async function getInitAmounts(targetAmount0: bigint, targetAmount1: bigint, maxIterations: number = 500) {
    const response = await fetch('https://superswap.fomo3d.fun/deposit-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            token_0_amount: Number(targetAmount0.toString()),
            token_1_amount: Number(targetAmount1.toString()),
            pool_address: poolKeys.poolId.toString()
        }),
        })

    if (!response.ok) {
        throw new Error("Failed to fetch init amounts");
    }

    return await response.json();
}
let initAmount0 = BigInt(0);
let initAmount1 = BigInt(0);
let result;
try {
    const targetAmountA = BigInt(quoteA.outAmount);
    const targetAmountB = BigInt(quoteB.outAmount);
    result = await getInitAmounts(targetAmountA, targetAmountB);
    console.log('Init amounts result:', result);

     initAmount0 = BigInt(result.token_0_amount	 );
     initAmount1 = BigInt(result.token_1_amount);

    console.log('Final init amounts:', { initAmount0: initAmount0.toString(), initAmount1: initAmount1.toString() });
    console.log('Iterations taken:', result.iterations);

    // Use initAmount0 and initAmount1 for further processing if needed
} catch (error) {
    console.error('Error getting init amounts:', error);
    // Handle the error appropriately, maybe set an error state or show a notification
    throw new Error('Failed to calculate initial amounts');
}
				if (!quoteA || !quoteB) {
					throw new Error('Failed to fetch quotes');
				}
				let swapResultA;
				let swapResultB;
				try { 
				// Perform swaps
				 swapResultA = await jupiterApi.swapInstructionsPost({
					swapRequest: {
						userPublicKey: wallet.publicKey.toBase58(),
						quoteResponse: quoteA,
						wrapAndUnwrapSol: true
						,computeUnitPriceMicroLamports: 633333
					},
				});
				} catch (error) {
					const jupiterApi2 = createJupiterApiClient()
					 swapResultA = await jupiterApi2.swapInstructionsPost({
						swapRequest: {
							userPublicKey: wallet.publicKey.toBase58(),
							quoteResponse: quoteA,
							wrapAndUnwrapSol: true
							,computeUnitPriceMicroLamports: 633333
						},
					});
				}
				try { 
				 swapResultB = await jupiterApi.swapInstructionsPost({
					swapRequest: {
						userPublicKey: wallet.publicKey.toBase58(),
						quoteResponse: quoteB,
						wrapAndUnwrapSol: true
						,computeUnitPriceMicroLamports: 633333
					},
				});
			} catch (error) {
				const jupiterApi2 = createJupiterApiClient()
				 swapResultB = await jupiterApi2.swapInstructionsPost({
					swapRequest: {
						userPublicKey: wallet.publicKey.toBase58(),
						quoteResponse: quoteB,
						wrapAndUnwrapSol: true
						,computeUnitPriceMicroLamports: 633333
					},
				});
				console.error('Error during swap:', error);
			}
				const deserializeInstruction = (instruction: any) => {
					return new TransactionInstruction({
						programId: new PublicKey(instruction.programId),
						keys: instruction.accounts.map((key: any) => ({
							pubkey: new PublicKey(key.pubkey),
							isSigner: key.isSigner,
							isWritable: key.isWritable,
						})),
						data: Buffer.from(instruction.data, "base64"),
					});
				};

				const getAddressLookupTableAccounts = async (keys: any) => {
					const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
							keys.map((key: any) => new PublicKey(key))
					);

					return addressLookupTableAccountInfos.reduce((acc: any, accountInfo: any, index: any) => {
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
				const tokenAAmount = new BN(quoteA.outAmount);
				const tokenBAmount = new BN(quoteB.outAmount);
				const anai = await connection.getAccountInfo(getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey))
				const someIxs : TransactionInstruction[] = [] 
				if (!anai){
					someIxs.push(
						createAssociatedTokenAccountInstruction(
							wallet.publicKey,
							getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey),
							wallet.publicKey,
							poolKeys.lpMint
						)
					);
				}

				let ix = makeDepositCpmmInInstruction(
					CREATE_CPMM_POOL_PROGRAM,
					wallet.publicKey,
					getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
					poolKeys.poolId,
					poolKeys.lpMint,
					getAssociatedTokenAddressSync(mintA, wallet.publicKey),
					getAssociatedTokenAddressSync(mintB, wallet.publicKey),
					poolKeys.vaultA,
					poolKeys.vaultA,
					mintA,
					mintB,
					poolKeys.lpMint,
                    (new BN(Math.sqrt(Number(initAmount0) * Number(initAmount1)))).div(new BN(2)),
					new BN(Number.MAX_SAFE_INTEGER),
					new BN(Number.MAX_SAFE_INTEGER),
					// @ts-ignore
					(await connection.getAccountInfo(poolKeys.vaultA)).owner,
					// @ts-ignore
					(await connection.getAccountInfo(poolKeys.vaultA)).owner,				);
					someIxs.push(ix)
				// Create separate transactions for setup instructions
			

				const processSwapResult = async (swapResult: any, swapResultB: any, someIxs: any) => {
					const {
						computeBudgetInstructions,
						swapInstruction: swapInstructionPayload,
						addressLookupTableAddresses,
						setupInstructions,
						cleanupInstruction
					} = swapResult;
					const {
						computeBudgetInstructions: computeBudgetInstructionsB,
						swapInstruction: swapInstructionPayloadB,
						addressLookupTableAddresses: addressLookupTableAddressesB,
						setupInstructions: setupInstructionsB,
						cleanupInstruction: cleanupInstructionB
					} = swapResultB;

					const addressLookupTableAccounts = await getAddressLookupTableAccounts(addressLookupTableAddresses);
					const addressLookupTableAccountsB = await getAddressLookupTableAccounts(addressLookupTableAddressesB);
					const blockhash = (await connection.getLatestBlockhash()).blockhash;
					const messageV0 = new TransactionMessage({
						payerKey: wallet.publicKey as PublicKey,
						recentBlockhash: blockhash,
						instructions: [
							ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),
					
							deserializeInstruction(swapInstructionPayload),
							deserializeInstruction(swapInstructionPayloadB),
							...someIxs
						],
					}).compileToV0Message([...addressLookupTableAccounts, ...addressLookupTableAccountsB])
					const messagev02 = new TransactionMessage({	
						payerKey: wallet.publicKey as PublicKey,
						recentBlockhash: blockhash,
						instructions: [
							ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),
						...setupInstructions.map(deserializeInstruction),
						...setupInstructionsB.map(deserializeInstruction),
						]
					}).compileToV0Message([...addressLookupTableAccounts, ...addressLookupTableAccountsB])
					const messagev022z = new TransactionMessage({	
						payerKey: wallet.publicKey as PublicKey,
						recentBlockhash: blockhash,
						instructions: [
								ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),
								...(cleanupInstruction ? [deserializeInstruction(cleanupInstruction)] : []),
								...(cleanupInstructionB ? [deserializeInstruction(cleanupInstructionB)] : []),
						]
					}).compileToV0Message([...addressLookupTableAccounts, ...addressLookupTableAccountsB])
					return [ new VersionedTransaction(messagev02),new VersionedTransaction(messageV0), new VersionedTransaction(messagev022z)];
				};

                const transactions = await processSwapResult(swapResultA, swapResultB, someIxs);
                if (!wallet.signAllTransactions) return;
				const signed = await wallet.signAllTransactions(transactions)
				console.log(signed)		
				const sig = await connection.sendRawTransaction(signed[0].serialize())
				console.log(sig)
				const awaited = await connection.confirmTransaction(sig, "processed")
				
				const sig2 = await connection.sendRawTransaction(signed[1].serialize())
				const sig3 = await connection.sendRawTransaction(signed[2].serialize())
				console.log(sig, awaited, sig2, sig3)

			}
			else {

			// @ts-ignore
			let ix = await program.methods
			.buy(new BN(tokenAmount.toString()), new BN(Number.MAX_SAFE_INTEGER))
			.accounts({
				user: wallet.publicKey,
				mint: tokenMint,
				bondingCurve: bondingCurvePda,
				global: globalPda,
				bondingCurveTokenAccount: bondingCurveTokenAccount,
				userTokenAccount: userTokenAccount,
				systemProgram: SystemProgram.programId,
				tokenProgram:  ai?.owner || TOKEN_PROGRAM_ID,
				sysvarRecentSlothashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
				hydra: new PublicKey('LkMTMqZR2maLzzy7GdYJmUnbE2j8jLyEHGbckYoFoMo'), // Replace with actual hydra address
				program: PROGRAM_ID,
			})
			.instruction();
				const tx = new Transaction();
				tx.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}))
				const ai2 = await connection.getAccountInfo(getAssociatedTokenAddressSync(new PublicKey(token.mint), wallet.publicKey, true, ai?.owner || TOKEN_PROGRAM_ID))
				if (!ai2){
				tx.add(createAssociatedTokenAccountInstruction(
					wallet.publicKey,
					getAssociatedTokenAddressSync(new PublicKey(token.mint), wallet.publicKey, true, ai?.owner || TOKEN_PROGRAM_ID),
					wallet.publicKey,
					new PublicKey(token.mint),
					ai?.owner || TOKEN_PROGRAM_ID
				));
			}
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
			const PROGRAM_ID = new PublicKey(token.programId)
const ai = await connection.getAccountInfo(tokenMint)
            const [bondingCurvePda] = PublicKey.findProgramAddressSync(
                [Buffer.from('bonding-curve'), tokenMint.toBuffer()],
                PROGRAM_ID
            );
			const TOKEN_PROGRAM_ID_2022 = ai?.owner || TOKEN_PROGRAM_ID
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

            const sellAmountLamports = new BN(parseFloat(amount) * 10 ** 9);
            const ammAcc = await connection.getAccountInfo(bondingCurvePda);
            const data = ammAcc?.data.slice(8);
            const amm = new LPAMM(
                data?.readBigUInt64LE(0) || BigInt(0),
                data?.readBigUInt64LE(8) || BigInt(0),
                data?.readBigUInt64LE(16) || BigInt(0),
                data?.readBigUInt64LE(24) || BigInt(0),
                data?.readBigUInt64LE(32) || BigInt(0)
            );

            const { tokenAmount, solAmount } = amm.getBuyTokensWithSol(BigInt(sellAmountLamports.toString()));
            
            // Update sellAmountLamports to use the calculated tokenAmount
// @ts-ignore

            if (!token.isBondingCurve) {
                const tokenAMint = new PublicKey(token.baseTokenMint);
                const tokenBMint = new PublicKey(token.quoteTokenMint);
                const isFront = new BN(tokenAMint.toBuffer()).lte(new BN(tokenBMint.toBuffer()));
                
                const [mintA, mintB] = isFront ? [tokenAMint, tokenBMint] : [tokenBMint, tokenAMint];
                const aa = new BN(sellAmountLamports.toString());
                const ab = new BN(0); // Assuming we're only selling one token
                
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
                const blockhash = (await connection.getLatestBlockhash()).blockhash;
                const userBaseTokenAccount = await getAssociatedTokenAddressSync(
                    new PublicKey(token.baseTokenMint),
                    wallet.publicKey,
                    true,
                    TOKEN_PROGRAM_ID_2022
                );
                const userQuoteTokenAccount = await getAssociatedTokenAddressSync(
                    new PublicKey(token.quoteTokenMint),
                    wallet.publicKey,
                    true,
                    TOKEN_PROGRAM_ID_2022
                );
                // Fetch initial token balances
                const initialBaseBalance = await connection.getTokenAccountBalance(userBaseTokenAccount);
                const initialQuoteBalance = await connection.getTokenAccountBalance(userQuoteTokenAccount);

                async function getInitAmounts(targetAmount0: bigint, targetAmount1: bigint, maxIterations: number = 500) {
                    const response = await fetch('https://superswap.fomo3d.fun/withdraw-estimate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            token_0_amount: Number(targetAmount0.toString()),
                            token_1_amount: Number(targetAmount1.toString()),
                            pool_address: poolKeys.poolId.toString()
                        }),
                    });

                    if (!response.ok) {
                        throw new Error("Failed to fetch init amounts");
                    }

                    return await response.json();
                }

                let initAmount0 = BigInt(0);
                let initAmount1 = BigInt(0);
                let result;
                const halfSellAmount = BigInt(sellAmountLamports.toString()) / BigInt(2);
                
                // Fetch quote for swapping SOL to base token
                console.log(`Fetching quote for base token: ${token.baseTokenMint}, amount: ${Number(halfSellAmount)}`);
                let quoteBase = await fetchQuote('So11111111111111111111111111111111111111112', token.baseTokenMint, Number(sellAmountLamports)) as QuoteResponse;
                
                // Fetch quote for swapping SOL to quote token
                console.log(`Fetching quote for quote token: ${token.quoteTokenMint}, amount: ${Number(halfSellAmount)}`);
                let quoteQuote = await fetchQuote('So11111111111111111111111111111111111111112', token.quoteTokenMint, Number(sellAmountLamports)) as QuoteResponse;
                
                console.log('Quotes:', quoteBase, quoteQuote);

                if (!quoteBase?.outAmount || !quoteQuote?.outAmount) {
                    throw new Error('Failed to fetch quotes for base or quote token');
                }

                try {
                    console.log(`Fetching init amounts for targetAmountA: ${quoteBase.outAmount}, targetAmountB: ${quoteQuote.outAmount}`);
                    result = await getInitAmounts(BigInt(quoteBase.outAmount), BigInt(quoteQuote.outAmount));
                    console.log('Init amounts result:', result);

                    initAmount0 = BigInt(result.token_0_amount);
                    initAmount1 = BigInt(result.token_1_amount);

                    console.log('Final init amounts:', { initAmount0: initAmount0.toString(), initAmount1: initAmount1.toString() });
                } catch (error) {
                    console.error('Error getting init amounts:', error);
                    throw new Error('Failed to calculate initial amounts');
                }
				       // Fetch quote for swapping base token to SOL
					   console.log(`Fetching quote for base token: ${token.baseTokenMint}, amount: ${Number(quoteBase.outAmount)}`);
					    quoteBase = await fetchQuote(token.baseTokenMint, 'So11111111111111111111111111111111111111112', Number(quoteBase.outAmount)*2) as QuoteResponse;
					   
					   // Fetch quote for swapping quote token to SOL
					   console.log(`Fetching quote for quote token: ${token.quoteTokenMint}, amount: ${Number(quoteQuote.outAmount)}`);
					    quoteQuote = await fetchQuote(token.quoteTokenMint, 'So11111111111111111111111111111111111111112', Number(quoteQuote.outAmount)*2) as QuoteResponse;
console.log('Quotes:', quoteBase, quoteQuote);	
                // Perform withdraw instruction
               

                // Perform swaps
                let swapResultBase;
                let swapResultQuote;
                try { 
                    swapResultBase = await jupiterApi.swapInstructionsPost({
                        swapRequest: {
                            userPublicKey: wallet.publicKey.toBase58(),
                            quoteResponse: quoteBase,
                            wrapAndUnwrapSol: true
							,computeUnitPriceMicroLamports: 633333
                        },
                    });
                } catch (error) {
                    const jupiterApi2 = createJupiterApiClient()
                    swapResultBase = await jupiterApi2.swapInstructionsPost({
                        swapRequest: {
                            userPublicKey: wallet.publicKey.toBase58(),
                            quoteResponse: quoteBase,
                            wrapAndUnwrapSol: true
							,computeUnitPriceMicroLamports: 633333
                        },
                    });
                }
                try { 
                    swapResultQuote = await jupiterApi.swapInstructionsPost({
                        swapRequest: {
                            userPublicKey: wallet.publicKey.toBase58(),
                            quoteResponse: quoteQuote,
                            wrapAndUnwrapSol: true
							,computeUnitPriceMicroLamports: 633333
                        },
                    });
                } catch (error) {
                    const jupiterApi2 = createJupiterApiClient()
                    swapResultQuote = await jupiterApi2.swapInstructionsPost({
                        swapRequest: {
                            userPublicKey: wallet.publicKey.toBase58(),
                            quoteResponse: quoteQuote,
                            wrapAndUnwrapSol: true
							,computeUnitPriceMicroLamports: 633333
                        },
                    });
                    console.error('Error during swap:', error);
                }

                const deserializeInstruction = (instruction: any) => {
                    return new TransactionInstruction({
                        programId: new PublicKey(instruction.programId),
                        keys: instruction.accounts.map((key: any) => ({
                            pubkey: new PublicKey(key.pubkey),
                            isSigner: key.isSigner,
                            isWritable: key.isWritable,
                        })),
                        data: Buffer.from(instruction.data, "base64"),
                    });
                };

                const getAddressLookupTableAccounts = async (keys: any) => {
                    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
                        keys.map((key: any) => new PublicKey(key))
                    );

                    return addressLookupTableAccountInfos.reduce((acc: any, accountInfo: any, index: any) => {
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

                const baseTokenAmount = new BN(quoteBase.outAmount);
                const quoteTokenAmount = new BN(quoteQuote.outAmount);
                const anai = await connection.getAccountInfo(getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey))
                const someIxs : TransactionInstruction[] = [] 
                if (!anai){
                    someIxs.push(
                        createAssociatedTokenAccountInstruction(
                            wallet.publicKey,
                            getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey),
                            wallet.publicKey,
                            poolKeys.lpMint
                        )
                    );
                }

                const withdrawIx = makeWithdrawCpmmInInstruction(
                    CREATE_CPMM_POOL_PROGRAM,
                    wallet.publicKey,
                    getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
                    poolKeys.poolId,
                    poolKeys.lpMint,
                    getAssociatedTokenAddressSync(mintA, wallet.publicKey),
                    getAssociatedTokenAddressSync(mintB, wallet.publicKey),
                    poolKeys.vaultA,
                    poolKeys.vaultB,
                    mintA,
                    mintB,
                    poolKeys.lpMint,
                    new BN(Math.sqrt(Number(initAmount0) * Number(initAmount1))).div(new BN(2)),
                    new BN(0),
                    new BN(0),
                    // @ts-ignore
                    (await connection.getAccountInfo(poolKeys.vaultA)).owner,
                    // @ts-ignore
                    (await connection.getAccountInfo(poolKeys.vaultB)).owner
                );
                someIxs.push(withdrawIx)

                const processSwapResult = async (swapResultBase: any, swapResultQuote: any, someIxs: any) => {
                    const {
                        computeBudgetInstructions: computeBudgetInstructionsBase,
                        swapInstruction: swapInstructionPayloadBase,
                        addressLookupTableAddresses: addressLookupTableAddressesBase,
                        setupInstructions: setupInstructionsBase,
						cleanupInstruction: cleanupInstructionBase
                    } = swapResultBase;
                    const {
                        computeBudgetInstructions: computeBudgetInstructionsQuote,
                        swapInstruction: swapInstructionPayloadQuote,
                        addressLookupTableAddresses: addressLookupTableAddressesQuote,
                        setupInstructions: setupInstructionsQuote,
						cleanupInstruction: cleanupInstructionQuote
                    } = swapResultQuote;

                    const addressLookupTableAccountsBase = await getAddressLookupTableAccounts(addressLookupTableAddressesBase);
                    const addressLookupTableAccountsQuote = await getAddressLookupTableAccounts(addressLookupTableAddressesQuote);
                    const blockhash = (await connection.getLatestBlockhash()).blockhash;
                    const messageV0 = new TransactionMessage({
                        payerKey: wallet.publicKey as PublicKey,
                        recentBlockhash: blockhash,
                        instructions: [

							ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),                            ...someIxs,
                            ...setupInstructionsBase.map(deserializeInstruction),
                            deserializeInstruction(swapInstructionPayloadBase),
                            ...setupInstructionsQuote.map(deserializeInstruction),
                            deserializeInstruction(swapInstructionPayloadQuote),
                        ],
                    }).compileToV0Message([...addressLookupTableAccountsBase, ...addressLookupTableAccountsQuote])
					const messagev02 = new TransactionMessage({	
						payerKey: wallet.publicKey as PublicKey,
						recentBlockhash: blockhash,
						instructions: [
							ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),
						...setupInstructionsBase.map(deserializeInstruction),
						...setupInstructionsQuote.map(deserializeInstruction),
						]
					}).compileToV0Message([...addressLookupTableAccountsBase, ...addressLookupTableAccountsQuote])
					const messagev022z = new TransactionMessage({	
						payerKey: wallet.publicKey as PublicKey,
						recentBlockhash: blockhash,
						instructions: [
							ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}),
							...(cleanupInstructionBase ? [deserializeInstruction(cleanupInstructionBase)] : []),
							...(cleanupInstructionQuote ? [deserializeInstruction(cleanupInstructionQuote)] : []),
						]
					}).compileToV0Message([...addressLookupTableAccountsBase, ...addressLookupTableAccountsQuote])
					
					return [ new VersionedTransaction(messagev02),new VersionedTransaction(messageV0), new VersionedTransaction(messagev022z)];
				};

                const transactions = await processSwapResult(swapResultBase, swapResultQuote, someIxs);
                if (!wallet.signAllTransactions) return;
				const signed = await wallet.signAllTransactions(transactions)
				console.log(signed)		
				const sig = await connection.sendRawTransaction(signed[0].serialize())
				console.log(sig)
				const awaited = await connection.confirmTransaction(sig, "processed")
				
				const sig2 = await connection.sendRawTransaction(signed[1].serialize())
				const sig3 = await connection.sendRawTransaction(signed[2].serialize())
				console.log(sig, awaited, sig2, sig3)

            } else {

				// @ts-ignore
				const ix = await program.methods
				// @ts-ignore
                .sell(new BN(tokenAmount.toString()), new BN(0))
                .accounts({
                    user: wallet.publicKey,
                    mint: tokenMint,
                    bondingCurve: bondingCurvePda,
                    global: globalPda,
                    bondingCurveTokenAccount: bondingCurveTokenAccount,
                    userTokenAccount: userTokenAccount,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID_2022,
                    hydra: new PublicKey('LkMTMqZR2maLzzy7GdYJmUnbE2j8jLyEHGbckYoFoMo'),
                    program: PROGRAM_ID,
                })
                .instruction();
                const tx = new Transaction()
				.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333})).
				add(ix);
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

	const router = useRouter();
	const [progress, setProgress] = useState(token.completed);

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
							<span className="inter text-sm font-black leading-none">
								{(token.price / 10 ** 9).toFixed(9)} SOL
							</span>
						</CardBody>
					</Card>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Market Cap</div>
							<span className="inter text-sm font-black leading-none">${((token.price / 10 ** 9)* 1_000_000_000 )* solusdc}</span>
						</CardBody>
					</Card>
				</div>

				<div>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="flex flex-col gap-2">
						
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

                <span className="text-white/50 text-xs inter">You will receive min <span className="text-white">614</span> @PEPPA</span>
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
