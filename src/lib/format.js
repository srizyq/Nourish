// A number rounded to at most 1 decimal place, without trailing zeros or
// floating-point noise (e.g. summed 7.1 + 7.1 showing as 14.200000000000001)
// leaking into the UI.
export function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}
