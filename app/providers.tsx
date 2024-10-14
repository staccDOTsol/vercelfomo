"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
export interface ProvidersProps {
	children: React.ReactNode;
	themeProps?: ThemeProviderProps;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;
const persister = createSyncStoragePersister({ storage });

export function Providers({ children, themeProps }: ProvidersProps) {
	const router = useRouter();

	return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
			<NextUIProvider navigate={router.push}>
				<NextThemesProvider {...themeProps}>
					{children}
					<ReactQueryDevtools initialIsOpen={false} />
				</NextThemesProvider>
			</NextUIProvider>
		</PersistQueryClientProvider>
	);
}
