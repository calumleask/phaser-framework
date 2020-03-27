
export class GameScaleManager {
    private readonly _viewPortWidth: number;
    private readonly _viewPortHeight: number;
    private readonly _aspectRatio: number;
    private readonly _scaleRatio: number;
    private readonly _gameUnitToViewPort: number;
    private readonly _viewPortToPixel: number;
    private readonly _pixelCentreX: number;
    private readonly _pixelCentreY: number;
 
    constructor(viewPortWidth: number, viewPortHeight: number, devicePixelRatio: number, maxTargetPixelsNarrowest: number, gameUnitsNarrowest: number) {
        this._viewPortWidth = viewPortWidth;
        this._viewPortHeight = viewPortHeight;
        this._aspectRatio = this._viewPortWidth / this._viewPortHeight;

        const viewPortNarrowest = Math.min(this._viewPortWidth, this._viewPortHeight);
        const screenPixelsNarrowest = devicePixelRatio * viewPortNarrowest;
        this._scaleRatio = Math.min(screenPixelsNarrowest, maxTargetPixelsNarrowest) / maxTargetPixelsNarrowest;

        this._gameUnitToViewPort = viewPortNarrowest / gameUnitsNarrowest;
        this._viewPortToPixel = Math.min(screenPixelsNarrowest, maxTargetPixelsNarrowest) / viewPortNarrowest;
        
        this._pixelCentreX = devicePixelRatio * viewPortWidth / 2;
        this._pixelCentreY = devicePixelRatio * viewPortHeight / 2;

        console.log("viewPortWidth: ", this._viewPortWidth);
        console.log("viewPortHeight: ", this._viewPortHeight);
        console.log("aspectRatio: ", this._aspectRatio);
        console.log("devicePixelRatio: ", devicePixelRatio);
        console.log("scaleRatio: ", this._scaleRatio);
        console.log("gameUnitToViewPort: ", this._gameUnitToViewPort);
        console.log("viewPortToPixel: ", this._viewPortToPixel);
    }

    getAssetScaleRatio(): number {
        return this._scaleRatio;
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