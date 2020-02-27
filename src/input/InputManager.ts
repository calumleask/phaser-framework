
import { EventEmitter } from "../core/EventEmitter";

type KeyNamePair = {
    key: string, name: string
};

export type InputManagerConfig = {
    input: any;
    keys: KeyNamePair[];
};

export class InputManager extends EventEmitter {

    constructor(config: InputManagerConfig) {
        super();

        config.keys.forEach((pair: KeyNamePair) => {
            config.input.keyboard.on("keydown-" + pair.key, (event: any) => {
                this.fire(pair.name, { event });
            });
            config.input.keyboard.on("keyup-" + pair.key, (event: any) => {
                this.fire(pair.name, { event });
            });
        });
    }
}