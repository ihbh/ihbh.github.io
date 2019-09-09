type Getter<T> = () => T | Promise<T>;
type Setter<T> = (value: T) => void | Promise<void>;

interface Args<T> {
  get: Getter<T>;
  set?: Setter<T>;
  cache?: boolean;
}

export class AsyncProp<T> {
  private cache: boolean;
  private getter: Getter<T>;
  private setter: Setter<T>;
  private pget: Promise<T>;

  constructor(args: Getter<T> | Args<T>) {
    if (args instanceof Function)
      args = { get: args };
    this.getter = args.get;
    this.setter = args.set;
    this.cache = !!args.cache;
  }

  get(): Promise<T> {
    let get = this.getter;
    return this.cache && this.pget ||
      (this.pget = Promise.resolve(get()));
  }

  set(value: T): Promise<void> {
    let set = this.setter;
    if (!set)
      throw new Error('This is a read only prop.');
    return Promise.resolve(set(value));
  }

  modify(edit: (value: T) => T): Promise<void> {
    return this.get().then(edit).then(v => this.set(v));
  }
}
