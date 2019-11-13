(function init() {
  interface ModuleDef {
    url?: string;
    deps?: string[];
    init?: (...deps) => any; // define(deps, init)
    ready?: Promise<any>; // = require(url)
    exports?: {}; // = init(...deps)
  }

  const modules = new Map<string, ModuleDef>();
  const modexps = {};
  window['mods'] = modexps;

  function log(...args) {
    console.debug('I [amd]', ...args);
  }

  function define(deps: string[], init: (...deps) => void) {
    if (!init) {
      init = deps as any;
      deps = [];
    }

    let script = getCurrentScript();
    let url = script.getAttribute('src')!;
    let mod = modules.get(url);
    if (!mod)
      throw new Error('mod=null: ' + url);
    if (mod.url)
      throw new Error('Module already defined: ' + url);
    mod.url = url;
    mod.deps = deps.map(dep => {
      if (!dep.startsWith('./')) return dep;
      let newdep = url.replace(/\/[^/]+$/, dep.slice(1));
      if (!newdep.endsWith('.js')) newdep += '.js';
      return newdep;
    });
    mod.init = init;
    log('define:', url, '<-', ...mod.deps);
  }

  function require(deps: string[], resolve?: (exports) => void, reject?): Promise<any> {
    if (deps.length != 1)
      throw new Error('require() expects 1 dep: ' + deps);

    let url = resolveScriptUrl(deps[0]);
    let mod = modules.get(url) || {};
    modules.set(url, mod);
    log('require:', url);

    mod.ready = mod.ready || downloadScript(url).then(() => {
      if (!mod.init)
        throw new Error('define() call missing: ' + url);
      mod.exports = {};
      modexps[url] = mod.exports;
      let pdeps = mod.deps!.map(dep => {
        switch (dep) {
          case 'require':
            return require;
          case 'exports':
            return mod.exports;
          default:
            return require([dep]);
        };
      });
      return Promise.all(pdeps).then(alldeps => {
        let init = mod.init!;
        mod.exports = init(...alldeps)
          || mod.exports;
        log('ready:', url);
      });
    });

    return mod.ready.then(() => {
      resolve && resolve(mod.exports);
      return mod.exports;
    }, err => {
      reject && reject(err);
      throw err;
    });
  }

  function downloadScript(url: string) {
    return new Promise<void>((resolve, reject) => {
      log('loading:', url);
      let script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => {
        log('loaded:', url);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('require() failed: ' + url));
      };
      document.head.appendChild(script);
    });
  }

  function getCurrentScript() {
    let script = document.currentScript as HTMLScriptElement;
    if (!script)
      throw new Error('document.currentScript is null');
    return script;
  }

  function resolveScriptUrl(dep: string) {
    return dep.startsWith('./') ?
      'bin' + dep.slice(1) + '.js' : dep;
  }

  window['define'] = define;
  define.amd = true;
  let cscript = getCurrentScript();
  let mainmod = cscript.getAttribute('data-main');
  if (mainmod) require([mainmod]);
})();
