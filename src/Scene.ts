import * as Phaser from 'phaser';
import type { GameScaleManager } from './core/GameScaleManager';

type GameContext = {
  scaling: GameScaleManager;
};

export class Scene extends Phaser.Scene {
  protected key: string;
  protected context?: GameContext;

  constructor(key: string) {
    const config: Phaser.Types.Scenes.SettingsConfig = {
      key: key,
    };
    super(config);

    this.key = key;
  }

  init(context: GameContext): void {
    this.context = context;
  }
}
