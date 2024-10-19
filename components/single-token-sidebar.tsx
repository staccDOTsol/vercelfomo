"use client";

import { Icon } from "@iconify/react";
import { Button, Card, CardBody, Input, Progress, Tab, Tabs } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SidebarStats from "@/components/sidebar-stats";
import SlippageInput from "@/components/slippage-input";
import AmountInput from "@/components/amount-input";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AddressLookupTableAccount, ComputeBudgetProgram, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, SYSVAR_RECENT_BLOCKHASHES_PUBKEY, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction} from '@solana/web3.js'
import { BN } from "bn.js";
import {
	CREATE_CPMM_POOL_PROGRAM,
	getCreatePoolKeys,
	getPdaPoolAuthority,
	getPdaPoolId,
	makeDepositCpmmInInstruction,
	makeInitializeMetadata,
	makeWithdrawCpmmInInstruction,
	METADATA_PROGRAM_ID,
	TokenInfo,
} from "tokengobbler";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { createJupiterApiClient, QuoteResponse } from "@jup-ag/api";
import { createAssociatedLedgerAccountInstruction } from "@raydium-io/raydium-sdk-v2";
import { utf8 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
const burnIt = {
	"address": "HnQDbgpFbZCa3GfZ3MtZUHXVYyU2nWPVGAMYWYn3D7mo",
	"metadata": {
	  "name": "burnittweetit",
	  "version": "0.1.0",
	  "spec": "0.1.0",
	  "description": "Created with Anchor"
	},
	"instructions": [
	  {
		"name": "burn_tokens",
		"discriminator": [
		  76,
		  15,
		  51,
		  254,
		  229,
		  215,
		  121,
		  66
		],
		"accounts": [
		  {
			"name": "state",
			"writable": true
		  },
		  {
			"name": "token_account",
			"writable": true
		  },
		  {
			"name": "mint",
			"writable": true,
			"address": "BiEydESECDhjrw2cyKbGTaeAMp84ASfgWGyaq3DJ83Uq"
		  },
		  {
			"name": "token_program",
			"address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
		  },
		  {
			"name": "user",
			"writable": true,
			"signer": true
		  },
		  {
			"name": "nft_mint",
			"writable": true,
			"pda": {
			  "seeds": [
				{
				  "kind": "const",
				  "value": [
					110,
					102,
					116,
					95,
					109,
					105,
					110,
					116
				  ]
				},
				{
				  "kind": "account",
				  "path": "user"
				},
				{
				  "kind": "account",
				  "path": "state"
				}
			  ]
			}
		  },
		  {
			"name": "nft_mint_authority",
			"pda": {
			  "seeds": [
				{
				  "kind": "const",
				  "value": [
					110,
					102,
					116,
					95,
					109,
					105,
					110,
					116,
					95,
					97,
					117,
					116,
					104,
					111,
					114,
					105,
					116,
					121
				  ]
				},
				{
				  "kind": "account",
				  "path": "state"
				}
			  ]
			}
		  },
		  {
			"name": "nft_token_account",
			"writable": true,
			"pda": {
			  "seeds": [
				{
				  "kind": "account",
				  "path": "winner"
				},
				{
				  "kind": "const",
				  "value": [
					6,
					221,
					246,
					225,
					215,
					101,
					161,
					147,
					217,
					203,
					225,
					70,
					206,
					235,
					121,
					172,
					28,
					180,
					133,
					237,
					95,
					91,
					55,
					145,
					58,
					140,
					245,
					133,
					126,
					255,
					0,
					169
				  ]
				},
				{
				  "kind": "account",
				  "path": "nft_mint"
				}
			  ],
			  "program": {
				"kind": "const",
				"value": [
				  140,
				  151,
				  37,
				  143,
				  78,
				  36,
				  137,
				  241,
				  187,
				  61,
				  16,
				  41,
				  20,
				  142,
				  13,
				  131,
				  11,
				  90,
				  19,
				  153,
				  218,
				  255,
				  16,
				  132,
				  4,
				  142,
				  123,
				  216,
				  219,
				  233,
				  248,
				  89
				]
			  }
			}
		  },
		  {
			"name": "metadata",
			"writable": true
		  },
		  {
			"name": "winner"
		  },
		  {
			"name": "metadata_program"
		  },
		  {
			"name": "rent",
			"address": "SysvarRent111111111111111111111111111111111"
		  },
		  {
			"name": "system_program",
			"address": "11111111111111111111111111111111"
		  },
		  {
			"name": "associated_token_program",
			"address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  },
		  {
			"name": "memo",
			"type": {
			  "array": [
				"u8",
				128
			  ]
			}
		  }
		]
	  },
	  {
		"name": "initialize",
		"discriminator": [
		  175,
		  175,
		  109,
		  31,
		  13,
		  152,
		  155,
		  237
		],
		"accounts": [
		  {
			"name": "state",
			"writable": true,
			"signer": true
		  },
		  {
			"name": "user",
			"writable": true,
			"signer": true
		  },
		  {
			"name": "collection_mint",
			"writable": true,
			"pda": {
			  "seeds": [
				{
				  "kind": "const",
				  "value": [
					99,
					111,
					108,
					108,
					101,
					99,
					116,
					105,
					111,
					110,
					95,
					109,
					105,
					110,
					116
				  ]
				}
			  ]
			}
		  },
		  {
			"name": "collection_metadata",
			"writable": true
		  },
		  {
			"name": "metadata_program",
			"address": "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
		  },
		  {
			"name": "token_program",
			"address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
		  },
		  {
			"name": "rent",
			"address": "SysvarRent111111111111111111111111111111111"
		  },
		  {
			"name": "system_program",
			"address": "11111111111111111111111111111111"
		  },
		  {
			"name": "collection_token_account",
			"writable": true,
			"pda": {
			  "seeds": [
				{
				  "kind": "account",
				  "path": "user"
				},
				{
				  "kind": "const",
				  "value": [
					6,
					221,
					246,
					225,
					215,
					101,
					161,
					147,
					217,
					203,
					225,
					70,
					206,
					235,
					121,
					172,
					28,
					180,
					133,
					237,
					95,
					91,
					55,
					145,
					58,
					140,
					245,
					133,
					126,
					255,
					0,
					169
				  ]
				},
				{
				  "kind": "account",
				  "path": "collection_mint"
				}
			  ],
			  "program": {
				"kind": "const",
				"value": [
				  140,
				  151,
				  37,
				  143,
				  78,
				  36,
				  137,
				  241,
				  187,
				  61,
				  16,
				  41,
				  20,
				  142,
				  13,
				  131,
				  11,
				  90,
				  19,
				  153,
				  218,
				  255,
				  16,
				  132,
				  4,
				  142,
				  123,
				  216,
				  219,
				  233,
				  248,
				  89
				]
			  }
			}
		  },
		  {
			"name": "associated_token_program",
			"address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
		  }
		],
		"args": []
	  }
	],
	"accounts": [
	  {
		"name": "State",
		"discriminator": [
		  216,
		  146,
		  107,
		  94,
		  104,
		  75,
		  182,
		  177
		]
	  }
	],
	"types": [
	  {
		"name": "State",
		"type": {
		  "kind": "struct",
		  "fields": [
			{
			  "name": "highest_burn",
			  "type": "u64"
			},
			{
			  "name": "winner",
			  "type": "pubkey"
			},
			{
			  "name": "end_time",
			  "type": "i64"
			},
			{
			  "name": "winner_memo",
			  "type": "string"
			},
			{
			  "name": "winners",
			  "type": "u64"
			},
			{
			  "name": "jare",
			  "type": "pubkey"
			},
			{
			  "name": "collection_mint",
			  "type": "pubkey"
			}
		  ]
		}
	  }
	]
  } as Idl
class LPAMM {
	constructor(public virtualSolReserves: bigint, public virtualTokenReserves: bigint, public realSolReserves: bigint, public realTokenReserves: bigint, public initialVirtualTokenReserves: bigint) {}

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
		programId: string;
	};
}) {
	const fetchQuote = useCallback(async (inputMint: string, outputMint: string, amount: number) => {
		if (!inputMint || !outputMint || !amount) return null;
		try {
		  const quote = await jupiterApi.quoteGet({
			inputMint: inputMint,
			outputMint: outputMint,
			maxAccounts: 18,
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
			  maxAccounts: 18,
			  amount: Math.floor(amount/2),
			  slippageBps: 1000, // 1% slippage
			  computeAutoSlippage: true,
			});	
		  return quote;
		}
	  }, []);

	const [solusdc, setSolusdc] = useState(150);
	const [sellAmount, setSellAmount] = useState("");
	const [buyIsProcessing, setBuyIsProcessing] = useState(false);
	const [sellIsProcessing, setSellIsProcessing] = useState(false);

    const RPC_URL = 'https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW';
    const wallet = useWallet();
    const connection = new Connection(RPC_URL, "confirmed");
    const aw = useAnchorWallet();

	// RPC URL and necessary program IDs

	const PROGRAM_IDS = ["65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9", "Ei1CgRq6SMB8wQScEKeRMGYkyb3YmRTaej1hpHcqAV9r"];
	const jupiterApi = createJupiterApiClient({ basePath: "https://superswap.fomo3d.fun" });
	// Buy function
	const handleBuy = async () => {
		if (!aw) return null;
		const PROGRAM_ID = new PublicKey(token.programId);
		const provider = new AnchorProvider(connection, aw, {});
		const IDL = await Program.fetchIdl(new PublicKey(token.programId), provider);
		const program = new Program(IDL as any, provider);

		if (!wallet.publicKey || !program) {
			console.error("Wallet not connected or program not initialized");
			return;
		}
		setBuyIsProcessing(true);
		try {
			const tokenMint = new PublicKey(token.mint); // Replace with actual token mint address

			const [bondingCurvePda] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), tokenMint.toBuffer()], PROGRAM_ID);
			const [globalPda] = PublicKey.findProgramAddressSync([Buffer.from("global")], PROGRAM_ID);
			const ai = await connection.getAccountInfo(tokenMint);
			const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey, true, ai?.owner || TOKEN_PROGRAM_ID);

            const bondingCurveTokenAccount = getAssociatedTokenAddressSync(
                tokenMint,
                bondingCurvePda,
                true,
				ai?.owner || TOKEN_PROGRAM_ID
            );

            const  amountLamports = new BN(parseFloat(amount) * 10 ** 9)
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
				const tokenAMint = new PublicKey(token.baseTokenMint);
				const tokenBMint = new PublicKey(token.quoteTokenMint);
				const isFront = true;

				const [mintA, mintB] = isFront ? [tokenAMint, tokenBMint] : [tokenBMint, tokenAMint];
				const aa = new BN(amountLamports.toString());
				const ab = new BN(0); // Assuming we're only depositing one token

				const configId = 0;
				const [ammConfigKey, _bump] = PublicKey.findProgramAddressSync([Buffer.from("amm_config"), new BN(configId).toArrayLike(Buffer, "be", 8)], CREATE_CPMM_POOL_PROGRAM);
				const poolKeys = getCreatePoolKeys({
					creator: wallet.publicKey,
					programId: CREATE_CPMM_POOL_PROGRAM,
					mintA,
					mintB,
					configId: ammConfigKey,
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
				
				if (quoteA && quoteB) {
				
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
				const anai = await connection.getAccountInfo(getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey));
				const someIxs: TransactionInstruction[] = [];
				if (!anai) {
					someIxs.push(createAssociatedTokenAccountInstruction(wallet.publicKey, getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey), wallet.publicKey, poolKeys.lpMint));
				}	

				const mintAiA = await connection.getAccountInfo(mintA);
				const mintBiB = await connection.getAccountInfo(mintB);
				const mintAiAata = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {mint: mintA});
				const mintBiBata = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {mint: mintB});
				let mostA = 0 ;
				let mostB = 0 ;
				let winnerA = mintAiAata.value[0];
				let winnerB = mintBiBata.value[0];
				mintAiAata.value.forEach((token: any) => {
					if (token.account.data.parsed.info.tokenAmount.uiAmount > mostA) {
						mostA = token.account.data.parsed.info.tokenAmount.uiAmount;
						winnerA = token;
					}
				});
				mintBiBata.value.forEach((token: any) => {
					if (token.account.data.parsed.info.tokenAmount.uiAmount > mostB) {
						mostB = token.account.data.parsed.info.tokenAmount.uiAmount;
						winnerB = token;
					}
				});
				let ix = makeDepositCpmmInInstruction(
					CREATE_CPMM_POOL_PROGRAM,
					wallet.publicKey,
					getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
					poolKeys.poolId,
					poolKeys.lpMint,
					winnerA.pubkey ,
					winnerB.pubkey ,
					poolKeys.vaultA,
					poolKeys.vaultB,
					mintA,
					mintB,
					poolKeys.lpMint,
                    (new BN(Math.sqrt(Number(initAmount0) * Number(initAmount1)))).div(new BN(2)),
					new BN(Number.MAX_SAFE_INTEGER),
					new BN(Number.MAX_SAFE_INTEGER),
					// @ts-ignore
					mintAiA.owner,
					// @ts-ignore
					mintBiB.owner
				);
				someIxs.push(ix);
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
					let addressLookupTableAccounts = [];
					let addressLookupTableAccountsB = [];
					if (addressLookupTableAddresses && addressLookupTableAddresses.length > 0) {	
					 addressLookupTableAccounts = await getAddressLookupTableAccounts(addressLookupTableAddresses);
					}
					if (addressLookupTableAddressesB && addressLookupTableAddressesB.length > 0) {
					 addressLookupTableAccountsB = await getAddressLookupTableAccounts(addressLookupTableAddressesB);
					}
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
						...(setupInstructions ? setupInstructions.map(deserializeInstruction) : []),
						...(setupInstructionsB ? setupInstructionsB.map(deserializeInstruction) : []),
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
				if (swapResultA && swapResultB) {
                const transactions = await processSwapResult(swapResultA, swapResultB, someIxs);
                if (!wallet.signAllTransactions) return;
				const signed = await wallet.signAllTransactions(transactions)
				console.log(signed)		
				const sig = await connection.sendRawTransaction(signed[0].serialize())
				console.log(sig)
				const awaited = await connection.confirmTransaction(sig, "processed")
				
				const sig2 = await connection.sendRawTransaction(signed[1].serialize())
				const awaited2 = await connection.confirmTransaction(sig2, "processed")
				const sig3 = await connection.sendRawTransaction(signed[2].serialize())
				const awaited3 = await connection.confirmTransaction(sig3, "processed")
				console.log(sig, awaited, sig2, awaited2, sig3, awaited3)
				}
				else {
					const someIxsTx = new Transaction()
					someIxsTx.add(...someIxs)
					if (!wallet.signTransaction) return 
					someIxsTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
					someIxsTx.feePayer = wallet.publicKey
					const sgined = await wallet.signTransaction(someIxsTx)
					const signature = await connection.sendRawTransaction(sgined.serialize())
					console.log('Transaction signature', signature);
					const awaited = await connection.confirmTransaction(signature, 'processed');
				}

			}
			else {
				console.log('no quotes - assuming both and b are bonding curves')
			// Handle bonding curve for both tokens
			const handleBondingCurve = async (tokenMint: PublicKey) => {
				const [bondingCurvePda] = PublicKey.findProgramAddressSync(
					[Buffer.from('bonding-curve'), tokenMint.toBuffer()],
					PROGRAM_ID
				);
				const ai = await connection.getAccountInfo(tokenMint);
				const userTokenAccount = getAssociatedTokenAddressSync(
					tokenMint,
					wallet.publicKey as PublicKey,
					true,
					ai?.owner || TOKEN_PROGRAM_ID
				);
				const bondingCurveTokenAccount = getAssociatedTokenAddressSync(
					tokenMint,
					bondingCurvePda,
					true,
					ai?.owner || TOKEN_PROGRAM_ID
				);
				const ammAcc = await connection.getAccountInfo(bondingCurvePda);
				const data = ammAcc?.data.slice(8);
				const amm = new LPAMM(
					data?.readBigUInt64LE(0) || BigInt(0),
					data?.readBigUInt64LE(8) || BigInt(0),
					data?.readBigUInt64LE(16) || BigInt(0),
					data?.readBigUInt64LE(24) || BigInt(0),
					data?.readBigUInt64LE(32) || BigInt(0)
				);
				const  amountLamports = new BN(parseFloat(amount) * 10 ** 9).div(new BN(2))
				const { tokenAmount } = amm.getBuyTokensWithSol(BigInt(amountLamports.toString()));
				
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
					tokenProgram: ai?.owner || TOKEN_PROGRAM_ID,
					sysvarRecentSlothashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
					hydra: new PublicKey('LkMTMqZR2maLzzy7GdYJmUnbE2j8jLyEHGbckYoFoMo'),
					program: PROGRAM_ID,
				})
				.instruction();
				
				return {ix, tokenAmount};
			};

			const tokenAMint = new PublicKey(token.baseTokenMint);
			const tokenBMint = new PublicKey(token.quoteTokenMint);
			const isFront = true;
			const [mintA, mintB] = isFront ? [tokenAMint, tokenBMint] : [tokenBMint, tokenAMint];

			const {ix: ixA, tokenAmount: initAmount0} = await handleBondingCurve(mintA);
			const {ix: ixB, tokenAmount: initAmount1} = await handleBondingCurve(mintB);

			const tx = new Transaction();
			tx.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 633333}));

			// Add create ATA instructions if necessary
			const addCreateAtaIx = async (mint: PublicKey) => {
				const ai = await connection.getAccountInfo(mint);
				const ata = getAssociatedTokenAddressSync(mint, wallet.publicKey as PublicKey, true, ai?.owner || TOKEN_PROGRAM_ID);
				const ataInfo = await connection.getAccountInfo(ata);
				if (!ataInfo) {
					tx.add(createAssociatedTokenAccountInstruction(
						wallet.publicKey as PublicKey,
						ata,
						wallet.publicKey as PublicKey,
						mint,
						ai?.owner || TOKEN_PROGRAM_ID
					));
				}
			};

			await addCreateAtaIx(mintA);
			await addCreateAtaIx(mintB);

			tx.add(ixA);
			tx.add(ixB);
			const anai = await connection.getAccountInfo(getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey));
			const someIxs: TransactionInstruction[] = [];
			if (!anai) {
				someIxs.push(
					createAssociatedTokenAccountInstruction(
						wallet.publicKey,
						getAssociatedTokenAddressSync(poolKeys.lpMint, wallet.publicKey),
						wallet.publicKey,
						poolKeys.lpMint
					)
				);
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
			// Fetch init amounts from the API
			let initAmount00 = BigInt(0);
			let initAmount11 = BigInt(0);
			try {
				const result = await getInitAmounts(BigInt(initAmount0), BigInt(initAmount1));
				console.log('Init amounts result:', result);

				initAmount00 = BigInt(result.token_0_amount);
				initAmount11 = BigInt(result.token_1_amount);

				console.log('Final init amounts:', { initAmount0: initAmount00.toString(), initAmount1: initAmount11.toString() });
				console.log('Iterations taken:', result.iterations);
			} catch (error) {
				console.error('Error getting init amounts:', error);
				throw new Error('Failed to calculate initial amounts');
			}

			const mintAiA = await connection.getAccountInfo(mintA);
			const mintBiB = await connection.getAccountInfo(mintB);

			let ix = makeDepositCpmmInInstruction(
				CREATE_CPMM_POOL_PROGRAM,
				wallet.publicKey,
				getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
				poolKeys.poolId,
				poolKeys.lpMint,
				getAssociatedTokenAddressSync(mintA, wallet.publicKey, true, mintAiA?.owner || TOKEN_PROGRAM_ID),
				getAssociatedTokenAddressSync(mintB, wallet.publicKey, true, mintBiB?.owner || TOKEN_PROGRAM_ID),
				poolKeys.vaultA,
				poolKeys.vaultB,
				mintA,
				mintB,
				poolKeys.lpMint,
				(new BN(Math.sqrt(Number(initAmount00) * Number(initAmount11)))).div(new BN(2)),
				new BN(Number.MAX_SAFE_INTEGER),
				new BN(Number.MAX_SAFE_INTEGER),
				// @ts-ignore
				mintAiA.owner,
				// @ts-ignore
				mintBiB.owner
			);
			someIxs.push(ix);

			tx.add(...someIxs);
			if (!wallet.signTransaction) return 
			tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
			tx.feePayer = wallet.publicKey
			const sgined = await wallet.signTransaction(tx);
			const signature = await connection.sendRawTransaction(sgined.serialize())
			console.log('Transaction signature', signature);
			const awaited = await connection.confirmTransaction(signature, 'processed');
			
			}
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
				tx.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 33333}))
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
				console.log("Transaction signature", signature);
				await connection.confirmTransaction(signature, "processed");
			}
        } catch (error) {
			
const baseToken = new PublicKey(token.baseTokenMint)
const quoteToken = new PublicKey(token.quoteTokenMint)
const ai2 = await connection.getAccountInfo(quoteToken)
const ai = await connection.getAccountInfo(baseToken)
const baseTokenAccount = getAssociatedTokenAddressSync(baseToken, wallet.publicKey, true, ai?.owner || TOKEN_PROGRAM_ID)
const quoteTokenAccount = getAssociatedTokenAddressSync(quoteToken, wallet.publicKey, true, ai2?.owner || TOKEN_PROGRAM_ID)
const baseTokenBalance = await connection.getTokenAccountBalance(baseTokenAccount)
const quoteTokenBalance = await connection.getTokenAccountBalance(quoteTokenAccount)

const configId = 0;
const [ammConfigKey, _bump] = PublicKey.findProgramAddressSync([Buffer.from("amm_config"), new BN(configId).toArrayLike(Buffer, "be", 8)], CREATE_CPMM_POOL_PROGRAM);
const poolKeys = getCreatePoolKeys({
	creator: wallet.publicKey,
	programId: CREATE_CPMM_POOL_PROGRAM,
	mintA: baseToken,
	mintB: quoteToken,
	configId: ammConfigKey,
});
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
	let state;
	try {
		const stateAccount = new PublicKey("AsCZr2YK8z3mesFqnCWrKAYn4kpRVMjbkW6HX5CFHkmc");
		const provider = new AnchorProvider(connection, aw, {});
		const program = new Program(burnIt as any, provider);

		// Fetch the state account
		// @ts-ignore
		 state = await program.account.state.fetch(stateAccount);

} catch (error) {
	console.error('Error fetching state:', error);
}
			// Fetch init amounts from the API
			let initAmount00 = BigInt(0);
			let initAmount11 = BigInt(0);
			try {
				const result = await getInitAmounts(BigInt(state? state.highestBurn.div(new BN(5000)) : 1_000_000_000), BigInt(state? state.highestBurn.div(new BN(5000)) : 1_000_000));
				console.log('Init amounts result:', result);

				initAmount00 = BigInt(result.token_0_amount);
				initAmount11 = BigInt(result.token_1_amount);

				console.log('Final init amounts:', { initAmount0: initAmount00.toString(), initAmount1: initAmount11.toString() });
				console.log('Iterations taken:', result.iterations);
			} catch (error) {
				console.error('Error getting init amounts:', error);
				throw new Error('Failed to calculate initial amounts');
			}

			const mintAiA = await connection.getAccountInfo(baseToken);
			const mintBiB = await connection.getAccountInfo(quoteToken);

			let ix = makeDepositCpmmInInstruction(
				CREATE_CPMM_POOL_PROGRAM,
				wallet.publicKey,
				getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
				poolKeys.poolId,
				poolKeys.lpMint,
				getAssociatedTokenAddressSync(baseToken, wallet.publicKey, true, mintAiA?.owner || TOKEN_PROGRAM_ID),
				getAssociatedTokenAddressSync(quoteToken, wallet.publicKey, true, mintBiB?.owner || TOKEN_PROGRAM_ID),
				poolKeys.vaultA,
				poolKeys.vaultB,
				baseToken,
				quoteToken,
				poolKeys.lpMint,
				token.mint === "BiEydESECDhjrw2cyKbGTaeAMp84ASfgWGyaq3DJ83Uq"? state.highestBurn.div(new BN(5000)) : (new BN(Math.sqrt(Number(initAmount00) * Number(initAmount11)))).div(new BN(2)),
				new BN(Number.MAX_SAFE_INTEGER),
				new BN(Number.MAX_SAFE_INTEGER),
				// @ts-ignore
				mintAiA.owner,
				// @ts-ignore
				mintBiB.owner
			);
			const tx = new Transaction()
			tx.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 33333}))
			tx.add(ix);
			const signature = await wallet.sendTransaction(tx, connection);
			
			console.log('Transaction signature', signature);
			const awaited = await connection.confirmTransaction(signature, 'processed');
			
        }
    };

	// Sell function
	const handleSell = async () => {
		if (!aw) return null;
		const provider = new AnchorProvider(connection, aw, {});
		const IDL = await Program.fetchIdl(new PublicKey("65YAWs68bmR2RpQrs2zyRNTum2NRrdWzUfUTew9kydN9"), provider);
		const program = new Program(IDL as any, provider);
		if (!wallet.publicKey || !program) {
			console.error("Wallet not connected or program not initialized");
			return;
		}
		setSellIsProcessing(true);
		try {
			const tokenMint = new PublicKey(token.mint);
			const PROGRAM_ID = new PublicKey(token.programId);
			const ai = await connection.getAccountInfo(tokenMint);
			const [bondingCurvePda] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), tokenMint.toBuffer()], PROGRAM_ID);
			const TOKEN_PROGRAM_ID_2022 = ai?.owner || TOKEN_PROGRAM_ID;
			const [globalPda] = PublicKey.findProgramAddressSync([Buffer.from("global")], PROGRAM_ID);

			const userTokenAccount = getAssociatedTokenAddressSync(tokenMint, wallet.publicKey, true, TOKEN_PROGRAM_ID_2022);

			const bondingCurveTokenAccount = getAssociatedTokenAddressSync(tokenMint, bondingCurvePda, true, TOKEN_PROGRAM_ID_2022);

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
                const isFront = true;
                
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

                // Perform withdraw instruction
                const withdrawIx = makeWithdrawCpmmInInstruction(
                    CREATE_CPMM_POOL_PROGRAM,
                    wallet.publicKey,
                    getPdaPoolAuthority(CREATE_CPMM_POOL_PROGRAM).publicKey,
                    poolKeys.poolId,
                    poolKeys.lpMint,
                    userBaseTokenAccount,
                    userQuoteTokenAccount,
                    poolKeys.vaultA,
                    poolKeys.vaultB,
                    mintA,
                    mintB,
                    poolKeys.lpMint,
                    new BN(sellAmountLamports.toString()),
                    new BN(0),
                    new BN(0),
					// @ts-ignore
					mintAiA.owner,
					// @ts-ignore
					mintBiB.owner
                );

                // Create and send transaction
                const withdrawTx = new Transaction()
				
				.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 33333}))
				.add(withdrawIx);
                const withdrawSignature = await wallet.sendTransaction(withdrawTx, connection);
                await connection.confirmTransaction(withdrawSignature, 'confirmed');

                // Fetch final token balances
                const finalBaseBalance = await connection.getTokenAccountBalance(userBaseTokenAccount);
                const finalQuoteBalance = await connection.getTokenAccountBalance(userQuoteTokenAccount);

                // Calculate the actual amounts of tokens withdrawn
                const baseTokenAmountWithdrawn = new BN(finalBaseBalance.value.amount).sub(new BN(initialBaseBalance.value.amount));
                const quoteTokenAmountWithdrawn = new BN(finalQuoteBalance.value.amount).sub(new BN(initialQuoteBalance.value.amount));

                // Fetch quotes for swapping both base and quote tokens to SOL
                const quoteBase = await jupiterApi.quoteGet({
                    inputMint: token.baseTokenMint,
                    outputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
                    amount: baseTokenAmountWithdrawn.toNumber(),
                    slippageBps: 1000, // 1% slippage
                });

                const quoteQuote = await jupiterApi.quoteGet({
                    inputMint: token.quoteTokenMint,
                    outputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
                    amount: quoteTokenAmountWithdrawn.toNumber(),
                    slippageBps: 1000, // 1% slippage
                });

                if (!quoteBase || !quoteQuote) {
                    throw new Error('Failed to fetch quotes for token swaps');
                }
                // Perform swaps
                const swapResultBase = await jupiterApi.swapPost({
                    swapRequest: {
                        userPublicKey: wallet.publicKey.toBase58(),
                        quoteResponse: quoteBase,
                        wrapAndUnwrapSol: true
                    },
                });
                const swapResultQuote = await jupiterApi.swapPost({
                    swapRequest: {
                        userPublicKey: wallet.publicKey.toBase58(),
                        quoteResponse: quoteQuote,
                        wrapAndUnwrapSol: true
                    },
                });
                // Deserialize the swap transactions
                const swapTransactionBase = Buffer.from(swapResultBase.swapTransaction, 'base64');
                const swapTransactionQuote = Buffer.from(swapResultQuote.swapTransaction, 'base64');
                
                var transactionBase = VersionedTransaction.deserialize(swapTransactionBase);
                var transactionQuote = VersionedTransaction.deserialize(swapTransactionQuote);
                
                console.log('Swap Transaction Base:', transactionBase);
                console.log('Swap Transaction Quote:', transactionQuote);
                if (!wallet.signAllTransactions) return 
                // Update baseTokenAmount and quoteTokenAmount with the expected output amounts
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

                let ix = makeWithdrawCpmmInInstruction(
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
                    new BN(sellAmountLamports.toString()),
                    baseTokenAmount,
                    quoteTokenAmount,
                    // @ts-ignore
                    (await connection.getAccountInfo(poolKeys.vaultA)).owner,
                    // @ts-ignore
                    (await connection.getAccountInfo(poolKeys.vaultB)).owner
                );
                someIxs.push(ix)
                // Create separate transactions for setup instructions
            
                const messageV0 = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
                    instructions: [
                        ...someIxs
                            ],
                }).compileToV0Message([]);
                const transaction = new VersionedTransaction(messageV0);

                const signed = await wallet.signAllTransactions([transactionBase, transactionQuote, transaction])
                for (const signedTx of signed) {
                    const txId = await connection.sendRawTransaction(signedTx.serialize());
                    console.log(`Transaction sent: ${txId}`);
                    await connection.confirmTransaction(txId, 'confirmed');
                    console.log(`Transaction ${txId} confirmed`);
                }

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
				.add(ComputeBudgetProgram.setComputeUnitPrice({microLamports: 33333})).
				add(ix);
                const signature = await wallet.sendTransaction(tx, connection);
                console.log('Transaction signature', signature);
                await connection.confirmTransaction(signature, 'processed');
            }
        } catch (error) {
            console.error('Error during sell:', error);
        }
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
			const publicKey = new PublicKey(token.mint)
			
			try {
				const balance = await connection.getBalance(publicKey);
				const calculatedProgress = (balance / 85* 10 ** 9) ;
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

    const [burnIsProcessing, setBurnIsProcessing] = useState(false);
	const [state, setState] = useState<any>(null);
	const [burnMemo, setBurnMemo] = useState("Burning for a good cause");
    useEffect(() => {
        const fetchState = async () => {
            if (!aw) return;

            try {
                const stateAccount = new PublicKey("AsCZr2YK8z3mesFqnCWrKAYn4kpRVMjbkW6HX5CFHkmc");
                const provider = new AnchorProvider(connection, aw, {});
                const program = new Program(burnIt as any, provider);

                // Fetch the state account
                // @ts-ignore
                const state = await program.account.state.fetch(stateAccount);

                setState(state);
                console.log(state);
            } catch (error) {
                console.error("Error fetching state:", error);
            }
        };

        fetchState();
        const intervalId = setInterval(fetchState, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [aw, connection]);
    const handleBurn = async () => {
        if (!aw || !wallet.publicKey) return;

        setBurnIsProcessing(true);
        try {
            const stateAccount = new PublicKey("AsCZr2YK8z3mesFqnCWrKAYn4kpRVMjbkW6HX5CFHkmc");
            const provider = new AnchorProvider(connection, aw, {});
            const program = new Program(burnIt as any, provider);

            // Fetch the state account
			// @ts-ignore
            const state = await program.account.state.fetch(stateAccount);

			setState(state)
            console.log(state);

            // Compute the amount to burn (double the current highestBurn)
            const highestBurn = state.highestBurn.div(new BN(5000));
            const amount = new BN(highestBurn.toString()).mul(new BN(2));

            // Prepare memo
            const memoBuffer = utf8.encode(burnMemo);
            const memoAsBufferWithPadding = new Uint8Array(128);
            memoAsBufferWithPadding.set(memoBuffer);

            // HSY_MINT_ADDRESS
            const HSY_MINT_ADDRESS = new PublicKey("BiEydESECDhjrw2cyKbGTaeAMp84ASfgWGyaq3DJ83Uq");

            const userTokenAccount = getAssociatedTokenAddressSync(HSY_MINT_ADDRESS, wallet.publicKey);

            const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

            // Derive PDAs
            const [nftMint, _mintBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("nft_mint"), wallet.publicKey.toBuffer(), stateAccount.toBuffer()],
                program.programId
            );

            const [nftMintAuthority, _authBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("nft_mint_authority"), stateAccount.toBuffer()],
                program.programId
            );

            const nftTokenAccount = getAssociatedTokenAddressSync(nftMint, state.winner);

            const [metadata, _metadataBump] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    nftMint.toBuffer(),
                ],
                METADATA_PROGRAM_ID
            );

            // Prepare instruction
			// @ts-ignore	
            const ix = await program.methods.burnTokens(amount, Array.from(memoAsBufferWithPadding))
                .accounts({
                    state: stateAccount,
                    tokenAccount: userTokenAccount,
                    mint: HSY_MINT_ADDRESS,
                    nftMint: nftMint,
                    nftMintAuthority: nftMintAuthority,
                    nftTokenAccount: nftTokenAccount,
                    metadata: metadata,
                    user: wallet.publicKey,
                    winner: state.winner,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    metadataProgram: METADATA_PROGRAM_ID,
                    rent: SYSVAR_RENT_PUBKEY,
                    systemProgram: SystemProgram.programId,
                    associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
                })
                .instruction();

            // Prepare transaction
            const tx = new Transaction().add(
                ComputeBudgetProgram.setComputeUnitPrice({microLamports: 333333}),
                ix
            );
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = wallet.publicKey;

            // Sign and send transaction
            if (!wallet.signTransaction) return;
            const signedTx = await wallet.signTransaction(tx);
            const txId = await connection.sendRawTransaction(signedTx.serialize());
            console.log("Tokens burned and NFT minted.", txId);
            await connection.confirmTransaction(txId, "processed");
        } catch (error) {
            console.error("Error during burn:", error);
        } finally {
            setBurnIsProcessing(false);
        }
    };
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
				{token.isBondingCurve && (
					<Card className="bg-transparent border border-white/10 p-2">
						<CardBody>
							<div className="leading-none -mt-1 pb-2 text-sm">
								Progress <span className="text-primary">{progress}%</span>
							</div>
							<Progress value={progress} size="md" />
						</CardBody>
					</Card>
				)}
				<div className="grid grid-cols-2 gap-2">
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Price</div>
							<span className="inter text-sm font-black leading-none">{(token.price / 10 ** 9).toFixed(9)} SOL</span>
						</CardBody>
					</Card>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="text-center">
							<div className="leading-none pb-1 text-md uppercase text-white/50">Market Cap</div>
							<span className="inter text-sm font-black leading-none">${(token.price / 10 ** 9) * 1_000_000_000 * solusdc}</span>
						</CardBody>
					</Card>
				</div>

				<div>
					<Card className="bg-transparent border border-white/10">
						<CardBody className="flex flex-col gap-2">
						{token.mint !== "BiEydESECDhjrw2cyKbGTaeAMp84ASfgWGyaq3DJ83Uq" && (	<div><AmountInput amount={amount} setAmount={setAmount} />

							<SlippageInput /></div>
						)}
							<div className="flex flex-col gap-2">
                {aw && aw.signAllTransactions != undefined && (
                    <>
                        <Button
                            color="primary"
                            className="w-full"
                            onClick={handleBuy}
                            isLoading={buyIsProcessing}
                            isDisabled={buyIsProcessing || sellIsProcessing || burnIsProcessing}
                        >
                            Buy
                        </Button>
                        <Button
                            color="secondary"
                            className="w-full"
                            onClick={handleSell}
                            isLoading={sellIsProcessing}
                            isDisabled={buyIsProcessing || sellIsProcessing || burnIsProcessing}
                        >
                            Sell
                        </Button>
                        {token.mint === "BiEydESECDhjrw2cyKbGTaeAMp84ASfgWGyaq3DJ83Uq" && (
							<div className="flex flex-col gap-2 items-center">
								{state && (
									<div className="text-sm text-center mb-2">
										<p>Tokens needed to beat current winner:</p>
										<p className="font-bold">{(state.highestBurn.div(new BN(5000)).toNumber() / 1e9).toFixed(9)}</p>
										<p>Current winner: {state.winner.toBase58().slice(0, 4)}...{state.winner.toBase58().slice(-4)}</p>
										<p className="italic">"{state.winnerMemo}"</p>
									</div>
								)}
								<Input
									type="text"
									placeholder="Memo"
									value={burnMemo}
									onChange={(e) => setBurnMemo(e.target.value)}
								/>
								<Button
									color="danger"
									className="w-full"
									onClick={handleBurn}
									isLoading={burnIsProcessing}
									isDisabled={buyIsProcessing || sellIsProcessing || burnIsProcessing}
								>
									Mega Burn
								</Button>
							</div>
                        )}
                    </>
                )}

                <span className="text-white/50 text-xs inter">
                    You will receive min <span className="text-white">614</span> @PEPPA
                </span>
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
