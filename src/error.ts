export class DerivedError extends Error {
  constructor(message: string, public innerError: Error) {
    super(message + '(' + innerError.message + ')');
  }
}
