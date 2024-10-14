'use client'

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { createJupiterApiClient } from "@jup-ag/api"
import { Card, CardHeader, CardBody, CardFooter, Button, Input } from "@nextui-org/react"
import { Icon } from "@iconify/react"
import { Connection, VersionedTransaction, PublicKey } from "@solana/web3.js"
import { debounce } from 'lodash-es';

const jupiterApi = createJupiterApiClient({ basePath: "https://superswap.fomo3d.fun" })

interface TokenInfo {
  address: string
  balance?: number
  symbol: string
  name: string
  decimals: number
  logoURI: string
}

export default function Component() {
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
  const [error, setError] = useState<string | null>(null)

  const endpoint = "https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW"
  const connection = useMemo(() => new Connection(endpoint), [])

  const fetchTokens = useCallback(async () => {
    if (!wallet.publicKey) return

    try {
      let allTokens: TokenInfo[] = []
      let page = 1
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const response = await fetch('https://mainnet.helius-rpc.com/?api-key=0d4b4fd6-c2fc-4f55-b615-a23bab1ffc85', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: `page-${page}`,
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: wallet.publicKey.toBase58(),
              page: page,
              limit: limit,
              displayOptions: { showFungible: true }
            },
          }),
        })

        const { result } = await response.json()
        
        if (result.items.length === 0) {
          hasMore = false
        } else {
          const pageTokens = result.items
            .filter((item: any) => item.interface === 'FungibleToken' || item.interface === 'FungibleAsset')
            .map((token: any) => {
              if (!token.content.links?.image) return null
              return {
                address: token.id,
                symbol: token.content.metadata?.symbol || '',
                name: token.content.metadata?.name || '',
                decimals: token.token_info?.decimals || 0,
                logoURI: token.content.links.image,
                balance: token.token_info?.balance || '0'
              }
            })

          allTokens = [...allTokens, ...pageTokens.filter(Boolean)]
          page++
        }
      }

      setTokens(allTokens)
    } catch (error) {
      console.error("Failed to fetch tokens:", error)
      setError("Failed to fetch tokens. Please try again.")
    }
  }, [wallet.publicKey])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  const inputToken = useMemo(() => tokens.find(t => t.address === formValue.inputMint) || customInputToken, [tokens, formValue.inputMint, customInputToken])
  const outputToken = useMemo(() => tokens.find(t => t.address === formValue.outputMint) || customOutputToken, [tokens, formValue.outputMint, customOutputToken])

  const fetchQuote = useCallback(async () => {
    if (!inputToken || !outputToken || !formValue.amount) return
    setIsLoading(true)
    setError(null)
    try {
      const amount = Math.floor(parseFloat(formValue.amount) * (10 ** inputToken.decimals)).toString()
      const quote = await jupiterApi.quoteGet({
        inputMint: formValue.inputMint,
        outputMint: formValue.outputMint,
        amount: Number(amount),
        slippageBps: Math.floor(formValue.slippage * 100),
      })
      setQuoteResponse(quote)
    } catch (error) {
      console.error("Failed to fetch quote:", error)
      setError("Failed to fetch quote. Please try again.")
    }
    setIsLoading(false)
  }, [formValue, inputToken, outputToken])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formValue.inputMint && formValue.outputMint && formValue.amount) {
        fetchQuote()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [formValue.amount, formValue.inputMint, formValue.outputMint, fetchQuote])

  const handleSwap = async () => {
    if (!quoteResponse || !wallet.publicKey || !wallet.signTransaction) return
    setIsLoading(true)
    setError(null)

    try {
      const swapResult = await jupiterApi.swapPost({
        swapRequest: {
          userPublicKey: wallet.publicKey.toBase58(),
          quoteResponse
        },
      })

      const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
      
      const signedTransaction = await wallet.signTransaction(transaction)
      
      const latestBlockhash = await connection.getLatestBlockhash()
      
      const rawTransaction = signedTransaction.serialize()
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
      })
      
      await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: txid
      })
      
      console.log(`Swap transaction successful: https://solscan.io/tx/${txid}`)
      // You might want to add some UI feedback here for successful swap
    } catch (error) {
      console.error("Swap failed:", error)
      setError("Swap failed. Please try again.")
    }
    setIsLoading(false)
  }

  const switchTokens = () => {
    setFormValue(prev => ({
      ...prev,
      inputMint: prev.outputMint,
      outputMint: prev.inputMint,
      amount: quoteResponse ? (parseFloat(quoteResponse.outAmount) / (10 ** (outputToken?.decimals || 0))).toFixed(6) : prev.amount
    }))
    setSearchInput("")
    setSearchOutput("")
    setCustomInputToken(customOutputToken)
    setCustomOutputToken(customInputToken)
    setQuoteResponse(null)
  }

  const formatBalance = (balance: string | undefined, decimals: number) => {
    if (!balance) return "0"
    const balanceNumber = parseInt(balance)
    return (balanceNumber / (10 ** decimals)).toFixed(6)
  }

  const handleSearchTokens = useCallback(
    async (searchValue: string, isInput: boolean) => {
      const searchFunc = isInput ? setSearchInput : setSearchOutput
      const openFunc = isInput ? setIsInputSelectOpen : setIsOutputSelectOpen
      searchFunc(searchValue)
      
      const debouncedSearch = debounce(async () => {
        if (searchValue.length >= 2) {
          if (!isInput) {
            try {
              const response = await fetch(`/api/token?search=${encodeURIComponent(searchValue)}`)
              if (!response.ok) {
                throw new Error('Failed to fetch tokens')
              }
              const filteredTokens = await response.json()
              setTokens(filteredTokens)
            } catch (error) {
              console.error('Error fetching tokens:', error)
              setError('Failed to fetch tokens. Please try again.')
            }
          } else {
            const filteredTokens = tokens.filter(token => 
              token.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
              token.name.toLowerCase().includes(searchValue.toLowerCase()) ||
              token.address.toLowerCase().includes(searchValue.toLowerCase())
            )
            setTokens(filteredTokens)
          }
          openFunc(true)
        } else {
          fetchTokens() // Reset to all tokens
          openFunc(false)
        }
      }, 300)

      debouncedSearch()
    },
    [tokens, fetchTokens, setSearchInput, setSearchOutput, setIsInputSelectOpen, setIsOutputSelectOpen, setTokens, setError]
  )

  const handleCustomTokenInput = async (searchValue: string, isInput: boolean) => {
    try {
      if (PublicKey.isOnCurve(searchValue)) {
        const tokenInfo = await connection.getParsedAccountInfo(new PublicKey(searchValue))
        if (tokenInfo.value?.data && 'parsed' in tokenInfo.value.data) {
          const parsedData = tokenInfo.value.data.parsed
          const customToken: TokenInfo = {
            address: searchValue,
            symbol: parsedData.info.symbol || 'Unknown',
            name: parsedData.info.name || 'Custom Token',
            decimals: parsedData.info.decimals || 0,
            logoURI: '/placeholder.svg', // Use a placeholder image
            balance: 0,
          }
          if (isInput) {
            setCustomInputToken(customToken)
            setFormValue(prev => ({ ...prev, inputMint: searchValue }))
          } else {
            setCustomOutputToken(customToken)
            setFormValue(prev => ({ ...prev, outputMint: searchValue }))
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch custom token info:", error)
      setError("Failed to fetch custom token info. Please try again.")
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-[450px] pb-3 bg-[#1c2033] shadow-none">
        <CardHeader className="flex justify-center">
          <h1 className="text-3xl font-bold text-center pt-2">SuperSwap</h1>
        </CardHeader>
        <CardBody className="pb-0">
          <div className="flex flex-col gap-1.5 items-center px-2">
            <Card className="bg-[#252a3f] border-0 shadow-none py-3 w-full">
              <CardBody>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      placeholder="Search input tokens or enter address..."
                      type="text"
                      size="sm"
                      value={searchInput}
                      onChange={(e) => {
                        handleSearchTokens(e.target.value, true)
                        handleCustomTokenInput(e.target.value, true)
                      }}
                      classNames={{
                        input: [
                          "bg-[#1c2033]",
                          "text-sm",
                          "placeholder:text-gray-400",
                        ],
                        inputWrapper: [
                          "bg-[#1c2033]",
                          "rounded-lg",
                        ],
                      }}
                    />
                    {isInputSelectOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-[#1c2033] rounded-lg shadow-lg max-h-60 overflow-auto">
                        {tokens.map((token) => (
                          <div 
                            key={token.address} 
                            className="flex items-center gap-2 p-2 hover:bg-[#252a3f] cursor-pointer"
                            onClick={() => {
                              setFormValue(prev => ({
                                ...prev,
                                inputMint: token.address,
                                outputMint: prev.outputMint || (tokens.find(t => t.address !== token.address)?.address || '')
                              }))
                              setSearchInput(token.symbol)
                              setIsInputSelectOpen(false)
                            }}
                          >
                            <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
                            <div className="flex flex-col">
                              <span>{token.symbol}</span>
                              <span className="text-small text-default-400">{token.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={formValue.amount}
                    onChange={(e) => {
                      setFormValue(prev => ({ ...prev, amount: e.target.value }))
                      setQuoteResponse(null)
                    }}
                    type="number"
                    size="lg"
                    classNames={{
                      input: [
                        "bg-[#1c2033]",
                        "text-2xl", 
                        "font-bold",
                      ],
                      inputWrapper: [
                        "bg-[#1c2033]",
                        "rounded-lg",
                      ],
                    }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Balance: {formatBalance(inputToken?.balance?.toString(), inputToken?.decimals || 0)} {inputToken?.symbol}
                </div>
              </CardBody>
            </Card>

            <Button onClick={switchTokens} isIconOnly className="w-10 h-10 -mt-6 -mb-6 z-10 bg-[#252a3f] border-[3px] border-[#1c2033]" aria-label="Swap">
              <Icon icon="mdi:swap-vertical" />
            </Button>

            <Card className="bg-[#252a3f] border-0 shadow-none py-3 w-full">
              <CardBody>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Input
                      placeholder="Search output tokens or enter address..."
                      type="text"
                      size="sm"
                      value={searchOutput}
                      onChange={(e) => {
                        handleSearchTokens(e.target.value, false)
                        handleCustomTokenInput(e.target.value, false)
                      }}
                      classNames={{
                        input: [
                          "bg-[#1c2033]",
                          "text-sm",
                          "placeholder:text-gray-400",
                        ],
                        inputWrapper: [
                          "bg-[#1c2033]",
                          "rounded-lg",
                        ],
                      }}
                    />
                    {isOutputSelectOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-[#1c2033] rounded-lg shadow-lg max-h-60 overflow-auto">
                        
                        {tokens.map((token) => (
                          <div 
                            key={token.address} 
                            className="flex items-center gap-2 p-2 hover:bg-[#252a3f] cursor-pointer"
                            onClick={() => {
                              setFormValue(prev => ({
                                ...prev,
                                outputMint: token.address,
                                inputMint: prev.inputMint || (tokens.find(t => t.address !== token.address)?.address || '')
                              }))
                              setSearchOutput(token.symbol)
                              setIsOutputSelectOpen(false)
                            }}
                          >
                            <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full" />
                            <div className="flex flex-col">
                              <span>{token.symbol}</span>
                              <span className="text-small text-default-400">{token.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={quoteResponse ? (quoteResponse.outAmount / (10 ** (outputToken?.decimals || 0))).toString() : ''}
                    readOnly
                    type="number"
                    size="lg"
                    classNames={{
                      input: [
                        "bg-[#1c2033]",
                        "text-2xl", 
                        "font-bold",
                      ],
                      inputWrapper: [
                        "bg-[#1c2033]",
                        "rounded-lg",
                      ],
                    }}
                  />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Balance: {formatBalance(outputToken?.balance?.toString(), outputToken?.decimals || 0)} {outputToken?.symbol}
                </div>
                {quoteResponse && (
                  <div className="mt-1 text-sm text-gray-400">
                    Rate: 1 {inputToken?.symbol} = {(Number(quoteResponse.outAmount) / Number(formValue.amount)).toFixed(6)} {outputToken?.symbol}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </CardBody>
        <CardFooter className="px-6 pt-4">
          <Button 
            onClick={handleSwap} 
            color="primary" 
            fullWidth 
            size="lg" 
            aria-label="Swap"
            disabled={isLoading || !quoteResponse}
          >
            {isLoading ? 'Loading...' : 'Swap'}
          </Button>
        </CardFooter>
        {error && (
          <div className="text-red-500 text-center mt-2">
            {error}
          </div>
        )}
      </Card>
    </div>
  )
}