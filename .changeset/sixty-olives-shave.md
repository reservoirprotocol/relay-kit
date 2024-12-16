---
"@reservoir0x/relay-kit-ui": patch
---

Optimize usePrice hook by moving baseChainId validation to SwapWidgetRenderer and removing checkExternalLiquiditySupport prop. This improves performance by skipping invalid canonical routes based on baseChainId relationships.
