type Data = {
  [key: string]: unknown;
};

type EventCallback = (
  event: Data & {
    type: string;
    target: unknown;
  },
) => void;

export class EventEmitter {
  private _events: Map<string, EventCallback[]>;

  constructor() {
    this._events = new Map();
  }

  on(type: string, callback: EventCallback): void {
    let listeners = this._events.get(type);
    if (!listeners) {
      listeners = [];
      this._events.set(type, listeners);
    }
    for (let i = 0; i < listeners.length; ++i) {
      if (listeners[i] === callback) return;
    }
    listeners.push(callback);
  }

  off(type: string, callback: EventCallback): void {
    const listeners = this._events.get(type);
    if (!listeners) return;
    for (let i: number = listeners.length - 1; i >= 0; --i) {
      if (listeners[i] === callback) {
        listeners.splice(i, 1);
        if (listeners.length === 0) {
          this._events.delete(type);
        }
        return;
      }
    }
  }

  fire(type: string, data: Data): void {
    const listeners = this._events.get(type);
    if (!listeners) return;
    listeners.forEach(callback => {
      callback({
        ...data,
        type: type,
        target: this,
      });
    });
  }
}
