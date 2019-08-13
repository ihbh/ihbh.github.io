define(["require", "exports", "./config", "./log"], function (require, exports, config, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MAP_SHARE_LOCATION = 'Map.ShareLocation';
    const log = new log_1.TaggedLogger('rpc');
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
        let url = `${config.RPC_URL}/rpc/${method}`;
        log.i(url, args);
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
});
//# sourceMappingURL=rpc.js.map