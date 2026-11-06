import * as Audio from './audio';
import * as Dialogue from './dialogue';
import * as Geometry from './geometry';
import * as Core from './core';
import * as Input from './input';
import * as Objects from './objects';
import { Scene } from './Scene';

export type { Bounds } from './geometry';

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

export type {
  ScheduledLine,
  SchedulerOptions,
  DialoguePriority,
  DialogueTrigger,
  PendingDialogue,
  DialogueDirectorState,
  DialogueTransition,
} from './dialogue';

const phfw = {
  Audio,
  Dialogue,
  Geometry,
  Core,
  Input,
  Objects,
  Scene,
};

export default phfw;
