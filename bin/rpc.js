define(["require", "exports", "./config", "./log", "./prop", "./qargs"], function (require, exports, conf, log_1, prop_1, qargs) {
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
    async function invoke(name, args) {
        let reqid = generateRequestId();
        if (name != 'Batch.Run')
            return schedule(name, args, reqid);
        return invokeInternal(name, args, reqid);
    }
    exports.invoke = invoke;
    async function invokeInternal(name, args, reqid) {
        log.i(reqid, name, args);
        let user = await new Promise((resolve_1, reject_1) => { require(['./user'], resolve_1, reject_1); });
        let path = '/rpc/' + name;
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
                throw new RpcError(name, res);
            let text = await res.text();
            let json = text ? JSON.parse(text) : null;
            log.i(reqid, 'result:', json);
            return json;
        }
        catch (err) {
            log.w(reqid, 'error:', err);
            if (err instanceof RpcError)
                throw err;
            throw new RpcError(name, null);
        }
    }
    function schedule(name, args, reqid) {
        return new Promise((resolve, reject) => {
            let json = JSON.stringify({
                name,
                args,
            });
            pending.push({
                json,
                reqid,
                resolve,
                reject,
            });
            startTimer();
        });
    }
    function startTimer() {
        pbtimer = pbtimer || setTimeout(async () => {
            pbtimer = 0;
            if (pending.length < 1)
                return;
            if (pending.length == 1)
                return sendSinglePendingRequest();
            await sendBatch();
            if (pending.length > 0)
                startTimer();
        }, conf.RPC_BATCH_DELAY);
    }
    async function sendSinglePendingRequest() {
        let [req] = pending.splice(0);
        let { json, reqid, resolve, reject } = req;
        let { name, args } = JSON.parse(json);
        await invokeInternal(name, args, reqid)
            .then(resolve, reject);
    }
    function getBatchWithinMaxSize() {
        // Smaller RPCs first.
        pending.sort((p, q) => p.json.length - q.json.length);
        let batchSize = 0;
        let batch = [];
        do {
            let req = pending[0];
            let size = req.json.length;
            let canAppend = !batch.length ||
                batchSize + size <= conf.RPC_MAX_BATCH_SIZE;
            if (!canAppend)
                break;
            batchSize += size;
            batch.push(req);
            pending.splice(0, 1);
        } while (pending.length > 0);
        log.d('RPC batch:', batch.length, 'RPCs', (batchSize / 1024).toFixed(1), 'KB', pending.length, 'left');
        return batch;
    }
    async function sendBatch() {
        let batch = getBatchWithinMaxSize();
        try {
            let results = await invoke('Batch.Run', batch.map(b => JSON.parse(b.json)));
            for (let i = 0; i < batch.length; i++) {
                let { res, err } = results[i];
                let { json, resolve, reject } = batch[i];
                if (!err) {
                    resolve(res);
                    continue;
                }
                let { name } = JSON.parse(json);
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
    function generateRequestId() {
        let id = '';
        while (id.length < 8)
            id += Math.random().toString(16).slice(2);
        return id.slice(-8);
    }
    let rpcurl = new prop_1.AsyncProp(() => {
        let url = qargs.get('rpc')
            || conf.DEFAULT_RPC_URL;
        if (url.indexOf('://') < 0) {
            let scheme = conf.DEBUG ? 'http' : 'https';
            url = scheme + '://' + url;
        }
        if (!/:\d+$/.test(url))
            url = url + ':' + conf.DEFAULT_RPC_PORT;
        log.i('Server:', url);
        return url;
    });
});
//# sourceMappingURL=rpc.js.map