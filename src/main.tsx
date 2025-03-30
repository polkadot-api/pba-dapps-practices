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

const smoldot = start();

const chain = await smoldot.addChain({
  chainSpec,
});

const provider = getSmProvider(chain);

// let id = 0;
// const connection = provider((msg) => {
//   const parsed = JSON.parse(msg);
//   console.log(parsed);

//   if (parsed.params?.result?.event === "stop") {
//     sendFollow();
//   }
// });

function correlate(provider: JsonRpcProvider) {
  let id = 0;

  let followId: string = "";
  const connection = provider((msgStr) => {
    const msg = JSON.parse(msgStr);

    if (msg.id === followRequestId) {
      followId = ""; // TODO
    }

    // TODO
  });

  const followRequestId = id++;
  connection.send(
    JSON.stringify({
      id: followRequestId,
      jsonrpc: "2.0",
      method: "chainHead_v1_follow",
      params: [true],
    })
  );

  return {
    getBody(hash: string): Promise<string[]> {
      connection.send(
        JSON.stringify({
          // TODO
        })
      );

      // TODO
    },
  };
}

const correlationExercise = correlate(provider);

const sendFollow = () => {
  console.log("send follow");
  connection.send(
    JSON.stringify({
      id: ++id,
      jsonrpc: "2.0",
      method: "chainHead_v1_follow",
      params: [false],
    })
  );
};
sendFollow();
