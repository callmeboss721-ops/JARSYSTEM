export function calculateCarryPoints(
  previousRemainder: number,
  amount: number,
  unit = 100,
): { points: number; remainder: number } {
  if (
    !Number.isSafeInteger(previousRemainder) ||
    !Number.isSafeInteger(amount) ||
    !Number.isSafeInteger(unit) ||
    unit < 1 ||
    previousRemainder < 0 ||
    previousRemainder >= unit ||
    amount < 0
  ) {
    throw new RangeError("Invalid loyalty point accumulation values");
  }
  const total = previousRemainder + amount;
  return { points: Math.floor(total / unit), remainder: total % unit };
}
