
declare namespace phfw {
    
    namespace Core {
        class EventEmitter {
            _events: any;
            constructor();
            on(type: string, callback: Function): void;
            off(type: string, callback: Function): void;
            fire(type: string, data: Object): void;
        }

        class GameScaleManager {
            constructor(viewWidth: number, viewHeight: number, devicePixelRatio: number, maxTargetPixelsNarrowest: number, gameUnitsNarrowest: number);
            gameUnitToPixel(x: number): number;
            gameUnitsToPixels(array: number[]): number[];
            gameUnitCoordToPixelCoord(x: number, y: number): number[];
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