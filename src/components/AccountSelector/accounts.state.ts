import { state, withDefault } from "@react-rxjs/core";
import { combineKeys } from "@react-rxjs/utils";
import {
  connectInjectedExtension,
  getInjectedExtensions,
  InjectedExtension,
  InjectedPolkadotAccount,
} from "polkadot-api/pjs-signer";
import {
  catchError,
  concat,
  defer,
  filter,
  interval,
  map,
  NEVER,
  Observable,
  of,
  retry,
  startWith,
  switchMap,
  take,
  tap,
  timer,
} from "rxjs";

const availableExtensions$ = state(
  concat(
    timer(0, 100).pipe(
      map(getInjectedExtensions),
      filter((v) => v.length > 0),
      take(1)
    ),
    interval(2000).pipe(map(getInjectedExtensions))
  ),
  []
);

const enum ConnectStatus {
  Connecting,
  Disconnected,
  Connected,
}

const getPreselectedExtensions = () => {
  try {
    const res = ["polkadot-js"]; // JSON.parse(localStorage.getItem(SELECTED_EXTENSIONS_KEY)!);
    if (Array.isArray(res)) return res;
    // eslint-disable-next-line no-empty
  } catch (_) {}
  return null;
};
const extensionIsPreselected = (extension: string) =>
  getPreselectedExtensions()?.includes(extension) ?? false;
const extension$ = (name: string) => {
  const connect$ = availableExtensions$.pipe(
    // Wait for the extension to be available
    filter((extensions) => extensions.includes(name)),
    take(1),
    switchMap(() =>
      defer(() => connectInjectedExtension(name)).pipe(
        // PolkadotJS rejects the promise straight away instead of waiting for user input
        retry({
          delay(error) {
            if (error?.message.includes("pending authorization request")) {
              return timer(1000);
            }
            throw error;
          },
        })
      )
    ),
    map((extension) => ({
      type: ConnectStatus.Connected as const,
      extension,
    })),
    catchError((e) => {
      console.error(e);
      return of({ type: ConnectStatus.Disconnected as const });
    }),
    startWith({ type: ConnectStatus.Connecting as const })
  );

  const connectWithCleanup$ = defer(() => {
    let disconnected = false;
    let extension: InjectedExtension | null = null;
    return concat(connect$, NEVER).pipe(
      tap({
        next(value) {
          if (value.type === ConnectStatus.Connected) {
            if (disconnected) {
              console.log("disconnect just after connecting");
              value.extension.disconnect();
            } else {
              extension = value.extension;
            }
          }
        },
        unsubscribe() {
          if (extension) {
            console.log("disconnect because of cleanup");
            extension.disconnect();
          } else {
            disconnected = true;
          }
        },
      })
    );
  });

  const initialSelected = extensionIsPreselected(name);
  return initialSelected
    ? connectWithCleanup$
    : of({
        type: ConnectStatus.Disconnected as const,
      });
};

export const extensionAccounts$ = state(
  (name: string) =>
    extension$(name).pipe(
      switchMap((x) => {
        if (x.type !== ConnectStatus.Connected) return of([]);
        return new Observable<InjectedPolkadotAccount[]>((observer) => {
          observer.next(x.extension.getAccounts());
          return x.extension.subscribe((accounts) => {
            observer.next(accounts);
          });
        });
      })
    ),
  []
);

export const accountsByExtension$ = state(
  combineKeys(availableExtensions$, extensionAccounts$),
  new Map<string, InjectedPolkadotAccount[]>()
);

export const allAccounts$ = accountsByExtension$.pipeState(
  map((accountsByExtension) =>
    [...accountsByExtension.entries()].flatMap(([extension, accounts]) =>
      accounts.map((account) => `${account.address}-${extension}`)
    )
  ),
  withDefault([] as string[])
);

const extensions$ = state(combineKeys(availableExtensions$, extension$));

export const selectedExtensions$ = extensions$.pipeState(
  map(
    (extensions) =>
      new Map(
        [...extensions.entries()]
          .filter(([, v]) => v.type !== ConnectStatus.Disconnected)
          .map(([k, v]) => [
            k,
            v.type === ConnectStatus.Connected ? v.extension : null,
          ])
      )
  ),
  withDefault(new Map<string, InjectedExtension | null>())
);
