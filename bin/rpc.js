define(["require", "exports", "./config", "./log", "./qargs", "./prop"], function (require, exports, config, log_1, qargs, prop_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('rpc');
    let pending = [];
    let pbtimer = 0;
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
        let reqid = genRequestId();
        if (method != 'Batch.Run')
            return schedule(method, args, reqid);
        return invokeInternal(method, args, reqid);
    }
    exports.invoke = invoke;
    async function invokeInternal(method, args, reqid) {
        log.i(reqid, method, args);
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
            log.i(reqid, 'result:', json);
            return json;
        }
        catch (err) {
            log.w(reqid, 'error:', err);
            if (err instanceof RpcError)
                throw err;
            throw new RpcError(method, null);
        }
    }
    function schedule(name, args, reqid) {
        return new Promise((resolve, reject) => {
            pending.push({
                name,
                args,
                reqid,
                resolve,
                reject
            });
            pbtimer = pbtimer || setTimeout(sendPendingBatch, config.RPC_BATCH_DELAY);
        });
    }
    async function sendPendingBatch() {
        pbtimer = 0;
        if (!pending.length)
            return;
        log.d('Prepairing to send a batch:', pending.length);
        let batch = pending.splice(0);
        if (batch.length == 1) {
            log.d('The batch has only 1 rpc.');
            let { name, args, reqid, resolve, reject } = batch[0];
            await invokeInternal(name, args, reqid)
                .then(resolve, reject);
            return;
        }
        let args = batch.map(b => {
            return {
                name: b.name,
                args: b.args
            };
        });
        try {
            let results = await invoke('Batch.Run', args);
            log.d('Parsing batch results:', batch.length);
            for (let i = 0; i < batch.length; i++) {
                let { res, err } = results[i];
                let { name, resolve, reject } = batch[i];
                if (!err) {
                    resolve(res);
                    continue;
                }
                let rpcerr = new RpcError(name, {
                    status: err.code,
                    message: err.message,
                    description: err.description,
                });
                reject(rpcerr);
            }
        }
        catch (err) {
            log.w('The entire batch failed:', err);
            for (let { reject } of batch) {
                reject(err instanceof RpcError ?
                    err : new RpcError('Batch.Run', null));
            }
        }
    }
    function genRequestId() {
        let id = '';
        while (id.length < 8)
            id += Math.random().toString(16).slice(2);
        return id.slice(-8);
    }
    let rpcurl = new prop_1.AsyncProp(() => {
        let url = qargs.get('rpc')
            || config.DEFAULT_RPC_URL;
        if (url.indexOf('://') < 0) {
            let scheme = config.DEBUG ? 'http' : 'https';
            url = scheme + '://' + url;
        }
        if (!/:\d+$/.test(url))
            url = url + ':' + config.DEFAULT_RPC_PORT;
        log.i('Server:', url);
        return url;
    });
});
//# sourceMappingURL=rpc.js.map