import framework from 'phaser-framework';
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
    input.on('action', event => {
      const pressed: unknown = event.pressed;
      void pressed;
    });
    const pointer: Phaser.Input.Pointer = input.getActivePointer();
    void pointer;
    this.context?.scaling.gameUnitToPixel(1);
  }
}

void ConsumerScene;
