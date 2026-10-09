export const GUEST_DEMO_TRANSACTION_LIMIT = 3;

export class DemoTransactionLimitError extends Error {
  constructor() {
    super('Guest demo transaction limit reached.');
    this.name = 'DemoTransactionLimitError';
  }
}
