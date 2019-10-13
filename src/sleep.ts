export default (dt: number) =>
  new Promise(resolve =>
    setTimeout(() => resolve(null), dt));
