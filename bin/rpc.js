define(["require", "exports", "./config", "./log", "./qargs", "./prop"], function (require, exports, config, log_1, qargs, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rpc');
    class RpcError extends Error {
        constructor(method, response) {
            super(`RPC ${method} failed: ${response && response.status}`);
            this.method = method;
            this.response = response;
            this.status = response && response.status;
        }
    }
    exports.RpcError = RpcError;
    async function invoke(method, args) {
        log.i('invoke:', method, args);
        let user = await new Promise((resolve_1, reject_1) => { require(['./user'], resolve_1, reject_1); });
        let path = '/rpc/' + method;
        let url = (await rpcurl.get()) + path;
        let body = JSON.stringify(args);
        let uid = await user.uid.get();
        let sig = await user.sign(path + '\n' + body);
        let headers = {
            'Authorization': JSON.stringify({ uid, sig }),
            'Content-Type': 'application/json',
            'Content-Length': body.length + '',
        };
        await new Promise(resolve => setTimeout(resolve, config.RPC_DELAY * 1000));
        try {
            let res = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                redirect: 'error',
                referrer: 'no-referrer',
                headers,
                body,
            });
            if (!res.ok)
                throw new RpcError(method, res);
            let text = await res.text();
            let json = text ? JSON.parse(text) : null;
            log.i(res.status, json);
            return json;
        }
        catch (err) {
            if (err instanceof RpcError)
                throw err;
            log.e('fetch() failed:', err);
            throw new RpcError(method, null);
        }
    }
    exports.invoke = invoke;
    let rpcurl = new prop_1.AsyncProp(() => {
        let url = qargs.get('rpc')
            || config.DEFAULT_RPC_URL;
        if (url.indexOf('://') < 0) {
            let scheme = config.DEBUG ? 'http' : 'https';
            url = scheme + '://' + url;
        }
        if (!/:\d+$/.test(url))
            url = url + ':' + config.DEFAULT_RPC_PORT;
        log.i('RPC URL:', url);
        return url;
    });
});
//# sourceMappingURL=rpc.js.map