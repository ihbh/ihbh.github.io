define(["require", "exports", "./config", "./log", "./ls"], function (require, exports, config, log_1, ls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAP_SHARE_LOCATION = 'Map.ShareLocation';
    exports.USER_SET_DETAILS = 'User.SetDetails';
    const log = new log_1.TaggedLogger('rpc');
    let sending = false;
    class RpcError extends Error {
        constructor(method, response) {
            super(`RPC ${method} failed: ${response.status}`);
            this.method = method;
            this.response = response;
            this.status = response.status;
        }
    }
    exports.RpcError = RpcError;
    async function invoke(method, args) {
        log.i('invoke:', method, args);
        let url = `${config.RPC_URL}/rpc/${method}`;
        await new Promise(resolve => setTimeout(resolve, config.RPC_DELAY * 1000));
        let res = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'error',
            referrer: 'no-referrer',
            body: JSON.stringify(args),
        });
        if (!res.ok)
            throw new RpcError(method, res);
        let json = await res.json();
        log.i(res.status, json);
        return json;
    }
    exports.invoke = invoke;
    async function schedule(method, args) {
        log.i('schedule:', method, args);
        let sha1 = await new Promise((resolve_1, reject_1) => { require(['./sha1'], resolve_1, reject_1); });
        let info = { method, args };
        let id = sha1(JSON.stringify(info)).slice(0, 6);
        ls.rpcs.infos.modify(infos => {
            infos[id] = info;
            return infos;
        });
        ls.rpcs.unsent.modify(unsent => {
            unsent[id] = Date.now() / 1000 | 0;
            return unsent;
        });
    }
    exports.schedule = schedule;
    async function sendall() {
        let unsent = ls.rpcs.unsent.get();
        let infos = ls.rpcs.infos.get();
        if (sending)
            throw new Error('Still sending.');
        log.i('sending unsent:', Object.keys(unsent).length);
        sending = true;
        try {
            for (let id of Object.keys(unsent)) {
                try {
                    let { method, args } = infos[id];
                    await invoke(method, args);
                    ls.rpcs.unsent.modify(unsent => {
                        delete unsent[id];
                        return unsent;
                    });
                    ls.rpcs.infos.modify(infos => {
                        delete infos[id];
                        return infos;
                    });
                }
                catch (err) {
                    if (err instanceof RpcError && err.response.status >= 500) {
                        log.i('will be resent later:', id);
                    }
                    else {
                        ls.rpcs.unsent.modify(unsent => {
                            delete unsent[id];
                            return unsent;
                        });
                        ls.rpcs.failed.modify(errs => {
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
});
//# sourceMappingURL=rpc.js.map