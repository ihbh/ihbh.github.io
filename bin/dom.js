define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CSS_DEBUG = 'debug';
    exports.id = {
        get pageContainer() { return $('#page'); },
        get debugMenu() { return $('#debug'); },
        get btnDebugToggle() { return $('#debug-toggle'); },
        get linkDarkMode() { return $('#darkmode'); },
        get logs() { return $('#logs'); },
        get gotoCommon() { return $('#gps-london'); },
        get showLogs() { return $('#show-logs'); },
        // Main OSM Map
        get btnSeeChats() { return $('#see-chats'); },
        get btnSettings() { return $('#settings'); },
        get map() { return $('#map'); },
        get mapAll() { return $('#all-places'); },
        get sendLocation() { return $('#send'); },
        get noGPS() { return $('#no-gps'); },
        // VFS explorer
        get pageExplorer() { return $('#p-explorer'); },
        get expControls() { return $('#p-explorer .controls'); },
        get expVfsPath() { return $('#p-explorer .vfs-path'); },
        get expPath() { return $('#p-explorer .path'); },
        get expData() { return $('#p-explorer .data'); },
        // Settings
        get exportDB() { return $('#export-db'); },
        get importDB() { return $('#import-db'); },
        get btnExplorer() { return $('#vfs-explorer'); },
        // Profile
        get regStatus() { return $('#p-profile .status'); },
        get regAbout() { return $('#p-profile > .about'); },
        get regReason() { return $('#p-profile > .reason'); },
        get regDetails() { return $('#p-profile .details'); },
        get regPhoto() { return $('#photo'); },
        get regName() { return $('#reg-name'); },
        get regReport() { return $('#p-profile .report'); },
        get regSendReport() { return $('#p-profile .send-report'); },
        get regDone() { return $('#reg-done'); },
        get upcRotate() { return $('#p-profile .photo .rotate'); },
        get upcFlip() { return $('#p-profile .photo .flip'); },
        // Main Map
        get userPic() { return $('#userpic'); },
        get showPlaces() { return $('#show-places'); },
        get visitors() { return $('#visitors'); },
        get activeChats() { return $('#p-unread > .user-cards'); },
        // Feedback
        get sendFeedback() { return $('#send-feedback'); },
        get feedbackText() { return $('#p-feedback .text'); },
        get feedbackStatus() { return $('#p-feedback .status'); },
        // Nearby visitors
        get nearbyStatus() { return $('#nearby-status'); },
        get vplaceMap() { return $('#vplace-map'); },
        get vtimeBar() { return $('#vtime-bar'); },
        get otherVisits() { return $('#nvtimes'); },
        get vtimeLabel() { return $('#vtime-label'); },
        get unvisit() { return $('#unvisit'); },
        get chatUserIcon() { return $('#chat-u-icon'); },
        get chatUserHref() { return $('#p-chat .user-href'); },
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