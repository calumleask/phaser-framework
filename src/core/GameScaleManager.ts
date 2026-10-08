export class GameScaleManager {
  readonly assetScaleRatio: number;
  private readonly _gameUnitToViewPort: number;
  private readonly _viewPortToPixel: number;
  private readonly _pixelCentreX: number;
  private readonly _pixelCentreY: number;

  constructor(
    viewPortWidth: number,
    viewPortHeight: number,
    devicePixelRatio: number,
    maxTargetPixelsNarrowest: number,
    gameUnitsNarrowest: number,
  ) {
    const viewPortNarrowest = Math.min(viewPortWidth, viewPortHeight);
    const screenPixelsNarrowest = devicePixelRatio * viewPortNarrowest;
    this.assetScaleRatio =
      Math.min(screenPixelsNarrowest, maxTargetPixelsNarrowest) /
      maxTargetPixelsNarrowest;

    this._gameUnitToViewPort = viewPortNarrowest / gameUnitsNarrowest;
    this._viewPortToPixel =
      Math.min(screenPixelsNarrowest, maxTargetPixelsNarrowest) /
      viewPortNarrowest;

    this._pixelCentreX = (devicePixelRatio * viewPortWidth) / 2;
    this._pixelCentreY = (devicePixelRatio * viewPortHeight) / 2;
  }

  getAssetScaleRatio(): number {
    return this.assetScaleRatio;
  }

  gameUnitToPixel(x: number): number {
    return x * this._gameUnitToViewPort * this._viewPortToPixel;
  }

  gameUnitsToPixels(array: number[]): number[] {
    return array.map(x => {
      return this.gameUnitToPixel(x);
    });
  }

  gameUnitCoordToPixelCoord(x: number, y: number): number[] {
    let pixelX = this.gameUnitToPixel(x);
    let pixelY = this.gameUnitToPixel(y);

    pixelX += this._pixelCentreX;
    pixelY += this._pixelCentreY;

    return [pixelX, pixelY];
  }
}
