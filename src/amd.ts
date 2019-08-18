(function init() {
  interface ModuleDef {
    url?: string;
    deps?: string[];
    init?: (...deps) => any;
    loaded?: Promise<void>;
    exports?: {};
  }

  const modules = new Map<string, ModuleDef>();

  function define(deps: string[], init: (...deps) => void) {
    if (!init) {
      init = deps as any;
      deps = [];
    }

    let script = getCurrentScript();
    let url = script.getAttribute('src');
    let mod = modules.get(url);
    if (mod && mod.url)
      throw new Error('Module already defined: ' + url);
    mod.url = url;
    mod.deps = deps;
    mod.init = init;
    log('define:', url, '->', ...deps);
  }

  function require(deps: string[], resolve?: (exports) => void, reject?) {
    return Promise.resolve().then(() => {
      if (deps.length != 1)
        throw new Error('require() expects 1 dep: ' + deps);
      let url = resolveScriptUrl(deps[0]);
      let mod = modules.get(url) || {};
      modules.set(url, mod);
      if (mod.exports)
        return mod.exports;
      if (!mod.loaded)
        mod.loaded = downloadScript(url);
      return mod.loaded.then(() => {
        if (!mod.init)
          throw new Error('define() call missing: ' + url);
        mod.exports = {};
        let tasks = mod.deps.map(dep => {
          switch (dep) {
            case 'require':
              return require;
            case 'exports':
              return mod.exports;
            default:
              log('require:', url, '->', dep);
              return require([dep]);
          };
        });
        return Promise.all(tasks).then(modexps => {
          mod.exports = mod.init.apply(null, modexps)
            || mod.exports;
          return mod.exports;
        });
      });
    }).then(res => {
      resolve && resolve(res);
      return res;
    }, err => {
      reject && reject(err);
      throw err;
    });
  }

  function downloadScript(url: string) {
    return new Promise<void>((resolve, reject) => {
      log('load:', url);
      let script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('require() failed: ' + url));
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

  function log(...args) {
    console.log('[amd] I', ...args);
  }

  window['define'] = define;
  define.amd = true;
  let cscript = getCurrentScript();
  let mainmod = cscript.getAttribute('data-main');
  if (mainmod) require([mainmod]);
})();
