"use client";

import React from "react";
import { RelayKitProvider } from "@reservoir0x/relay-kit-ui";
import type { ReactNode } from "react";
import type { RelayChain } from "@reservoir0x/relay-sdk";
import type { ComponentProps } from "react";

type Props = {
  children: ReactNode;
  theme: ComponentProps<typeof RelayKitProvider>["theme"];
  chains: RelayChain[];
};

export default function RelayKitProviderWrapper({ children, theme, chains }: Props) {
  return (
    <RelayKitProvider theme={theme} options={{ chains }}>
      {children}
    </RelayKitProvider>
  );
}
