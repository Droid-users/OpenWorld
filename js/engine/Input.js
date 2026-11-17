// Input Manager - Keyboard, Mouse Look, Pointer Lock & Touch
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.lastMouse = { x: 0, y: 0 };
        this.callbacks = {};

        this.setupKeyboard();
        this.setupMouse();
    }

    on(event, cb) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb);
    }

    emit(event, payload) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(payload));
        }
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            this.keys[e.code] = true;

            // Trigger single action events
            if (e.key === 'e' || e.key === 'E') this.emit('interact');
            if (e.key === 'f' || e.key === 'F') this.emit('mountToggle');
            if (e.key === 'l' || e.key === 'L') this.emit('lightToggle');
            if (e.key === 'b' || e.key === 'B') this.emit('bell');
            if (e.key === 'j' || e.key === 'J') this.emit('hop');
            if (e.key === 'm' || e.key === 'M') this.emit('mapToggle');
            if (e.key === 'i' || e.key === 'I') this.emit('inventoryToggle');
            if (e.key === 'q' || e.key === 'Q') this.emit('journalToggle');
            if (e.key === 'Escape') this.emit('pauseToggle');

            // Gear shifting (1-5)
            if (['1', '2', '3', '4', '5'].includes(e.key)) {
                this.emit('gearChange', parseInt(e.key, 10));
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            this.keys[e.code] = false;
        });
    }

    setupMouse() {
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            } else if (this.isMouseDown) {
                this.mouseDelta.x += e.clientX - this.lastMouse.x;
                this.mouseDelta.y += e.clientY - this.lastMouse.y;
                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'CANVAS') {
                this.isMouseDown = true;
                this.lastMouse.x = e.clientX;
                this.lastMouse.y = e.clientY;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    }

    requestPointerLock(element) {
        if (!this.isPointerLocked && element.requestPointerLock) {
            try {
                element.requestPointerLock();
            } catch (err) {
                // Ignore silent browser restrictions
            }
        }
    }

    exitPointerLock() {
        if (document.pointerLockElement && document.exitPointerLock) {
            document.exitPointerLock();
        }
    }

    get forward() {
        return !!(this.keys['w'] || this.keys['arrowup'] || this.keys['KeyW']);
    }

    get backward() {
        return !!(this.keys['s'] || this.keys['arrowdown'] || this.keys['KeyS']);
    }

    get left() {
        return !!(this.keys['a'] || this.keys['arrowleft'] || this.keys['KeyA']);
    }

    get right() {
        return !!(this.keys['d'] || this.keys['arrowright'] || this.keys['KeyD']);
    }

    get sprint() {
        return !!(this.keys['shift'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    }

    get brake() {
        return !!(this.keys[' '] || this.keys['Space']);
    }

    consumeMouseDelta() {
        const delta = { x: this.mouseDelta.x, y: this.mouseDelta.y };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return delta;
    }
}
