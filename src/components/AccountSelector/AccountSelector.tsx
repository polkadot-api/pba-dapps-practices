import { useStateObservable } from "@react-rxjs/core";
import { InjectedExtension } from "polkadot-api/pjs-signer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  allAccounts$,
  extensionAccounts$,
  selectedExtensions$,
} from "./accounts.state";
import { OnChainIdentity } from "./OnChainIdentity";

export const AccountPicker: React.FC<{
  value: string | null;
  onChange: (value: string) => void;
}> = ({ value, onChange: selectValue }) => {
  const extensions = useStateObservable(selectedExtensions$);
  const allAccounts = useStateObservable(allAccounts$);

  const activeExtensions = [...extensions.values()].filter((v) => !!v);
  const valueExists = value && allAccounts.includes(value);

  if (!activeExtensions.length) return null;

  return (
    <Select value={valueExists ? value ?? "" : ""} onValueChange={selectValue}>
      <SelectTrigger className="h-auto border-foreground/30">
        <SelectValue placeholder="Select an account" />
      </SelectTrigger>
      <SelectContent>
        {activeExtensions.map((extension) => (
          <Accounts key={extension.name} extension={extension} />
        ))}
      </SelectContent>
    </Select>
  );
};

const Accounts: React.FC<{ extension: InjectedExtension }> = ({
  extension,
}) => {
  const accounts = useStateObservable(extensionAccounts$(extension.name));

  return (
    <SelectGroup>
      <SelectLabel>{extension.name}</SelectLabel>
      {accounts.map((account) => (
        <SelectItem
          key={account.address}
          value={account.address + "-" + extension.name}
        >
          <OnChainIdentity value={account.address} name={account.name} />
        </SelectItem>
      ))}
    </SelectGroup>
  );
};
