
import { EventEmitter } from "../core/EventEmitter";

type KeyNamePair = {
    key: string, name: string
};

export type InputManagerConfig = {
    input: any;
    keys: KeyNamePair[];
};

export class InputManager extends EventEmitter {
    keys: Set<number>;
    input: any;

    constructor(config: InputManagerConfig) {
        super();

        this.keys = new Set();
        this.input = config.input;

        config.keys.forEach((pair: KeyNamePair) => {
            config.input.keyboard.on("keydown-" + pair.key, (event: any) => { this.onKeyDown(event, pair.name); });
            config.input.keyboard.on("keyup-" + pair.key, (event: any) => { this.onKeyUp(event, pair.name); });
        });
    }

    onKeyDown(event: any, keyName: string) {
        const down = true;
        const up = false;
        const pressed = !this.keys.has(event.code);
        const released = false;
        if (pressed) {
            this.keys.add(event.code);
        }
        this.fire(keyName, { event, down, up, pressed, released });
    }

    onKeyUp(event: any, keyName: string) {
        const down = false;
        const up = true;
        const pressed = false;
        const released = this.keys.has(event.code);
        if (released) {
            this.keys.delete(event.code);
        }
        this.fire(keyName, { event, down, up, pressed, released });
    }
    // Temp method
    getActivePointer(): any {
        return this.input.activePointer;
    }
}