"use client";

import React from "react";
import { SwapWidget } from "@reservoir0x/relay-kit-ui";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof SwapWidget>;

export default function SwapWidgetWrapper(props: Props) {
  return <SwapWidget {...props} />;
}
