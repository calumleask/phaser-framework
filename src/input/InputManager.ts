import { EventEmitter } from '../core/EventEmitter';
import type * as Phaser from 'phaser';

type KeyNamePair = {
  key: string;
  name: string;
};

export type InputManagerConfig = {
  input: Phaser.Input.InputPlugin;
  keys: KeyNamePair[];
};

export type InputResetEvent = {
  type: 'input:reset';
  target: InputManager;
  reason: 'blur';
  codes: string[];
};

export class InputManager extends EventEmitter {
  private _keys: Set<string>;
  private _input: Phaser.Input.InputPlugin;
  private _keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  private _handlers: {
    type: string;
    callback: (event: KeyboardEvent) => void;
  }[];
  private _disposed = false;
  private _onBlur = (): void => {
    if (this._keys.size === 0) return;
    const codes = [...this._keys];
    this._keys.clear();
    this.fire('input:reset', { reason: 'blur', codes });
  };
  private _onShutdown = (): void => this.dispose();

  constructor(config: InputManagerConfig) {
    super();

    this._keys = new Set();
    this._input = config.input;
    this._keyboard = config.input.keyboard;
    this._handlers = [];

    const keyboard = this._keyboard;
    if (keyboard) {
      config.keys.forEach((pair: KeyNamePair) => {
        const down = (event: KeyboardEvent): void =>
          this.onKeyDown(event, pair.name);
        const up = (event: KeyboardEvent): void =>
          this.onKeyUp(event, pair.name);
        const downType = 'keydown-' + pair.key;
        const upType = 'keyup-' + pair.key;
        keyboard.on(downType, down);
        keyboard.on(upType, up);
        this._handlers.push({ type: downType, callback: down });
        this._handlers.push({ type: upType, callback: up });
      });
    }
    config.input.scene.sys.game.events.on('blur', this._onBlur);
    config.input.scene.sys.events.on('shutdown', this._onShutdown);
  }

  onKeyDown(event: KeyboardEvent, keyName: string): void {
    if (this._disposed) return;
    const down = true;
    const up = false;
    const pressed = !this._keys.has(event.code);
    const released = false;
    if (pressed) {
      this._keys.add(event.code);
    }
    this.fire(keyName, { event, down, up, pressed, released });
  }

  onKeyUp(event: KeyboardEvent, keyName: string): void {
    if (this._disposed) return;
    const down = false;
    const up = true;
    const pressed = false;
    const released = this._keys.has(event.code);
    if (released) {
      this._keys.delete(event.code);
    }
    this.fire(keyName, { event, down, up, pressed, released });
  }

  getActivePointer(): Phaser.Input.Pointer {
    return this._input.activePointer;
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    for (const { type, callback } of this._handlers) {
      this._keyboard?.off(type, callback);
    }
    this._handlers.length = 0;
    this._input.scene.sys.game.events.off('blur', this._onBlur);
    this._input.scene.sys.events.off('shutdown', this._onShutdown);
    this._keys.clear();
  }
}
