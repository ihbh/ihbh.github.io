import * as conf from './config';
import * as dom from './dom';
import * as gp from './gp';
import { TaggedLogger } from "./log";
import * as page from './page';
import React from './react';
import * as usr from './usr';

const log = new TaggedLogger('feedback');

let timer = 0;

export async function render() {
  return <div id="p-feedback"
    class="page">
    <div class="text"
      contenteditable></div>
    <div class="footer">
      <span class="status"></span>
      <button id="send-feedback">
        Send Feedback
      </button>
    </div>
  </div>;
}

export async function init() {
  dom.id.sendFeedback.onclick = sendFeedback;
  dom.id.feedbackText.oninput = saveFeedback;

  await loadFeedback();
}

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
  if (!text) return;

  try {
    dom.id.feedbackStatus.textContent = 'Sending feedback.';
    await usr.sendFeedback(text);
    dom.id.feedbackStatus.textContent = 'Feedback sent.';
    await gp.feedback.set(null);
    page.set('map');
  } catch (err) {
    log.e('Failed:', err);
    dom.id.feedbackStatus.textContent = 'Failed to send feedback.';
  }
}
