// One place for currency + percentage formatting so every screen agrees.

export function money(n: number | null | undefined, decimals = 2): string {
  const v = Number(n ?? 0);
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Same as money() but with an explicit +/- sign for P&L figures. */
export function signedMoney(n: number | null | undefined, decimals = 2): string {
  const v = Number(n ?? 0);
  return `${v >= 0 ? "+" : ""}${money(v, decimals)}`;
}

export function pct(n: number | null | undefined, decimals = 1): string {
  return `${Number(n ?? 0).toFixed(decimals)}%`;
}

export function signedPct(n: number | null | undefined, decimals = 1): string {
  const v = Number(n ?? 0);
  return `${v >= 0 ? "+" : ""}${v.toFixed(decimals)}%`;
}
