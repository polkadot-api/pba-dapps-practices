import { MultiAddress, wnd } from "@polkadot-api/descriptors";
import { Binary, createClient, SS58String, TxEvent } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/web";
import { FC, FormEvent, useEffect, useState } from "react";
import { firstValueFrom } from "rxjs";
import "./App.css";
import { AccountInput } from "./components/AccountSelector/AccountInput";
import { accountsByExtension$ } from "./components/AccountSelector/accounts.state";
import { AccountPicker } from "./components/AccountSelector/AccountSelector";
import { TokenInput, WND_TOKEN } from "./components/TokenInput";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

// TODO
const URL = "wss://rpc.ibp.network/westend";

const client = createClient(getWsProvider(URL));
const typedApi = client.getTypedApi(wnd);

function App() {
  const [from, setFrom] = useState<SS58String | null>(null);
  const [to, setTo] = useState<SS58String | null>(null);
  const [amount, setAmount] = useState<bigint | null>(null);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<null | "sending" | TxEvent>(
    null
  );

  const [commentEnabled, setCommentEnabled] = useState(false);
  useEffect(() => {
    const subscription = client.finalizedBlock$.subscribe(async () => {
      // TODO
      setCommentEnabled(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (evt: FormEvent) => {
    evt.preventDefault();

    if (!from || !to || !amount) return;
    const extensionAccounts = await firstValueFrom(accountsByExtension$);
    const addr = from.split("-")[0];
    const extensionAccount = Array.from(extensionAccounts.values())
      .flat()
      .find((acc) => acc.address === addr)!;
    if (!extensionAccount) {
      alert("account not found!");
      return;
    }

    // TODO
    const tx = typedApi.tx.Balances.transfer_keep_alive({
      dest: MultiAddress.Id(to),
      value: amount,
    });

    setSubmitState("sending");
    tx.signSubmitAndWatch(extensionAccount.polkadotSigner).subscribe({
      next: (r) => setSubmitState(r),
      error: (e) => {
        alert("Error! " + e.message);
        setSubmitState(null);
        console.error(e);
      },
    });
  };

  return (
    <>
      <div className="mb-2 border-b p-2 relative">
        <h1 className="text-2xl">✨ My transfers dApp ✨</h1>
        <FinalizedBlock />
      </div>
      <form
        className="flex flex-col gap-2 shadow rounded p-2 m-auto w-auto mt-2 items-start"
        onSubmit={onSubmit}
      >
        <Label>
          From
          <AccountPicker value={from} onChange={setFrom} />
        </Label>
        <Label>
          To
          <AccountInput value={to} onChange={setTo} />
        </Label>
        <Label>
          Amount
          <TokenInput token={WND_TOKEN} value={amount} onChange={setAmount} />
        </Label>
        {commentEnabled ? (
          <Label className="w-full">
            Comment
            <Textarea
              className="w-full"
              value={comment}
              onChange={(evt) => setComment(evt.target.value)}
            />
          </Label>
        ) : null}
        <Button
          disabled={
            !!submitState &&
            submitState !== "sending" &&
            submitState.type !== "finalized"
          }
        >
          Send it!
        </Button>
        {submitState && submitState !== "sending" ? (
          <SubmitState value={submitState} />
        ) : null}
      </form>
    </>
  );
}

export default App;

const SubmitState: FC<{
  value: TxEvent;
}> = ({ value }) => {
  if (value.type === "broadcasted") {
    return <div>Broadcasting…</div>;
  }
  const content = ((value.type === "txBestBlocksState" && value.found) ||
    value.type === "finalized") && (
    <Textarea className="font-mono" readOnly>
      {JSONPrint(value.ok ? value.events : value.dispatchError)}
    </Textarea>
  );
  if (value.type === "txBestBlocksState" && value.found) {
    return (
      <div>
        Included in a block!
        {content}
      </div>
    );
  }
  if (value.type === "finalized") {
    return value.ok ? (
      <div>Success! {content}</div>
    ) : (
      <div>Error {content}</div>
    );
  }

  return null;
};

const FinalizedBlock = () => {
  const [finalized, setFinalized] = useState<null | number>(null);

  useEffect(() => {
    const sub = client.finalizedBlock$.subscribe((v) => setFinalized(v.number));
    return () => sub.unsubscribe();
  }, []);

  return (
    <div className="absolute bottom-2 right-2">
      #{finalized?.toLocaleString()}
    </div>
  );
};

const JSONPrint = (v: unknown) =>
  JSON.stringify(
    v,
    (_, v) =>
      typeof v === "bigint"
        ? `${v}n`
        : v instanceof Binary
        ? bytesToString(v)
        : v,
    2
  );

const textDecoder = new TextDecoder("utf-8", { fatal: true });
const bytesToString = (value: Binary) => {
  try {
    const bytes = value.asBytes();
    if (bytes.slice(0, 5).every((b) => b < 32)) throw null;
    return textDecoder.decode(bytes);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return value.asHex();
  }
};
