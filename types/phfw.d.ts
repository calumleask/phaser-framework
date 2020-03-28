
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
            readonly assetScaleRatio: number;
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

    namespace Objects {
        type ButtonStyle = {
            textColor?: string;
            downTextColor?: string;
        }
        class TextButton extends Phaser.GameObjects.Text {
            onSelect: () => void;
            constructor(scene: Phaser.Scene, x: number, y: number, text: string | string[], style: ButtonStyle);
        }
    }

    type GameContext = {
        scaling: phfw.Core.GameScaleManager;
    };

    class Scene extends Phaser.Scene {
        protected key: string;
        protected context: GameContext;
        constructor(key: string);
        init(context: GameContext): void;
    }
}

declare module "phaser-framework" {
    export = phfw;
}