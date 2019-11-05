import * as conf from "./config";
import { TaggedLogger } from "./log";
import React from './react';
import UXComp from "./uxcomp";

const log = new TaggedLogger('fsedit');

interface Args {
  filepath: () => string;
}

export default class FsEdit implements UXComp {
  private timer = 0;
  private prev = '';
  private root: HTMLElement;

  constructor(private args: Args) {
    log.i('created:', args);
  }

  render() {
    log.i('render()');
    return this.root = <div
      contenteditable
      class="fs-edit">
    </div>;
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

  private onchange() {
    this.timer = this.timer || setTimeout(
      () => this.save(), conf.EDITSAVE_TIMEOUT);
  }

  private async save() {
    this.timer = 0;
    let text = this.root.textContent.trim();
    if (text == this.prev) return;

    try {
      log.d('Saving input.');
      await this.write(text);
      this.prev = text;      
    } catch (err) {
      log.e('Failed to save input:', err.message);
    }
  }

  private async write(text: string) {
    let path = this.args.filepath();
    if (!path) throw new Error('fs path not ready');
    let vfs = await import('./vfs');
    await vfs.root.set(path, text);
    log.d('Input saved to', path);
  }

  private async read() {
    let path = this.args.filepath();
    if (!path) return null;
    let vfs = await import('./vfs');
    let text = await vfs.root.get(path);
    return text;
  }
}
