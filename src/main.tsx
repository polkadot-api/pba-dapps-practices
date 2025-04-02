import { dot } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { chainSpec } from "polkadot-api/chains/polkadot";
import { getSmProvider } from "polkadot-api/sm-provider";
import { start } from "polkadot-api/smoldot";
import { filter, map, switchMap } from "rxjs";

const smoldot = start();

const client = createClient(
  getSmProvider(
    smoldot.addChain({
      chainSpec,
    })
  )
);
const typedApi = client.getTypedApi(dot);

typedApi.query.Staking.CurrentEra.watchValue()
  .pipe(
    filter((v) => v != null),
    map((v) => v - 1),
    switchMap((prevEra) =>
      typedApi.query.Staking.ErasStakersOverview.watchEntries(prevEra)
    ),
    map((notification) => notification.entries)
  )
  .subscribe(console.log);
