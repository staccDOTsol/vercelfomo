"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { createJupiterApiClient } from "@jup-ag/api"
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Select, SelectItem } from "@nextui-org/react";
import { Loader2, ArrowDownUp, Search, Scroll } from "lucide-react"
import { Connection, VersionedTransaction, PublicKey } from "@solana/web3.js"

const jupiterApi = createJupiterApiClient({ basePath: "https://superswap.fomo3d.fun" })

interface TokenInfo {
  address: string;
  balance?: number;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

export default function JupiterSwapForm() {
  const wallet = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [formValue, setFormValue] = useState({
    amount: "1",
    inputMint: "",
    outputMint: "",
    slippage: 0.5,
  })
  const [quoteResponse, setQuoteResponse] = useState<any>(null)
  const [searchInput, setSearchInput] = useState("")
  const [searchOutput, setSearchOutput] = useState("")
  const [isInputSelectOpen, setIsInputSelectOpen] = useState(false)
  const [isOutputSelectOpen, setIsOutputSelectOpen] = useState(false)
  const [customInputToken, setCustomInputToken] = useState<TokenInfo | null>(null)
  const [customOutputToken, setCustomOutputToken] = useState<TokenInfo | null>(null)

  useEffect(() => {
    const fetchTokens = async () => {
      if (!wallet.publicKey) return;

      try {
        let allTokens: TokenInfo[] = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        while (hasMore) {
          const response = await fetch('https://mainnet.helius-rpc.com/?api-key=0d4b4fd6-c2fc-4f55-b615-a23bab1ffc85', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: `page-${page}`,
              method: 'getAssetsByOwner',
              params: {
                ownerAddress: wallet.publicKey.toBase58(),
                page: page,
                limit: limit,
                displayOptions: {
                  showFungible: true
                }
              },
            }),
          });

          const { result } = await response.json();
          
          if (result.items.length === 0) {
            hasMore = false;
          } else {
            const pageTokens = result.items
              .filter((item: any) => item.interface === 'FungibleToken' || item.interface === 'FungibleAsset')
              .map((token: any) => {
                if (!token.content.links?.image) {
                  return null;
                }
                return {
                  address: token.id,
                  symbol: token.content.metadata?.symbol || '',
                  name: token.content.metadata?.name || '',
                  decimals: token.token_info?.decimals || 0,
                  logoURI: token.content.links.image,
                  balance: token.token_info?.balance || '0'
                };
              });

            allTokens = [...allTokens, ...pageTokens];
            
            if (page === 1 && pageTokens.length > 1) {
              setFormValue(prev => ({
                ...prev,
                inputMint: "So11111111111111111111111111111111111111112",
                outputMint: "BQpGv6LVWG1JRm1NdjerNSFdChMdAULJr3x9t2Swpump"
              }));
            }
            
            setTokens(allTokens.filter(token => token !== null));
            page++;
          }
        }

        setTokens(allTokens.filter(token => token !== null));
      } catch (error) {
        console.error("Failed to fetch tokens:", error);
      }
    };
    fetchTokens()
  }, [wallet, wallet.publicKey])

  const inputToken = useMemo(() => tokens.find(t => t.address === formValue.inputMint) || customInputToken, [tokens, formValue.inputMint, customInputToken])
  const outputToken = useMemo(() => tokens.find(t => t.address === formValue.outputMint) || customOutputToken, [tokens, formValue.outputMint, customOutputToken])
  const endpoint = "https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW"
  const connection = new Connection(endpoint)

  const fetchQuote = useCallback(async () => {
    if (!inputToken || !outputToken) return
    setIsLoading(true)
    try {
      const amount = (parseFloat(formValue.amount) * (10 ** inputToken.decimals)).toString()
      const quote = await jupiterApi.quoteGet({
        inputMint: formValue.inputMint,
        outputMint: formValue.outputMint,
        amount: Number(amount),
        slippageBps: formValue.slippage * 100,
      })
      setQuoteResponse(quote)
    } catch (error) {
      console.error("Failed to fetch quote:", error)
    }
    setIsLoading(false)
  }, [formValue, inputToken, outputToken])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formValue.inputMint && formValue.outputMint && formValue.amount) {
        fetchQuote()
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(debounceTimer)
  }, [formValue.amount, formValue.inputMint, formValue.outputMint, fetchQuote])

  const handleSwap = async () => {
    if (!quoteResponse || !wallet.publicKey || !wallet.signTransaction) return

    try {
      const swapResult = await jupiterApi.swapPost({
        swapRequest: {
        userPublicKey: wallet.publicKey.toBase58(),
        quoteResponse},
      })
      console.log("Swap transaction created:", swapResult)
      // Deserialize the transaction
      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
      const transaction = await wallet.signTransaction(VersionedTransaction.deserialize(swapTransactionBuf));
      
      
      // Get the latest blockhash
      const latestBlockhash = await connection.getLatestBlockhash();
      
      // Execute the transaction
      const rawTransaction = transaction.serialize()
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      });
      
      // Confirm the transaction
      await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: txid
      });
      
      console.log(`Swap transaction successful: https://solscan.io/tx/${txid}`);
    } catch (error) {
      console.error("Swap failed:", error)
    }
  }

  const switchTokens = () => {
    setFormValue(prev => ({
      ...prev,
      inputMint: prev.outputMint,
      outputMint: prev.inputMint,
      amount: quoteResponse ? (parseFloat(quoteResponse.outAmount) / (10 ** outputToken!.decimals)).toString() : prev.amount
    }))
    setSearchInput("")
    setSearchOutput("")
    setCustomInputToken(customOutputToken)
    setCustomOutputToken(customInputToken)
  }

  const formatBalance = (balance: number | undefined, decimals: number) => {
    if (balance === undefined) return "0"
    return (balance / (10 ** decimals)).toFixed(decimals)
  }

  const filteredInputTokens = useMemo(() => tokens.filter(token => 
    token.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
    token.name.toLowerCase().includes(searchInput.toLowerCase()) ||
    token.address.toLowerCase().includes(searchInput.toLowerCase())
  ), [tokens, searchInput])

  const filteredOutputTokens = useMemo(() => tokens.filter(token => 
    token.symbol.toLowerCase().includes(searchOutput.toLowerCase()) ||
    token.name.toLowerCase().includes(searchOutput.toLowerCase()) ||
    token.address.toLowerCase().includes(searchOutput.toLowerCase())
  ), [tokens, searchOutput])

  const handleCustomTokenInput = async (searchValue: string, isInput: boolean) => {
    try {
      if (PublicKey.isOnCurve(searchValue)) {
        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(searchValue));
        if (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) {
          const parsedData = tokenInfo.value.data.parsed;
          const customToken: TokenInfo = {
            address: searchValue,
            symbol: parsedData.info.symbol || 'Unknown',
            name: parsedData.info.name || 'Custom Token',
            decimals: parsedData.info.decimals || 0,
            logoURI: '', // You might want to use a default logo here
            balance: 0, // You might want to fetch the actual balance if needed
          };
          if (isInput) {
            setCustomInputToken(customToken);
            setFormValue(prev => ({ ...prev, inputMint: searchValue }));
          } else {
            setCustomOutputToken(customToken);
            setFormValue(prev => ({ ...prev, outputMint: searchValue }));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch custom token info:", error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800 text-white p-4">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">SuperSwap</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Input Token Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search input tokens or enter address..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                handleCustomTokenInput(e.target.value, true);
              }}
              className="flex-grow bg-gray-700"
            />
            <Button onClick={() => setIsInputSelectOpen(!isInputSelectOpen)} className="bg-gray-700">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {isInputSelectOpen && (
            <div className="max-h-[200px] overflow-y-auto border border-gray-600 rounded-md p-2">
              {filteredInputTokens.map((token) => (
                <Button
                  key={token.address}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setFormValue((prev) => ({ ...prev, inputMint: token.address }))
                    setIsInputSelectOpen(false)
                    setCustomInputToken(null)
                  }}
                >
                  <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 mr-2" />
                  <span>{token.symbol}</span>
                </Button>
              ))}
            </div>
          )}
          <Input
            type="number"
            placeholder="0.00"
            value={formValue.amount}
            onChange={(e) => setFormValue((prev) => ({ ...prev, amount: e.target.value }))}
            className="bg-gray-700"
          />
          {inputToken && (
            <div className="text-sm">
              Balance: {formatBalance(inputToken.balance, inputToken.decimals)} {inputToken.symbol}
            </div>
          )}
        </div>

        {/* Switch Button */}
        <div className="flex justify-center">
          <Button className="rounded-full bg-gray-700" onClick={switchTokens}>
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Output Token Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search output tokens or enter address..."
              value={searchOutput}
              onChange={(e) => {
                setSearchOutput(e.target.value);
                handleCustomTokenInput(e.target.value, false);
              }}
              className="flex-grow bg-gray-700"
            />
            <Button onClick={() => setIsOutputSelectOpen(!isOutputSelectOpen)} className="bg-gray-700">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {isOutputSelectOpen && (
            <div className="max-h-[200px] overflow-y-auto border border-gray-600 rounded-md p-2">
              {filteredOutputTokens.map((token) => (
                <Button
                  key={token.address}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setFormValue((prev) => ({ ...prev, outputMint: token.address }))
                    setIsOutputSelectOpen(false)
                    setCustomOutputToken(null)
                  }}
                >
                  <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 mr-2" />
                  <span>{token.symbol}</span>
                </Button>
              ))}
            </div>
          )}
          <Input
            type="number"
            placeholder="0.00"
            value={quoteResponse ? (parseFloat(quoteResponse.outAmount) / (10 ** outputToken!.decimals)).toFixed(outputToken!.decimals) : ""}
            readOnly
            className="bg-gray-700"
          />
          {outputToken && (
            <div className="text-sm">
              Balance: {formatBalance(outputToken.balance, outputToken.decimals)} {outputToken.symbol}
            </div>
          )}
        </div>

        {/* Rate Display */}
        {quoteResponse && inputToken && outputToken && (
          <div className="text-sm">
            Rate: 1 {inputToken.symbol} = 
            {(parseFloat(quoteResponse.outAmount) / (10 ** outputToken.decimals) / parseFloat(formValue.amount)).toFixed(6)} {outputToken.symbol}
          </div>
        )}
      </CardBody>
      <CardFooter>
        <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleSwap} disabled={isLoading || !quoteResponse}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Swap"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
