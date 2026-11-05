import * as Audio from './audio';
import * as Core from './core';
import * as Input from './input';
import * as Objects from './objects';
import { Scene } from './Scene';

export type { InputKeyEvent, InputResetEvent } from './input';

export type {
  Meter,
  MusicClock,
  MusicTimer,
  MusicPosition,
  MusicScheduleAction,
  MusicScheduleHandle,
  MusicTransportOptions,
  MusicLayer,
  LayerChange,
} from './audio';

const phfw = {
  Audio,
  Core,
  Input,
  Objects,
  Scene,
};

export default phfw;
