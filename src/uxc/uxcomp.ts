export default interface UXComp {
  render(...children: HTMLElement[]): HTMLElement;
  start?(): void;
}

export interface UXCompCtor {
  new(args): UXComp;
}

