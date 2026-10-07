import { EventEmitter } from '../core/EventEmitter';

type KeyNamePair = {
  key: string;
  name: string;
};

export type InputManagerConfig = {
  input: Phaser.Input.InputPlugin;
  keys: KeyNamePair[];
};

export class InputManager extends EventEmitter {
  private _keys: Set<number>;
  private _input: Phaser.Input.InputPlugin;

  constructor(config: InputManagerConfig) {
    super();

    this._keys = new Set();
    this._input = config.input;

    config.keys.forEach((pair: KeyNamePair) => {
      config.input.keyboard.on('keydown-' + pair.key, (event: any) => {
        this.onKeyDown(event, pair.name);
      });
      config.input.keyboard.on('keyup-' + pair.key, (event: any) => {
        this.onKeyUp(event, pair.name);
      });
    });
  }

  onKeyDown(event: any, keyName: string): void {
    const down = true;
    const up = false;
    const pressed = !this._keys.has(event.code);
    const released = false;
    if (pressed) {
      this._keys.add(event.code);
    }
    this.fire(keyName, { event, down, up, pressed, released });
  }

  onKeyUp(event: any, keyName: string): void {
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
}
