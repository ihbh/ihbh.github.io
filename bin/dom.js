define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CSS_DEBUG = 'debug';
    exports.id = {
        get map() { return $('#map'); },
        get mapAll() { return $('#all-places'); },
        get sendLocation() { return $('#send'); },
        get logs() { return $('#logs'); },
        get gotoCommon() { return $('#gps-london'); },
        get showLogs() { return $('#show-logs'); },
        get exportDB() { return $('#export-db'); },
        get importDB() { return $('#import-db'); },
        get unsync() { return $('#unsync'); },
        get noGPS() { return $('#no-gps'); },
        get regPhoto() { return $('#photo-frame > img'); },
        get regName() { return $('#reg-name'); },
        get regError() { return $('#reg-err'); },
        get regDone() { return $('#reg-done'); },
        get uploadPhotoInput() { return $('#upload-input'); },
        get userPic() { return $('#userpic'); },
        get showPlaces() { return $('#show-places'); },
        get refreshGps() { return $('#refresh-gps'); },
        get visitors() { return $('#visitors'); },
        get activeChats() { return $('#p-unread > .user-cards'); },
        get nearbyStatus() { return $('#nearby-status'); },
        get chatUserIcon() { return $('#chat-u-icon'); },
        get chatUserName() { return $('#chat-u-name'); },
        get chatMessages() { return $('#messages'); },
        get chatReplyText() { return $('#reply-text'); },
        get chatReplySend() { return $('#reply-send'); },
    };
    function $(selector) {
        return document.querySelector(selector);
    }
    exports.$ = $;
    function $$(selector) {
        return document.querySelectorAll(selector);
    }
    exports.$$ = $$;
    function isLoaded() {
        return /^(complete|interactive)$/.test(document.readyState);
    }
    exports.isLoaded = isLoaded;
    function whenLoaded() {
        return new Promise(resolve => {
            if (isLoaded())
                resolve();
            else
                window.addEventListener('load', () => resolve());
        });
    }
    exports.whenLoaded = whenLoaded;
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load script: ' + url));
            document.head.append(script);
        });
    }
    exports.loadScript = loadScript;
    async function loadStyles(url) {
        return new Promise((resolve, reject) => {
            let link = document.createElement('link');
            link.href = url;
            link.rel = 'stylesheet';
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Failed to load CSS: ' + url));
            document.head.append(link);
        });
    }
    exports.loadStyles = loadStyles;
});
//# sourceMappingURL=dom.js.map