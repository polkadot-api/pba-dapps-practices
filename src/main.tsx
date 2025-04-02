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
import { getInkClient } from "polkadot-api/ink";

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
const account = accounts.find((account) => account.name === "PBA Oliva")!;

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

import { aleph0, contracts } from "@polkadot-api/descriptors";

const typedApi = client.getTypedApi(aleph0);
const papiRaffle = getInkClient(contracts.papi_raffle);

const storageRootCodec = papiRaffle.storage();

const storageResult = await typedApi.apis.ContractsApi.get_storage(
  CONTRACT,
  storageRootCodec.encode()
);

console.log(storageResult);
if (storageResult.success) {
  console.log(storageRootCodec.decode(storageResult.value!));
}
