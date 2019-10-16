define(["require", "exports", "./page", "./config", "./dom", "./gp", "./log", "./usr"], function (require, exports, page, conf, dom, gp, log_1, usr) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const log = new log_1.TaggedLogger('feedback');
    let timer = 0;
    async function init() {
        dom.id.sendFeedback.onclick = sendFeedback;
        dom.id.feedbackText.oninput = saveFeedback;
        await loadFeedback();
    }
    exports.init = init;
    async function loadFeedback() {
        let text = await gp.feedback.get();
        dom.id.feedbackText.textContent = text || '';
    }
    async function saveFeedback() {
        timer = timer || setTimeout(async () => {
            timer = 0;
            let text = dom.id.feedbackText.textContent || '';
            let prev = await gp.feedback.get();
            if (prev != text)
                await gp.feedback.set(text.trim() || null);
        }, conf.FEEDBACK_SAVE_TIMEOUT);
    }
    async function sendFeedback() {
        let text = dom.id.feedbackText.textContent || '';
        text = text.trim();
        if (!text)
            return;
        try {
            dom.id.feedbackStatus.textContent = 'Sending feedback.';
            await usr.sendFeedback(text);
            dom.id.feedbackStatus.textContent = 'Feedback sent.';
            await gp.feedback.set(null);
            page.set('map');
        }
        catch (err) {
            log.e('Failed:', err);
            dom.id.feedbackStatus.textContent = 'Failed to send feedback.';
        }
    }
});
//# sourceMappingURL=feedback.js.map