<h3 align="center">Adapted Ethers Wallet Adapter</h3>

### Installation

```
yarn add @reservoir0x/relay-ethers-wallet-adapter @reservoir0x/relay-sdk
```

Also make sure to install the peer dependencies required by the adapter if your application doesn't already include them:

```
yarn add ethers viem @reservoir0x/relay-sdk
```

### Usage

To use the adapter simply pass in your ethers signer and receive a normalized AdaptedWallet object:

```
import { getClient } from "@reservoir0x/relay-sdk";
import { adaptEthersSigner } from "@reservoir0x/relay-ethers-wallet-adapter";
import { useSigner } from "wagmi";

const { data: signer } = useSigner();
const wallet = adaptEthersSigner(signer);

getClient().actions.call({
  chainId: 7777777,
  toChainId: 8453,
  txs: [{ to: "0x30385bce01da4b415cae1db21d41e9f6eab3ba50", value: "1000000" }],
  wallet: wallet,
  onProgress: (steps) => {
    console.log(steps);
  },
});

```

In the code snippet above we use the wagmi `useSigner` method, which is not required, you can create your ethers signer however you wish. We then adapt the signer to the AdaptedWallet object and pass this into any of the SDK methods. Here we pass it into the call method along with the other required parameters.
