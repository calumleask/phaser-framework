
type Data = {
    [key: string]: unknown;
};

type EventCallback = (event: Data & {
    type: string;
    target: unknown;
}) => void;

type EventsObject = { [type: string]: EventCallback[] };

export class EventEmitter {
    private _events: EventsObject;
 
    constructor() {
        this._events = {};
    }

    on(type: string, callback: EventCallback): void {
        let listeners: EventCallback[] = this._events[type];
        if (!listeners) {
            listeners = [];
            this._events[type] = listeners;
        }
        for (let i = 0; i < listeners.length; ++i) {
            if (listeners[i] === callback) return;
        }
        listeners.push(callback);
    }

    off(type: string, callback: EventCallback): void {
        const listeners: EventCallback[] = this._events[type];
        if (!listeners) return;
        for (let i: number = listeners.length; i >= 0; --i) {
            if (listeners[i] === callback) {
                listeners.splice(i, 1);
                return;
            }
        }
    }

    fire(type: string, data: Data): void {
        const listeners: EventCallback[] = this._events[type];
        if (!listeners) return;
        listeners.forEach((callback) => {
            callback({
                ...data,
                type: type,
                target: this
            });
        });
    }
}
