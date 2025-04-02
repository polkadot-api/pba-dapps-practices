import { aleph0 } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import {
  connectInjectedExtension,
  getInjectedExtensions,
} from "polkadot-api/pjs-signer";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ textAlign: "center" }}>Open the console :)</div>
  </StrictMode>
);

// Grab first extension
const extensionId = getInjectedExtensions()[0];
const extension = await connectInjectedExtension(extensionId);

// Get the account based on name
const accounts = extension.getAccounts();
console.log(accounts);
const account = accounts.find(
  (account) => account.name === "Your account name here"
)!;

const CONTRACT = "5GiZmrkEf8oPqtCjMcBPYA6odXHgTHF2FxkPNSzr3BWfAPqZ";
const provider = withPolkadotSdkCompat(
  getWsProvider({
    endpoints: [
      "wss://aleph-zero-testnet-rpc.dwellir.com",
      "wss://ws.test.azero.dev",
    ],
    timeout: 10_000,
  })
);
const client = createClient(provider);
const typedApi = client.getTypedApi(aleph0);
