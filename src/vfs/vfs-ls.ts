import JsonFS from './json-fs';

export default new JsonFS({
  keys: async () => Object.keys(localStorage),
  read: async key => JSON.parse(localStorage.getItem(key) || 'null'),
  write: async (key, data) => localStorage.setItem(key, JSON.stringify(data)),
  clear: async () => localStorage.clear(),
  remove: async key => localStorage.removeItem(key),
});
