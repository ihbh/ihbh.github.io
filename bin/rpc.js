define(["require", "exports", "./config", "./log", "./gp", "./qargs", "./prop"], function (require, exports, config, log_1, gp, qargs, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rpc');
    let sending = false;
    class RpcError extends Error {
        constructor(method, response) {
            super(`RPC ${method} failed: ${response && response.status}`);
            this.method = method;
            this.response = response;
            this.status = response && response.status;
        }
    }
    exports.RpcError = RpcError;
    async function invoke(method, args, retry) {
        log.i('invoke:', method, args, 'retry?', retry);
        if (retry)
            await schedule(method, args);
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
        url = url.replace('/User.', '/Users.');
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
    async function schedule(method, args) {
        log.i('schedule:', method, args);
        let sha1 = await new Promise((resolve_2, reject_2) => { require(['./sha1'], resolve_2, reject_2); });
        let info = { method, args };
        let id = sha1(JSON.stringify(info)).slice(0, 6);
        await gp.rpcs.infos.modify(infos => {
            infos[id] = info;
            return infos;
        });
        await gp.rpcs.unsent.modify(unsent => {
            unsent[id] = Date.now() / 1000 | 0;
            return unsent;
        });
    }
    exports.schedule = schedule;
    async function sendall() {
        let unsent = await gp.rpcs.unsent.get();
        let infos = await gp.rpcs.infos.get();
        if (sending)
            throw new Error('Still sending.');
        log.i('sending unsent:', Object.keys(unsent).length);
        sending = true;
        try {
            for (let id of Object.keys(unsent)) {
                try {
                    let { method, args } = infos[id];
                    await invoke(method, args);
                    await gp.rpcs.unsent.modify(unsent => {
                        delete unsent[id];
                        return unsent;
                    });
                    await gp.rpcs.infos.modify(infos => {
                        delete infos[id];
                        return infos;
                    });
                }
                catch (err) {
                    let retry = err instanceof RpcError &&
                        (!err.status || err.status >= 500);
                    if (retry) {
                        log.i('will be resent later:', id, infos[id].method);
                    }
                    else {
                        await gp.rpcs.unsent.modify(unsent => {
                            delete unsent[id];
                            return unsent;
                        });
                        await gp.rpcs.failed.modify(errs => {
                            errs[id] = err.message;
                            return errs;
                        });
                    }
                }
            }
        }
        finally {
            sending = false;
            log.i('still unsent rpcs:', Object.keys(unsent).length);
        }
    }
    exports.sendall = sendall;
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