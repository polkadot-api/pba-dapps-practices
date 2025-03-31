import { forwardRef, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import {
  formatValue,
  fractionalSeparator,
  thousandsSeparator,
} from "./token-formatter";

export const WND_TOKEN = {
  decimals: 12,
  symbol: "WND",
};
export const TokenInput = forwardRef<
  HTMLDivElement,
  {
    value?: bigint | null;
    onChange?: (value: bigint | null) => void;
    token: {
      symbol: string;
      decimals: number;
    };
    placeholder?: string;
    className?: string;
  }
>(({ value, placeholder, onChange, token, className }, outerRef) => {
  const ref = useRef<HTMLInputElement>(null as unknown as HTMLInputElement);

  useEffect(() => {
    if (value === undefined) return;

    const currentValue = parseValue(ref.current.value, token.decimals).value;
    if (value === currentValue) return;

    ref.current.value =
      value == null ? "" : formatValue(value, token.decimals, false);
  }, [value, token.decimals]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { value, cleaned, cursor } = parseValue(
      evt.target.value,
      token.decimals,
      evt.target.selectionStart ?? 0
    );
    evt.target.value = cleaned;
    evt.target.setSelectionRange(cursor, cursor);
    onChange?.(value);
  };

  const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.key.length > 1 || evt.ctrlKey || evt.metaKey) return;

    const singletonKeys = ["-", "+"];
    if (
      singletonKeys.some((v) => v === evt.key) &&
      evt.currentTarget.value.includes(evt.key)
    ) {
      evt.preventDefault();
    }
    if (evt.key === fractionalSeparator || evt.key === thousandsSeparator) {
      if (
        evt.currentTarget.value.includes(fractionalSeparator) ||
        evt.currentTarget.value.includes(thousandsSeparator)
      ) {
        evt.preventDefault();
      }
      return;
    }

    const cursor = evt.currentTarget.selectionStart ?? 0;
    if (cursor > 0 && (evt.key === "-" || evt.key === "+")) {
      evt.preventDefault();
      return;
    }

    if (!/[\d+-]/.test(evt.key)) {
      evt.preventDefault();
    }
  };

  return (
    <div
      ref={outerRef}
      className={twMerge(
        "flex overflow-hidden h-10 gap-2 py-1 px-2 border rounded-md items-center ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <input
        className="outline-none flex-1 flex-shrink block min-w-0"
        ref={ref}
        type="text"
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className="text-slate-600 flex-shrink-0">{token.symbol}</div>
    </div>
  );
});

function parseValue(
  strValue: string,
  decimals: number,
  cursor: number = 0
): { value: bigint | null; cleaned: string; cursor: number } {
  strValue = strValue.replaceAll(thousandsSeparator, fractionalSeparator);

  const parts = strValue.split(fractionalSeparator);
  if (parts.length > 2 || strValue === "") {
    return {
      value: null,
      cleaned: strValue,
      cursor,
    };
  }

  parts[1] = parts[1]?.slice(0, decimals);

  // eslint-disable-next-line prefer-const
  let [integer, fractional] = parts;

  if (
    !/^[+|-]?\d*$/.test(integer) ||
    (fractional && !/^\d*$/.test(fractional))
  ) {
    return {
      value: null,
      cleaned: strValue,
      cursor,
    };
  }
  const cleaned =
    integer + (fractional == null ? "" : fractionalSeparator + fractional);

  const firstChar = integer[0];
  const sign = firstChar === "-" ? -1n : 1n;
  if (firstChar === "+" || firstChar === "-") {
    integer = integer.slice(1);
  }

  const mod = 10n ** BigInt(decimals);
  const integerPart = BigInt(integer) * mod;
  const fractionalPart = BigInt((fractional ?? "").padEnd(decimals, "0"));

  return {
    value: sign * (integerPart + fractionalPart),
    cleaned,
    cursor,
  };
}
