export class AsyncProp<T> {
  private result: Promise<T>;

  constructor(private getter: () => Promise<T>) {
    
  }

  get(): Promise<T> {
    return this.result ||
      (this.result = this.getter.call(null));
  }
}
