import "phaser";

type GameContext = {
    scaling: phfw.Core.GameScaleManager;
};

export class Scene extends Phaser.Scene {
    protected key: string;
    protected context?: GameContext;

    constructor(key: string) {
        const config: Phaser.Types.Scenes.SettingsConfig = {
            key: key
        };
        super(config);

        this.key = key;
    }

    init(context: GameContext): void {
        this.context = context;
    }
}