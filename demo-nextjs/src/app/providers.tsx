"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import type { RelayChain } from "@reservoir0x/relay-sdk";
import type { RelayKitTheme, RelayKitProvider as RelayKitProviderType } from "@reservoir0x/relay-kit-ui";

const theme: RelayKitTheme = {
  font: 'Inter, -apple-system, Helvetica, sans-serif',
  primaryColor: '#6366f1',
  focusColor: '#4F46E5',
  subtleBackgroundColor: '#F9FAFB',
  subtleBorderColor: '#E5E7EB',
  text: {
    default: '#111827',
    subtle: '#6B7280',
    error: '#EF4444',
    success: '#10B981'
  },
  buttons: {
    primary: {
      background: '#6366f1',
      color: 'white',
      hover: {
        background: '#4F46E5',
        color: 'white'
      }
    },
    secondary: {
      background: '#F3F4F6',
      color: '#374151',
      hover: {
        background: '#E5E7EB',
        color: '#374151'
      }
    }
  },
  input: {
    background: '#F9FAFB',
    borderRadius: '0.5rem',
    color: '#111827'
  },
  widget: {
    background: 'white',
    borderRadius: '1rem',
    border: '1px solid #E5E7EB',
    boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
    card: {
      background: '#F9FAFB',
      borderRadius: '0.75rem',
      border: '1px solid #E5E7EB'
    },
    selector: {
      background: '#F3F4F6',
      hover: {
        background: '#E5E7EB'
      }
    }
  },
  modal: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '1rem'
  }
};

const chains: RelayChain[] = [
  {
    id: 1,
    name: "Ethereum",
    displayName: "Ethereum",
    vmType: "evm",
    currency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    id: 137,
    name: "Polygon",
    displayName: "Polygon",
    vmType: "evm",
    currency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  {
    id: 56,
    name: "BSC",
    displayName: "BSC",
    vmType: "evm",
    currency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
  {
    id: 792703809,
    name: "Solana",
    displayName: "Solana",
    vmType: "svm",
    currency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
  },
  {
    id: 8253038,
    name: "Bitcoin",
    displayName: "Bitcoin",
    vmType: "bvm",
    currency: {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
    },
  },
  {
    id: 728126428,
    name: "Tron",
    displayName: "Tron",
    vmType: "tvm",
    currency: {
      name: "Tron",
      symbol: "TRX",
      decimals: 6,
    },
  },
];

type DynamicProviderProps = {
  children: ReactNode;
  theme: RelayKitTheme;
  options: {
    chains: RelayChain[];
  };
};

const WrappedProvider: React.FC<DynamicProviderProps> = ({ children, theme, options }) => {
  const { RelayKitProvider } = require("@reservoir0x/relay-kit-ui") as {
    RelayKitProvider: React.ComponentType<DynamicProviderProps>;
  };
  return <RelayKitProvider theme={theme} options={options}>{children}</RelayKitProvider>;
};

const DynamicRelayKitProvider = dynamic<DynamicProviderProps>(() => Promise.resolve(WrappedProvider), {
  ssr: false,
});

export function Providers({ children }: { children: ReactNode }) {
  return <DynamicRelayKitProvider theme={theme} options={{ chains }}>{children}</DynamicRelayKitProvider>;
}
