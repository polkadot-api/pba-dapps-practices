import { Binary, createClient } from "polkadot-api";
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

import { aleph0, contracts, MultiAddress } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";

const typedApi = client.getTypedApi(aleph0);
const papiRaffleSdk = createInkSdk(typedApi, contracts.papi_raffle);
const papiRaffle = papiRaffleSdk.getContract(CONTRACT);

const papiRaffleStorage = papiRaffle.getStorage();

const storageResult = await papiRaffleStorage.getRoot();

console.log(storageResult);
if (!storageResult.success) {
  throw new Error("No root storage");
}
console.log(storageResult.value);

const guessResult = await storageResult.value.guesses(account.address);
if (guessResult.success && guessResult.value) {
  const [name, guess] = guessResult.value;
  console.log(name.asText(), guess);
} else {
  console.log("Not sent a guess yet");
}

const response = await papiRaffle.query("enter", {
  data: {
    name: Binary.fromText("Victor"),
    guess: 1,
  },
  origin: account.address,
  value: 1_000_000_000_000n,
});
console.log(response);

window.enterRaffle = () => {
  if (response.success) {
    papiRaffle
      .send("enter", {
        data: {
          name: Binary.fromText("Victor"),
          guess: 1,
        },
        value: 1_000_000_000_000n,
        gasLimit: response.value.gasRequired,
      })
      .signSubmitAndWatch(account.polkadotSigner)
      .subscribe(console.log);
  }
};

window.close = () => {
  papiRaffle
    .send("close", {
      origin: account.address,
    })
    .signSubmitAndWatch(account.polkadotSigner)
    .subscribe(console.log);
};

// const revealMessage = papiRaffle.message("reveal");
window.reveal = async (salt: number, value: number) => {
  console.log("Dry running");
  const response = await papiRaffle.query("reveal", {
    data: {
      salt,
      value,
    },
    origin: account.address,
  });

  if (response.success) {
    const winners = response.value.response.map(([address, name, guess]) => ({
      address,
      name: name.asText(),
      guess,
    }));
    console.log("winners are", winners);
    papiRaffle
      .send("reveal", {
        data: { salt, value },
        gasLimit: response.value.gasRequired,
      })
      .signSubmitAndWatch(account.polkadotSigner)
      .subscribe(console.log);
  } else {
    console.error(response);
  }
};
