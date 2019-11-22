define(["require", "exports", "./config", "./log", "./react"], function (require, exports, conf, log_1, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('fsedit');
    class FsEdit {
        constructor(args) {
            this.args = args;
            this.timer = 0;
            this.prev = '';
            log.i('created:', args);
        }
        render() {
            log.i('render()');
            return this.root = react_1.default.createElement("div", { contenteditable: true, class: "fs-edit" });
        }
        async start() {
            log.i('start()');
            this.root.oninput =
                () => this.onchange();
            let path = this.args.filepath();
            log.i('Source:', path);
            let text = await this.read();
            if (text && !this.root.textContent) {
                this.root.textContent = text;
                log.d('Saved input loaded.');
            }
        }
        onchange() {
            this.timer = this.timer || setTimeout(() => this.save(), conf.EDITSAVE_TIMEOUT);
        }
        async save() {
            this.timer = 0;
            let text = this.root.textContent.trim();
            if (text == this.prev)
                return;
            try {
                log.d('Saving input.');
                await this.write(text);
                this.prev = text;
            }
            catch (err) {
                log.e('Failed to save input:', err.message);
            }
        }
        async write(text) {
            let path = this.args.filepath();
            if (!path)
                throw new Error('fs path not ready');
            let vfs = await new Promise((resolve_1, reject_1) => { require(['vfs/vfs'], resolve_1, reject_1); });
            await vfs.root.set(path, text);
            log.d('Input saved to', path);
        }
        async read() {
            let path = this.args.filepath();
            if (!path)
                return null;
            let vfs = await new Promise((resolve_2, reject_2) => { require(['vfs/vfs'], resolve_2, reject_2); });
            let text = await vfs.root.get(path);
            return text;
        }
    }
    exports.default = FsEdit;
});
//# sourceMappingURL=fsedit.js.map