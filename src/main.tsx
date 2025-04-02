import { chainSpec } from "polkadot-api/chains/westend2";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// import { JsonRpcProvider } from "@polkadot-api/json-rpc-provider";
import { JsonRpcProvider } from "polkadot-api/ws-provider/web";

export function withLogsRecorder(
  persistLog: (msg: string) => void,
  // Provider wrapped
  provider: JsonRpcProvider
): JsonRpcProvider {
  return (onMessage) => {
    const connection = provider((msg) => {
      persistLog("<< " + msg);
      onMessage(msg);
    });

    return {
      disconnect() {
        connection.disconnect();
      },
      send(message) {
        persistLog(">> " + message);
        connection.send(message);
      },
    };
  };
}

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
