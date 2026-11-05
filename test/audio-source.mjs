// Node's native TS loader does not resolve extensionless bundler imports.
// Keep this hook local to loading the audio source; production builds use Webpack.
import { registerHooks } from 'node:module';
import { URL } from 'node:url';

const audioRoot = new URL('../src/audio/', import.meta.url).href;
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.startsWith(audioRoot) && specifier.startsWith('./'))
      return nextResolve(specifier + '.ts', context);
    return nextResolve(specifier, context);
  },
});
export const { MusicTransport } =
  await import('../src/audio/music-transport.ts');
export const { MusicLayerMixer } =
  await import('../src/audio/music-layer-mixer.ts');
export const { TICKS_PER_QUARTER, ticksPerBar } =
  await import('../src/audio/music-timing.ts');
hook.deregister();
