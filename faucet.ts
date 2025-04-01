import { MultiAddress, wnd } from "@polkadot-api/descriptors";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { createClient } from "polkadot-api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { getWsProvider } from "polkadot-api/ws-provider/web";

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

  nonce = account.nonce;

  for (const v in awardedAccounts) {
    awardedAccounts[v] = false;
  }
};
console.log("Loading initial nonce");
await updateNonce();
let token: any = null;

const awardedAccounts: Record<string, boolean> = {};

console.log("Loaded, serving faucet");

Bun.serve({
  idleTimeout: 60,
  hostname: "0.0.0.0",
  routes: {
    "/": () =>
      new Response(faucetContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }),
    "/drip": async (req) => {
      const formData = await req.formData();

      const account = formData.get("address");

      console.log("received request", account);
      if (awardedAccounts[account]) return new Response("Already awarded :(");
      awardedAccounts[account] = true;
      const reqNonce = nonce++;
      if (token != null) {
        clearTimeout(token);
      }
      token = setTimeout(updateNonce, 60000);

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
          awardedAccounts[account] = false;
          console.error(result.dispatchError);
          return new Response("Transaction failed :(");
        } else {
          return new Response("Success! Enjoy your tokens!");
        }
      } catch (ex) {
        awardedAccounts[account] = false;
        console.error(ex);
        return new Response("Invalid tx: " + ex.message);
      }
    },
  },
});

const faucetContent = `<html>
<body style="padding: 1rem; font-family: monospace;">
<p style="font-size: 1.5rem;">💸🏦💰💵🤑💰💵🏦💸 Free WND for all PBA students 💸🏦💰💵🤑💰💵🏦💸</p>
<form method="POST" action="/drip">
<label>Address: <input name="address" /></label>
<input type="submit" />
</form>
</body>
</html>`;
