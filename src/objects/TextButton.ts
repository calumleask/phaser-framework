import 'phaser';

type ButtonStyle = {
  textColor: string;
  downTextColor?: string;
};

export class TextButton extends Phaser.GameObjects.Text {
  private _isDown: boolean;
  private _textColor: string;
  private _downTextColor: string;
  onSelect?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string | string[],
    style: ButtonStyle,
  ) {
    super(scene, x, y, text, {});

    this._isDown = false;
    this._textColor = style.textColor;
    this._downTextColor = style.downTextColor || style.textColor;

    this.setInteractive()
      .on('pointerover', () => {
        this.onPointerOver();
      })
      .on('pointerout', () => {
        this.onPointerOut();
      })
      .on('pointerdown', () => {
        this.onPointerDown();
      })
      .on('pointerup', () => {
        this.onPointerUp();
      });

    this.setColor(this._textColor);
  }

  onPointerOver(): void {
    console.log('pointerover');
  }

  onPointerOut(): void {
    console.log('pointerout');
    if (this._isDown) {
      this.setUp();
    }
  }

  onPointerDown(): void {
    console.log('pointerdown');
    this.setDown();
  }

  onPointerUp(): void {
    console.log('pointerup');
    if (this._isDown) {
      this.setUp();
      this.select();
    }
  }

  setDown(): void {
    this._isDown = true;
    this.setColor(this._downTextColor);
  }

  setUp(): void {
    this._isDown = false;
    this.setColor(this._textColor);
  }

  select(): void {
    console.log('select');
    if (this.onSelect) {
      this.onSelect();
    }
  }
}
