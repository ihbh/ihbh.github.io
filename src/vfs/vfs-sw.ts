import { AsyncProp } from '../prop';
import HubFS from './hub-fs';

export default new HubFS({
  cache: new AsyncProp(async () => {
    let { default: JsonFS } = await import('json-fs');
    let pwa = await import('pwa');

    return new JsonFS({
      keys: async () => {
        let keys: string[] = await pwa.invoke('cache.keys');
        return keys.map(encodeURIComponent);
      },

      read: async key => {
        let url = decodeURIComponent(key);
        return pwa.invoke('cache.read', { url });
      },

      clear: async () => {
        await pwa.invoke('cache.clear');
      },

      path: key => {
        let url = decodeURIComponent(key);
        let i = url.indexOf('://');
        let j = url.indexOf('/', i < 0 ? 0 : i + 3);
        if (j < 0) return url;
        let schema = url.slice(0, i);
        let domain = url.slice(i + 3, j);
        let path = url.slice(j + 1);
        return '/' + [schema, domain, ...path.split('/')]
          .map(encodeURIComponent).join('/');
      },
    });
  }),
});
