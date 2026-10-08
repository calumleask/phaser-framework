const { document, Phaser, phfw } = globalThis;
const result = document.querySelector('#result');
let game;
let finished = false;
let stage = 'loading';

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function finish(error) {
  if (finished) return;
  finished = true;
  result.dataset.result = error ? 'fail' : 'pass';
  result.textContent = error
    ? String(error.stack || error)
    : 'Browser checks passed';
  if (game) game.destroy(true);
}

globalThis.addEventListener('error', event =>
  finish(event.error || event.message),
);
globalThis.addEventListener('unhandledrejection', event =>
  finish(event.reason),
);
globalThis.setTimeout(
  () => finish(new Error(`Browser fixture timed out at ${stage}`)),
  10000,
);

try {
  const framework = phfw?.default;
  check(Phaser?.Game && framework?.Scene, 'Package scripts did not load');
  check(
    framework.Scene.prototype instanceof Phaser.Scene,
    'Framework and host must use the same Phaser.Scene class',
  );

  let starts = 0;
  let shutdowns = 0;
  let selections = 0;
  let previousManager;
  let previousEvents;
  const scale = new framework.Core.GameScaleManager(320, 240, 1, 480, 240);

  const pause = ms =>
    new Promise(resolve => {
      globalThis.setTimeout(resolve, ms);
    });

  function sendKey(type) {
    globalThis.dispatchEvent(
      new globalThis.KeyboardEvent(type, {
        key: 'a',
        code: 'KeyA',
        keyCode: 65,
        which: 65,
        bubbles: true,
      }),
    );
    game.step(globalThis.performance.now(), 16);
  }

  function sendMouse(type, button) {
    const bounds = button.getBounds();
    const canvasBounds = game.canvas.getBoundingClientRect();
    const clientX =
      canvasBounds.left +
      (bounds.centerX / game.scale.width) * canvasBounds.width;
    const clientY =
      canvasBounds.top +
      (bounds.centerY / game.scale.height) * canvasBounds.height;
    game.canvas.dispatchEvent(
      new globalThis.MouseEvent(type, {
        bubbles: true,
        clientX,
        clientY,
        button: 0,
        buttons: type === 'mouseup' ? 0 : 1,
      }),
    );
  }

  async function exerciseFirstStart(scene) {
    stage = 'first scene wait';
    await pause(200);
    stage = 'first scene checks';
    check(game.renderer.type === Phaser.WEBGL, 'WebGL renderer did not start');
    check(
      scene.context?.scaling === undefined,
      'Initial scene unexpectedly has scaling context',
    );
    check(scene.button.width > 0, 'TextButton has no rendered width');
    check(scene.inputManager.getActivePointer() === scene.input.activePointer);

    stage = 'keyboard down';
    sendKey('keydown');
    await pause(80);
    stage = 'keyboard up';
    sendKey('keyup');
    await pause(80);
    stage = 'keyboard checks';
    check(scene.keyEvents.length === 2, 'Keyboard events were not delivered');
    check(scene.keyEvents[0].pressed, 'First keydown was not a press');
    check(scene.keyEvents[1].released, 'Keyup was not a release');

    stage = 'manager ownership';
    const keyboard = scene.input.keyboard;
    let outsideCalls = 0;
    const outsideHandler = () => outsideCalls++;
    keyboard.on('keydown-A', outsideHandler);
    const second = new framework.Input.InputManager({
      input: scene.input,
      keys: [{ key: 'A', name: 'action' }],
    });
    const secondEvents = [];
    second.on('action', event => secondEvents.push(event));
    check(
      keyboard.listenerCount('keydown-A') === 3,
      'Managers did not register separately',
    );
    sendKey('keydown');
    await pause(80);
    check(
      secondEvents.length === 1 && secondEvents[0].pressed,
      'Second manager missed keydown',
    );
    const outsideBeforeDispose = outsideCalls;
    second.dispose();
    second.dispose();
    check(
      keyboard.listenerCount('keydown-A') === 2,
      'Disposal removed another keyboard handler',
    );
    sendKey('keyup');
    await pause(80);
    check(secondEvents.length === 1, 'Disposed manager received keyup');
    check(scene.keyEvents.at(-1).released, 'Live manager lost keyup');
    sendKey('keydown');
    await pause(80);
    check(
      outsideCalls > outsideBeforeDispose,
      'Unowned keyboard handler was removed',
    );
    sendKey('keyup');
    await pause(80);
    keyboard.off('keydown-A', outsideHandler);

    stage = 'focus reset';
    sendKey('keydown');
    await pause(80);
    sendKey('keydown');
    await pause(80);
    check(scene.keyEvents.at(-2).pressed, 'Fresh keydown was not pressed');
    check(!scene.keyEvents.at(-1).pressed, 'Repeated keydown was pressed');
    game.events.emit('blur');
    check(scene.resetEvents.length === 1, 'Focus loss did not notify reset');
    check(scene.resetEvents[0].reason === 'blur', 'Reset reason changed');
    check(
      scene.resetEvents[0].codes.join(',') === 'KeyA',
      'Reset codes changed',
    );
    check(!('event' in scene.resetEvents[0]), 'Blur invented a keyboard event');
    game.events.emit('focus');
    const eventsBeforeRefocus = scene.keyEvents.length;
    sendKey('keydown');
    await pause(80);
    check(
      scene.keyEvents.length === eventsBeforeRefocus + 1 &&
        scene.keyEvents.at(-1).pressed,
      `Focus loss left stale held key: before=${eventsBeforeRefocus}, after=${scene.keyEvents.length}, pressed=${scene.keyEvents.at(-1).pressed}`,
    );
    sendKey('keyup');
    await pause(80);
    check(
      scene.keyEvents.at(-1).released,
      'Keyup after focus reset was not released',
    );

    stage = 'keyboard unavailable';
    const pointerOnly = new framework.Input.InputManager({
      input: {
        scene,
        keyboard: null,
        activePointer: scene.input.activePointer,
      },
      keys: [{ key: 'A', name: 'action' }],
    });
    check(
      pointerOnly.getActivePointer() === scene.input.activePointer,
      'Pointer-only manager failed',
    );
    pointerOnly.dispose();

    stage = 'pointer move';
    sendMouse('mousemove', scene.button);
    await pause(80);
    stage = 'pointer down';
    sendMouse('mousedown', scene.button);
    await pause(80);
    stage = 'pointer up';
    sendMouse('mouseup', scene.button);
    await pause(80);
    stage = 'pointer checks';
    check(selections === 1, 'Pointer click did not select TextButton once');

    stage = 'restart requested';
    sendKey('keydown');
    await pause(80);
    previousManager = scene.inputManager;
    previousEvents = scene.keyEvents;
    scene.scene.restart({ scaling: scale });
    // Headless virtual time may not schedule another animation frame.
    game.step(globalThis.performance.now(), 16);
  }

  async function exerciseRestart(scene) {
    stage = 'restart wait';
    await pause(200);
    stage = 'restart checks';
    check(starts === 2 && shutdowns === 1, 'Scene restart lifecycle mismatch');
    check(
      scene.context?.scaling === scale,
      'Restart context was not delivered',
    );
    check(
      scene.input.keyboard.listenerCount('keydown-A') === 1,
      'Keyboard listener duplicated after restart',
    );
    const oldEventCount = previousEvents.length;
    previousManager.onKeyDown(
      new globalThis.KeyboardEvent('keydown', { code: 'KeyA' }),
      'action',
    );
    check(
      previousEvents.length === oldEventCount,
      'Shutdown manager still emitted events',
    );
    sendKey('keydown');
    await pause(80);
    check(
      scene.keyEvents.length === 1 && scene.keyEvents[0].pressed,
      'Restart left stale held key',
    );

    stage = 'resize requested';
    game.scale.resize(400, 300);
    await pause(80);
    stage = 'resize checks';
    check(game.scale.width === 400, 'Host resize did not apply');
    const resizedScale = new framework.Core.GameScaleManager(
      400,
      300,
      1,
      600,
      300,
    );
    check(
      resizedScale.gameUnitToPixel(1) === 1,
      'Scale helper conversion changed',
    );
    finish();
  }

  class ConsumerScene extends framework.Scene {
    constructor() {
      super('consumer');
    }

    init(data) {
      super.init(data);
      starts++;
    }

    create() {
      stage = `scene create ${starts}`;
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        shutdowns++;
      });
      this.button = new framework.Objects.TextButton(this, 40, 40, 'Select', {
        textColor: '#ffffff',
        downTextColor: '#ffcc00',
      });
      this.add.existing(this.button);
      this.button.onSelect = () => {
        selections++;
      };
      this.keyEvents = [];
      this.resetEvents = [];
      this.inputManager = new framework.Input.InputManager({
        input: this.input,
        keys: [{ key: 'A', name: 'action' }],
      });
      this.inputManager.on('action', event => this.keyEvents.push(event));
      this.inputManager.on('input:reset', event =>
        this.resetEvents.push(event),
      );
      if (starts === 1) {
        void exerciseFirstStart(this).catch(finish);
      } else {
        void exerciseRestart(this).catch(finish);
      }
    }
  }

  game = new Phaser.Game({
    type: Phaser.WEBGL,
    width: 320,
    height: 240,
    parent: 'game',
    scene: ConsumerScene,
  });
} catch (error) {
  finish(error);
}
