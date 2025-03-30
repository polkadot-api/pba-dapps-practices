import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { wnd } from "@polkadot-api/descriptors";
import { Binary, createClient } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { chainSpec } from "polkadot-api/chains/westend2";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

const smoldot = start();

const chain = await smoldot.addChain({
  chainSpec,
});

const provider = getSmProvider(chain);

const client = createClient(provider);

const typedApi = client.getTypedApi(wnd);

const token = await typedApi.compatibilityToken;

// const account = await typedApi.query.System.Account.getValue(
//   "5FxrUu1PUugUYs6HQ83bDswjGLyHYTEzm7yqmrkKVPaYe71Y"
// );

console.log(typedApi.constants.System.SS58Prefix(token));

const tx = typedApi.tx.System.remark({
  remark: Binary.fromText("Hello PBA"),
});

const result = await typedApi.apis.TransactionPaymentCallApi.query_call_info(
  tx.decodedCall,
  0
);

console.log(result);

// => Find how much balance does the account holding the sudo key have.
const sudo = await typedApi.query.Sudo.Key.getValue();
if (!sudo) {
  throw new Error("...");
}

const account = await typedApi.query.System.Account.getValue(sudo);
console.log("result", account.data.free);
// 99908924629323728n

// => Find all the Proxy(any) accounts
const proxyEntries = await typedApi.query.Proxy.Proxies.getEntries();
const anyProxies = proxyEntries
  .filter((entry) => entry.value[0].some((v) => v.proxy_type.type === "Any"))
  .map((entry) => entry.keyArgs[0]);
console.log("proxy(any) accounts", anyProxies);

// Interpreted the other way
// const anyProxies = proxyEntries.flatMap((entry) =>
//   entry.value[0]
//     .filter((v) => v.proxy_type.type === "Any")
//     .map((v) => v.delegate)
// );
// const anyProxiesUnique = new Set(anyProxies);

// => Find out if some account has configured the maximum amount of proxy delegates.
const maxProxies = await typedApi.constants.Proxy.MaxProxies();

const thridResult = proxyEntries.some(
  (entry) => entry.value[0].length >= maxProxies
);
console.log("third result", thridResult);
