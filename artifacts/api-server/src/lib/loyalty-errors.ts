export class LoyaltyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
