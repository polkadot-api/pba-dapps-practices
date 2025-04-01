import { MultiAddress, wnd } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { chainSpec } from "polkadot-api/chains/westend2";
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from "polkadot-api/pjs-signer";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getProxySigner } from "./proxy-signer.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Grab first extension
const extensionId = getInjectedExtensions()[0];
const extension = await connectInjectedExtension(extensionId);

// Get the account based on name
const accounts = extension.getAccounts();
console.log(accounts);
const account = accounts.find((account) => account.name === "Signer name")!;

const smoldot = start({
  forbidWs: true,
});

// Connect to westend
const chain = await smoldot.addChain({
  chainSpec,
});
const provider = getSmProvider(chain);
const client = createClient(provider);
const typedApi = client.getTypedApi(wnd);

async function createPureProxy() {
  console.log("Creating proxy");

  const result = await typedApi.tx.Proxy.create_pure({
    proxy_type: {
      type: "Any",
      value: undefined,
    },
    delay: 0,
    index: 0,
  }).signAndSubmit(account.polkadotSigner);

  const pureCreated = typedApi.event.Proxy.PureCreated.filter(result.events);
  if (pureCreated.length) {
    console.log("Your proxy address is:", pureCreated[0].pure);
    localStorage.setItem("pure-addr", pureCreated[0].pure);
  } else {
    console.log("Transaction failed?", result);
  }
}

// Step 2: use faucet to add some tokens to your pure proxy.

async function transferBalanceFromProxy(address: string) {
  console.log("Grabbing balance from proxy");

  const result = await typedApi.tx.Balances.transfer_all({
    dest: MultiAddress.Id(account.address),
    keep_alive: true,
  }).signAndSubmit(getProxySigner(address, account.polkadotSigner));

  if (result.ok) {
    console.log(
      "Succeeded! You transfered the tokens from your proxy to your account"
    );
  } else {
    console.log("Transaction failed", result);
  }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.createPureProxy = createPureProxy;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.transferBalanceFromProxy = transferBalanceFromProxy;

console.log("To try your proxy signer:");
console.log("1. Create a proxy account with createPureProxy()");
console.log("2. Note down the resulting proxy address");
console.log(
  "3. Go to the faucet https://faucet.polkadot.io/ and give that address some tokens"
);
console.log(
  "4. Call transferBalanceFromProxy(…) passing in your proxy address"
);
