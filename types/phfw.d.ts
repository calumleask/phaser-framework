
declare namespace phfw {
    
    namespace Core {
        class EventEmitter {
            _events: any;
            constructor();
            on(type: string, callback: Function): void;
            off(type: string, callback: Function): void;
            fire(type: string, data: Object): void;
        }
    }
    
    namespace Input {
        class InputManager extends Core.EventEmitter {
            constructor(config: InputManagerConfig);
            //Temp method
            getActivePointer(): any;
        }
        type InputManagerConfig = {
            input: any;
            keys: KeyNamePair[];
        }
        type KeyNamePair = {
            key: string, name: string
        };
    }
}

declare module "phaser-framework" {
    export = phfw;
}