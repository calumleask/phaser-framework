# Music transport and loop mixer

The additive default-object API is `framework.Audio` for ESM consumers and
`phfw.default.Audio` for UMD script hosts. Existing Core, Input, Objects and Scene
exports and package entry paths are unchanged. Phaser remains a 4.2.1 peer.

Runtime exports are `MusicTransport`, `MusicLayerMixer`, `TICKS_PER_QUARTER` (24)
and `ticksPerBar`. Import `Meter`, `MusicClock`, `MusicTimer`, `MusicPosition`,
`MusicScheduleAction`, `MusicScheduleHandle`, `MusicTransportOptions`, `MusicLayer`
and `LayerChange` as types from the package root.

## Minimal synthetic example

The host calls this after unlocking its existing AudioContext. The silent buffer
stands in for a decoded loop; the framework has no content, loader or asset keys.

```ts
import framework, { type MusicTimer } from 'phaser-framework';

function startSyntheticLoop(context: AudioContext, destination: AudioNode) {
  const timer: MusicTimer = {
    set: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clear: handle => window.clearTimeout(handle),
  };
  const meter = { numerator: 4, denominator: 4 };
  const transport = new framework.Audio.MusicTransport({
    clock: context, timer, bpm: 120, meter, phraseBars: 4,
  });
  // One 4/4 bar at 120 BPM lasts two seconds.
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const mixer = new framework.Audio.MusicLayerMixer({
    context, destination, transport,
    loopTicks: framework.Audio.ticksPerBar(meter),
    layers: [{ id: 'texture', buffer, defaultBoundary: 'bar' }],
  });
  mixer.setStemGain('texture', 0.5);
  try {
    if (!mixer.start()) {
      mixer.dispose();
      return null;
    }
  } catch (error) {
    mixer.dispose();
    throw error;
  }
  return mixer; // Host calls mixer.dispose() at shutdown.
}
```

## Timing and transitions

Transport requires an injected timer; it never selects browser globals. Its clock
exposes `currentTime` and `state`. Timer callbacks wake the queue; scheduled actions
receive absolute audio timestamps and must return cancellation cleanup functions
for any work issued ahead of playback. Equal-tick events retain insertion order.
Handles cancel pending work or clean up issued work once. Stop/dispose clears the
queue and timer. `pump()` is also available for deterministic hosts/tests.

BPM remains 40..240, phrase length 1..32 bars, meter numerator 1..12 and denominator
2/4/8/16. Defaults remain 150 ms lookahead and 25 ms polling; polling must be shorter
than lookahead. Positions are zero-based integer ticks/beats/bars/phrases. Next bar
and phrase getters are strictly following boundaries, including when exactly on a
boundary. Pause/suspension freezes position, cancels issued future work and resumes
on a full bar; expired events are skipped rather than played late. Starting needs
a running clock; start time cannot precede it. Scheduling rejects negative,
fractional/unsafe ticks, elapsed ticks and ticks before the resume bar.

Each `MusicLayer` supplies `id`, `buffer` and mandatory `defaultBoundary`:
`immediate`, `bar` or `phrase`. No content role is interpreted. The host excludes
one-shot cues and decides default boundaries. IDs retain lowerCamelCase validation
and case-insensitive uniqueness. All buffers must share sample count, sample rate
and channel count. The loop duration must match transport ticks within one sample;
playback rate compensates for that rounding.

`start()` returns false while the context is not running. Sources start together
with a 50 ms lead and zero gains. Master volume defaults to 0.75; layer fades to
120 ms, master fades to 30 ms. Gains remain 0..1 and layer fade duration 0.01..10 s.
`setStemGain(id, gain, change?)` uses the layer default unless `change.boundary`
overrides it. `change.atTick` wins over bar/phrase selection and cannot be combined
with `immediate`. A replacement cancels the older transition and holds the current
gain before ramping. Master mute preserves the chosen volume for unmute.

## Ownership and limitations

The host creates one graph after unlock and owns settings, content selection,
one-shots, scene/visibility subscriptions and fallback. The mixer owns the supplied
transport, looping sources, gains and its context-state listener. Dispose borrowers
of that transport before the mixer. Never independently dispose a borrowed transport.
Mixer pause stops sources; resume creates one set at the transport's bar offset.
Context suspension/restore follows the same alignment without duplicate playback.
Startup/source-resume failure stops partial playback and clears scheduling; dispose
the mixer when abandoning it. Stop permits restart; dispose is idempotent and final.
Mutating operations reject use after disposal except the harmless stop/dispose calls.
The mixer never suspends, closes or disconnects the host context/destination and
does not own decoded buffers.

This API is a browser Web Audio foundation, not a complete music director. It does
not decode or load assets, select content, handle one-shot cues, unlock audio from
user gestures, or coordinate scene and visibility policy. Applications provide
those behaviors around the transport and mixer. The injected timer wakes scheduling;
all musical timing uses the supplied audio clock. Native audio and non-browser
hosting are outside the supported platform contract.

## Review evidence

The transport and mixer preserve the existing scheduling mechanism and numerical
defaults. The intentional API changes are mandatory timer injection and explicit
per-layer default boundaries. Unit tests use synthetic loops, fake clocks and fake
audio graphs. The packed fixture checks public types and UMD/ESM access, plus real
offline Web Audio graph construction and disposal. It does not verify audible
playback, which remains a manual check in an application that enables audio.

Verified on 2026-11-05 with Node 24.21.0 / npm 12.2.0: 26 targeted music tests
pass; `npm test` passes lint, strict types and all 27 unit tests;
`npm run format:check` passes; `npm run verify:consumer` passes packed types and
both UMD and bundled ESM Chrome runtimes, retaining the existing scene/input/button
checks. The generated package includes `dist/phfw.js`, `dist/phfw.mjs`, source maps,
and `dist/types/` declarations. Existing Node native TypeScript module-format
warnings remain; no dependency or package version changed for this addition.

The review gates for this API are scheduling and ownership review, audible playback
in a host application, and the documented browser support matrix. A successful
offline graph construction check does not establish those runtime behaviors.
