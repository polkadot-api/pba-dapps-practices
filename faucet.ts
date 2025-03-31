import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { getPolkadotSigner } from "polkadot-api/signer";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { MultiAddress, wnd } from "@polkadot-api/descriptors";

const alice_mnemonic =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk";
const entropy = mnemonicToEntropy(alice_mnemonic);
const miniSecret = entropyToMiniSecret(entropy);
const derive = sr25519CreateDerive(miniSecret);
const alice = derive("//Alice");
const aliceSigner = getPolkadotSigner(alice.publicKey, "Sr25519", alice.sign);

const client = createClient(getWsProvider("ws://localhost:9944/"));
const api = client.getTypedApi(wnd);

let nonce = 0;
const updateNonce = async () => {
  const account = await api.query.System.Account.getValue(
    "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
  );

  nonce = Math.max(nonce, account.nonce);
};
console.log("Loading initial nonce");
await updateNonce();
setInterval(updateNonce, 12000);

const awardedAccounts: Record<string, boolean> = {};

console.log("Loaded, serving faucet");

Bun.serve({
  idleTimeout: 60,
  hostname: "0.0.0.0",
  routes: {
    "/:account": async (req) => {
      console.log("received request", req.params.account);
      const account = req.params.account;
      if (awardedAccounts[account]) return Response.json("Already awarded :(");
      awardedAccounts[account] = true;
      const reqNonce = nonce++;

      const tx = api.tx.Sudo.sudo({
        call: api.tx.Balances.force_set_balance({
          who: MultiAddress.Id(account),
          new_free: 100_000_000_000_000n,
        }).decodedCall,
      });

      try {
        const result = await tx.signAndSubmit(aliceSigner, {
          nonce: reqNonce,
        });
        if (!result.ok) {
          console.error(result.dispatchError);
          return Response.json("Transaction failed :(");
        } else {
          return Response.json("Success!");
        }
      } catch (ex) {
        console.error(ex);
        return Response.json("Invalid tx: " + ex.message);
      }
    },
  },
});
