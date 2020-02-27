
export class EventEmitter {
    _events: any;
 
    constructor() {
        this._events = {};
    }

    on(type: string, callback: Function): void {
        let listeners: Function[] = this._events[type];
        if (!listeners) {
            listeners = [];
            this._events[type] = listeners;
        }
        for (let i: number = 0; i < listeners.length; ++i) {
            if (listeners[i] === callback) return;
        }
        listeners.push(callback);
    }

    off(type: string, callback: Function): void {
        const listeners: Function[] = this._events[type];
        if (!listeners) return;
        for (let i: number = listeners.length; i >= 0; --i) {
            if (listeners[i] === callback) {
                listeners.splice(i, 1);
                return;
            }
        }
    }

    fire(type: string, data: Object): void {
        const listeners: Function[] = this._events[type];
        if (!listeners) return;
        listeners.forEach((callback) => {
            callback({ ...data, ...{
                type: type,
                target: this
            }});
        });
    }
}