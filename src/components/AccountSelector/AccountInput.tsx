import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getSs58AddressInfo,
  SS58String,
} from "@polkadot-api/substrate-bindings";
import { toHex } from "@polkadot-api/utils";
import { useStateObservable, withDefault } from "@react-rxjs/core";
import { Check, ChevronsUpDown } from "lucide-react";
import { FC, useState } from "react";
import { map } from "rxjs";
import { twMerge } from "tailwind-merge";
import { OnChainIdentity } from "./OnChainIdentity";
import { accountsByExtension$ } from "./accounts.state";

const hintedAccounts$ = accountsByExtension$.pipeState(
  map(
    (accountsByExtension) =>
      new Set(
        Array.from(accountsByExtension.values()).flatMap((accounts) =>
          accounts
            .map((acc) => ({
              name: acc.name,
              address: acc.address,
            }))
            .filter((acc) => !acc.address.startsWith("0x"))
        )
      )
  ),
  map((set) => [...set]),
  withDefault([])
);

const SS58Eq = (a: SS58String, b: SS58String) => {
  if (a === b) return true;
  const aInfo = getSs58AddressInfo(a);
  const bInfo = getSs58AddressInfo(b);
  return (
    aInfo.isValid &&
    bInfo.isValid &&
    toHex(aInfo.publicKey) === toHex(bInfo.publicKey)
  );
};

export const AccountInput: FC<{
  value: SS58String | null;
  onChange: (value: SS58String) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  const accounts = useStateObservable(hintedAccounts$);

  const [query, setQuery] = useState("");
  const queryInfo = getSs58AddressInfo(query);

  const [open, _setOpen] = useState(false);
  const setOpen = (value: boolean) => {
    _setOpen(value);
    setQuery("");
  };

  const hintedValue = value
    ? accounts.find((acc) => SS58Eq(acc.address, value))
    : null;
  const valueIsNew = hintedValue == null;
  if (value !== null) {
    accounts.sort((a, b) =>
      SS58Eq(a.address, value) ? -1 : SS58Eq(b.address, value) ? 1 : 0
    );
  }

  const onTriggerKeyDown = (evt: React.KeyboardEvent) => {
    if (evt.key.length === 1) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onKeyDown={onTriggerKeyDown}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={twMerge(
            "flex w-64 justify-between overflow-hidden px-2 border border-border bg-background",
            className
          )}
          forceSvgSize={false}
        >
          {value != null ? (
            <OnChainIdentity
              value={value}
              name={hintedValue?.name}
              className="overflow-hidden"
            />
          ) : (
            <span className="opacity-80">Select…</span>
          )}
          <ChevronsUpDown size={14} className="opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-46 p-0">
        <Command>
          <CommandInput
            placeholder="Filter or insert…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-foreground/50">
                The value is not a valid Account ID
              </div>
            </CommandEmpty>
            <CommandGroup>
              {valueIsNew && value && (
                <AccountOption
                  account={value}
                  selected={true}
                  onSelect={() => setOpen(false)}
                />
              )}
              {accounts.map((account) => (
                <AccountOption
                  key={account.address}
                  account={account.address}
                  name={account.name}
                  selected={value ? SS58Eq(value, account.address) : false}
                  onSelect={() => {
                    onChange(account.address);
                    setOpen(false);
                  }}
                />
              ))}
              {queryInfo.isValid && (
                <AccountOption
                  account={query}
                  selected={value === query}
                  onSelect={() => {
                    onChange(query);
                    setOpen(false);
                  }}
                />
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const AccountOption: FC<{
  account: string;
  selected: boolean;
  name?: string;
  onSelect: () => void;
}> = ({ account, name, selected, onSelect }) => (
  <CommandItem
    keywords={name ? [name] : undefined}
    value={account}
    onSelect={onSelect}
    className="flex flex-row items-center gap-2 p-1"
    forceSvgSize={false}
  >
    <OnChainIdentity
      value={account}
      name={name}
      className="overflow-hidden grow"
    />
    <Check
      size={12}
      className={twMerge("shrink-0", selected ? "opacity-100" : "opacity-0")}
    />
  </CommandItem>
);
