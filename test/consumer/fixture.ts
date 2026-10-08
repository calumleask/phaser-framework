import framework, {
  type InputKeyEvent,
  type InputResetEvent,
} from 'phaser-framework';
import type * as Phaser from 'phaser';

const scale = new framework.Core.GameScaleManager(320, 240, 1, 480, 240);
const ratio: number = scale.getAssetScaleRatio();
const pixels: number[] = scale.gameUnitsToPixels([1, 2]);
void ratio;
void pixels;

type ButtonStyle = ConstructorParameters<
  typeof framework.Objects.TextButton
>[4];
type IsOptional<T, K extends keyof T> =
  Record<never, never> extends Pick<T, K> ? true : false;
type AssertFalse<T extends false> = T;
type RequiredTextColor = AssertFalse<IsOptional<ButtonStyle, 'textColor'>>;
const requiredTextColor: RequiredTextColor = false;
void requiredTextColor;

class ConsumerScene extends framework.Scene {
  constructor() {
    super('consumer');
  }

  create(): void {
    const button = new framework.Objects.TextButton(this, 20, 20, 'Play', {
      textColor: '#ffffff',
      downTextColor: '#cccccc',
    });
    this.add.existing(button);
    button.onSelect = () => {};
    button.onPointerOut();
    button.setUp();

    const input = new framework.Input.InputManager({
      input: this.input,
      keys: [{ key: 'A', name: 'action' }],
    });
    const onAction = (event: InputKeyEvent): void => {
      const native: KeyboardEvent = event.event;
      const down: boolean = event.down;
      const up: boolean = event.up;
      const pressed: boolean = event.pressed;
      const released: boolean = event.released;
      const name: string = event.type;
      const target: typeof input = event.target;
      void native;
      void down;
      void up;
      void pressed;
      void released;
      void name;
      void target;
    };
    input.onKey('action', onAction);
    input.offKey('action', onAction);
    const onReset = (event: InputResetEvent): void => {
      const reason: 'blur' = event.reason;
      const codes: string[] = event.codes;
      const name: 'input:reset' = event.type;
      const target: typeof input = event.target;
      void reason;
      void codes;
      void name;
      void target;
    };
    input.onReset(onReset);
    input.offReset(onReset);
    const pointer: Phaser.Input.Pointer = input.getActivePointer();
    void pointer;
    input.dispose();
    input.dispose();
    this.context?.scaling.gameUnitToPixel(1);
  }
}

void ConsumerScene;
