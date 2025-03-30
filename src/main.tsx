import { chainSpec } from "polkadot-api/chains/westend2";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JsonRpcProvider } from "@polkadot-api/json-rpc-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

const smoldot = start({
  forbidWs: true,
});

const chain = await smoldot.addChain({
  chainSpec,
});

const provider = getSmProvider(chain);

import { createClient } from "@polkadot-api/substrate-client";

const client = createClient(provider);

const chainHead = client.chainHead(
  true,
  async (evt) => {
    console.log("chainHead evt", evt);

    if (evt.type === "initialized") {
      const [block] = evt.finalizedBlockHashes;

      const metadata = await chainHead.call(block, "Metadata_metadata", "");
      console.log(metadata);

      chainHead.unpin(evt.finalizedBlockHashes);
    } else if (evt.type === "newBlock") {
      chainHead.unpin([evt.blockHash]);
    }
  },
  (err) => {
    console.log(err);
  }
);
