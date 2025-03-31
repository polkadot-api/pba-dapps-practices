import { combineLatest, map, OperatorFunction } from "rxjs";

export interface FormatOptions {
  decimals: number;
  symbol: string;
}

export const fractionalSeparator = (0.1).toLocaleString().substring(1, 2);
export const thousandsSeparator = (1000).toLocaleString().substring(1, 2);
export function formatValue(
  value: bigint,
  decimals: number,
  withThousands = true
) {
  if (!decimals) return value.toLocaleString();

  const mod = 10n ** BigInt(decimals);
  const integerPart = value / mod;
  const fractionalPart = value % mod;

  return (
    (withThousands ? integerPart.toLocaleString() : integerPart.toString()) +
    (fractionalPart
      ? fractionalSeparator +
        fractionalPart
          .toString()
          .padStart(decimals, "0")
          .replaceAll("0", " ")
          .trimEnd()
          .replaceAll(" ", "0")
      : "")
  );
}
export function format(value: bigint, formatOptions: FormatOptions) {
  const suffix = formatOptions.symbol ? ` ${formatOptions.symbol}` : "";
  return formatValue(value, formatOptions.decimals) + suffix;
}

export function getChainFormatOptions(chainSpec: string): FormatOptions {
  const parsed = JSON.parse(chainSpec);
  const properties = parsed.properties;
  return {
    decimals: properties?.tokenDecimals ?? 0,
    symbol: properties?.tokenSymbol ?? null,
  };
}

export function withTokenFormatter<T>(
  chainSpec: Promise<{ chainSpec: string }>
): OperatorFunction<T, [T, (value: bigint) => string]> {
  const formatter = chainSpec.then(({ chainSpec }) => {
    const options = getChainFormatOptions(chainSpec);
    return (value: bigint) => format(value, options);
  });
  return (source$) => combineLatest([source$, formatter]);
}

export function formatToken(
  chainSpec: Promise<{ chainSpec: string }>
): OperatorFunction<bigint, string> {
  return (source$) =>
    source$.pipe(
      withTokenFormatter(chainSpec),
      map(([v, format]) => format(v))
    );
}
