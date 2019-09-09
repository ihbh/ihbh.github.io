define(["require", "exports", "./ls", "./idb"], function (require, exports, ls, idb) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const prop = idb.prop || ls.prop;
    exports.username = prop('user.name');
    exports.userimg = prop('user.img'); // data:image/jpeg;base64,...
    // ed25519
    exports.keyseed = prop('user.keyseed');
    exports.privkey = prop('user.privkey');
    exports.pubkey = prop('user.pubkey');
    exports.uid = prop('user.id');
    exports.places = prop('places', {});
    exports.rpcs = {
        infos: prop('rpcs.info', {}),
        unsent: prop('rpcs.unsent', {}),
        failed: prop('rpcs.failed', {}),
    };
    exports.unsentMessages = prop('chat.unsent', {});
});
//# sourceMappingURL=gp.js.map