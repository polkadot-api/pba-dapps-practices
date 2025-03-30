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
  const bodyRequests = new Map<number, (value: string[]) => void>();
  const ongoingRequests = new Map<string, (value: string[]) => void>();

  const connection = provider((msgStr) => {
    const msg = JSON.parse(msgStr);

    if (
      msg.params?.result?.event === "initialized" ||
      msg.params?.result?.event === "newBlock"
    ) {
      console.log(msg.params.result);
    }

    if (msg.id === followRequestId) {
      console.log(msg);
      followId = msg.result;
    } else if (bodyRequests.has(msg.id)) {
      if (msg.result.result != "started") {
        console.log(msg);
        throw new Error("Something went wrong");
      }

      const resolve = bodyRequests.get(msg.id)!;
      bodyRequests.delete(msg.id);
      ongoingRequests.set(msg.result.operationId, resolve);
    } else {
      const operationId = msg.params?.result?.operationId;

      if (operationId && ongoingRequests.has(operationId)) {
        const resolve = ongoingRequests.get(operationId)!;
        ongoingRequests.delete(operationId);
        resolve(msg.params.result.value);
      }
    }
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
      const bodyReqId = id++;

      connection.send(
        JSON.stringify({
          jsonrpc: "2.0",
          id: bodyReqId,
          method: "chainHead_v1_body",
          params: [followId, hash],
        })
      );

      return new Promise<string[]>((resolve) => {
        bodyRequests.set(bodyReqId, resolve);
      });
    },
  };
}

const correlationExercise = correlate(provider);

window.correlationExercise = correlationExercise;

// const result = await correlationExercise.getBody("0x0123485874");

// const sendFollow = () => {
//   console.log("send follow");
//   connection.send(
//     JSON.stringify({
//       id: ++id,
//       jsonrpc: "2.0",
//       method: "chainHead_v1_follow",
//       params: [false],
//     })
//   );
// };
// sendFollow();
