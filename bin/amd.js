"use strict";
(function init() {
    const BASE_JS_DIR = '/bin';
    const modules = new Map();
    const modexps = {};
    window['mods'] = modexps;
    function log(...args) {
        console.debug('I [amd]', ...args);
    }
    const isAbsDep = (path) => path.startsWith('/') ||
        /^\w+:\/\//.test(path) || // http://...
        /^\w+$/.test(path); // 'require', 'exports'
    const isRelDep = (path) => path.startsWith('.');
    function resolveDep(scriptUrl, rel) {
        if (isAbsDep(rel))
            return rel;
        if (!isRelDep(rel)) {
            let path = BASE_JS_DIR + '/' + rel;
            if (!path.endsWith('.js'))
                path += '.js';
            return path;
        }
        let stack = scriptUrl.split('/');
        stack.pop();
        for (let name of rel.split('/')) {
            if (name == '.') {
                // no-op
            }
            else if (name == '..') {
                stack.pop();
            }
            else {
                stack.push(name);
            }
        }
        let path = stack.join('/');
        if (!path.endsWith('.js'))
            path += '.js';
        return path;
    }
    function define(deps, init) {
        if (!init) {
            init = deps;
            deps = [];
        }
        let script = getCurrentScript();
        let url = script.getAttribute('src');
        let mod = modules.get(url);
        if (!mod)
            throw new Error('mod=null: ' + url);
        if (mod.url)
            throw new Error('Module already defined: ' + url);
        mod.url = url;
        mod.deps = deps.map(rel => resolveDep(url, rel));
        mod.init = init;
        log('define:', url, '<-', ...mod.deps);
    }
    function require(deps, resolve, reject) {
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
            let pdeps = mod.deps.map(dep => {
                switch (dep) {
                    case 'require':
                        return require;
                    case 'exports':
                        return mod.exports;
                    default:
                        return require([dep]);
                }
                ;
            });
            return Promise.all(pdeps).then(alldeps => {
                let init = mod.init;
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
    function downloadScript(url) {
        return new Promise((resolve, reject) => {
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
        let script = document.currentScript;
        if (!script)
            throw new Error('document.currentScript is null');
        return script;
    }
    function resolveScriptUrl(dep) {
        if (dep.startsWith('./'))
            return BASE_JS_DIR + dep.slice(1) + '.js';
        if (/^\w+(\/|$)/.test(dep))
            return BASE_JS_DIR + '/' + dep + '.js';
        return dep;
    }
    window['define'] = define;
    define.amd = true;
    let cscript = getCurrentScript();
    let mainmod = cscript.getAttribute('data-main');
    if (mainmod)
        require([mainmod]);
})();
//# sourceMappingURL=amd.js.map