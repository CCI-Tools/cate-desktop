const _DEBUG_WEB_SOCKET_RPC = false;

export type MplFigureMessageCallback = (message: string) => any;
export type MplFigureCommandData = {name: string};
export type MplFigureCommandListener = (figureId: number, commandData: MplFigureCommandData) => void;

/**
 * A source for figure commands.
 */
export interface MplFigureCommandSource {
    addCommandListener(figureId: number, listener: MplFigureCommandListener): void;
    removeCommandListener(figureId: number, listener: MplFigureCommandListener): void;
    removeCommandListeners(figureId: number): void;
}

/**
 * Default impl. of MplFigureCommandSource interface
 */
export class MplFigureCommandSourceImpl implements MplFigureCommandSource {
    private listenersMap: {[id: number]: Set<MplFigureCommandListener>};

    constructor() {
        this.listenersMap = {};
        this.dispatchCommand = this.dispatchCommand.bind(this);
    }

    addCommandListener(figureId: number, listener: MplFigureCommandListener): void {
        let listeners = this.listenersMap[figureId];
        if (!listeners) {
            listeners = new Set<MplFigureCommandListener>();
            this.listenersMap[figureId] = listeners;
        }
        listeners.add(listener);
        // console.log('MplFigureCommandSourceImpl.addCommandListener', figureId, listener);
    }

    removeCommandListener(figureId: number, listener: MplFigureCommandListener): void {
        // console.log('MplFigureCommandSourceImpl.removeCommandListener', figureId, listener);
        const listeners = this.listenersMap[figureId];
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size == 0) {
                delete this.listenersMap[figureId];
            }
        }
    }

    removeCommandListeners(figureId: number): void {
        // console.log('MplFigureCommandSourceImpl.removeCommandListeners', figureId);
        delete this.listenersMap[figureId];
    }

    dispatchCommand(figureId: number, commandData: MplFigureCommandData) {
        const listeners = this.listenersMap[figureId];
        if (listeners) {
            for (let listener of listeners) {
                listener(figureId, commandData);
            }
        }
    }
}

/**
 * Represents a figure in matplotlib's web backend.
 * This class is a port of "mpl.js" from matplotlib's web_agg.
 *
 * @author Norman Fomferra
 */
export class MplFigure {

    readonly id: number;
    private webSocket: WebSocket;
    private commandSource?: MplFigureCommandSource;
    private onMessage?: MplFigureMessageCallback;
    private parentElement: HTMLDivElement;
    private figureImageCanvas: HTMLCanvasElement;
    private rubberBandCanvas: HTMLCanvasElement;
    private imageObj: any;
    private imageMode: string;
    private waiting: boolean;
    private lastKey: number | null;
    private resizeTimer: number | null;
    private lastSize: {width: number; height: number};

    constructor(figureId: number,
                webSocketUrl: string,
                parentElement: HTMLDivElement,
                commandSource?: MplFigureCommandSource,
                onMessage?: MplFigureMessageCallback) {

        this.id = figureId;
        this.parentElement = parentElement;
        this.commandSource = commandSource;
        this.onMessage = onMessage;
        this.imageMode = 'full';
        this.imageObj = new Image();
        this.lastSize = {width: 0, height: 0};

        this.handleCommand = this.handleCommand.bind(this);
        this.processMessage = this.processMessage.bind(this);

        this.initCanvas();

        this.waiting = false;

        this.imageObj.onload = () => {
            const canvasContext = this.figureImageCanvas.getContext("2d");
            if (this.imageMode == 'full') {
                // Full images could contain transparency (where diff images
                // almost always do), so we need to clear the canvas so that
                // there is no ghosting.
                canvasContext.clearRect(0, 0, this.figureImageCanvas.width, this.figureImageCanvas.height);
            }
            canvasContext.drawImage(this.imageObj, 0, 0);
        };

        this.imageObj.onunload = function () {
            this.webSocket.removeEventListener('message', this.processMessage);
        };

        this.webSocket = new WebSocket(webSocketUrl);
        this.webSocket.onopen = () => {
            if (this.commandSource) {
                this.commandSource.addCommandListener(this.id, this.handleCommand);
            }

            this.webSocket.addEventListener('message', this.processMessage);
            const supportsBinary = !!this.webSocket.binaryType;
            if (!supportsBinary) {
                console.warn("This browser does not support binary websocket messages. " +
                             "Figure update performance may be slow.");
            }
            this.sendMessage("supports_binary", {value: supportsBinary});
            this.sendMessage("send_image_mode");
            this.sendRefresh();
            this.sendResize();

            this.resizeTimer = window.setInterval(() => {
                const width = this.parentElement.clientWidth;
                const height = this.parentElement.clientHeight;
                const validSize = width > 0 && height > 0;
                const sizeChange = this.lastSize.width !== width || this.lastSize.height !== height;
                if (validSize && sizeChange) {
                    this.lastSize = {width, height};
                    this.sendResize(width, height);
                }
            }, 500);
        };

        this.webSocket.onclose = () => {
            if (this.commandSource) {
                this.commandSource.removeCommandListener(this.id, this.handleCommand);
            }
            if (this.resizeTimer) {
                window.clearInterval(this.resizeTimer);
            }
        };
    }

    /**
     * Calls a command on this figure.
     *
     * @param figureId An object that must have a property "name" of type string.
     * @param commandData An object that must have a property "name" of type string.
     */
    private handleCommand(figureId: number, commandData: MplFigureCommandData): void {
        if (figureId === this.id) {
            this.sendMessage("toolbar_button", commandData);
        } else {
            console.warn(`received invalid figure ID: expected #${this.id}, got #${figureId} for data ${commandData}`);
        }
    }

    private initCanvas() {
        const handleKeyboardEvent = this.handleKeyboardEvent.bind(this);
        this.parentElement.onkeydown = wrapEvent('key_press', handleKeyboardEvent);
        this.parentElement.onkeyup = wrapEvent('key_release', handleKeyboardEvent);
        this.parentElement.onwheel = (event: WheelEvent) => {
            const name = 'scroll';
            const step = (event.deltaY < 0) ? 1 : -1;
            this.handleMouseEvent(event, {name, step});
        };

        const figureImageCanvas = document.createElement('canvas');
        figureImageCanvas.id = 'mpl-figure-image-' + this.id;
        figureImageCanvas.setAttribute('style', "left: 0; top: 0; z-index: 0; outline: 0");
        this.figureImageCanvas = figureImageCanvas;

        const rubberBandCanvas = document.createElement('canvas');
        rubberBandCanvas.id = 'mpl-rubber-band-' + this.id;
        rubberBandCanvas.setAttribute('style', "position: absolute; left: 0; top: 0; z-index: 1;");
        const handleMouseEvent = this.handleMouseEvent.bind(this);
        rubberBandCanvas.onmousedown = wrapEvent('button_press', handleMouseEvent);
        rubberBandCanvas.onmouseup = wrapEvent('button_release', handleMouseEvent);
        rubberBandCanvas.onmousemove = wrapEvent('motion_notify', handleMouseEvent);
        rubberBandCanvas.onmouseenter = wrapEvent('figure_enter', handleMouseEvent);
        rubberBandCanvas.onmouseleave = wrapEvent('figure_leave', handleMouseEvent);
        const rubberBandContext = rubberBandCanvas.getContext("2d");
        rubberBandContext.strokeStyle = "#000000";
        this.rubberBandCanvas = rubberBandCanvas;

        this.parentElement.appendChild(figureImageCanvas);
        this.parentElement.appendChild(rubberBandCanvas);
    }

    private resizeCanvas(width, height) {
        // Keep the size of the figure image canvas and rubber band canvas in sync.
        this.figureImageCanvas.setAttribute('width', width);
        this.figureImageCanvas.setAttribute('height', height);
        this.rubberBandCanvas.setAttribute('width', width);
        this.rubberBandCanvas.setAttribute('height', height);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Outgoing messages

    sendResize(width?: number, height?: number) {
        width = width || this.parentElement.clientWidth;
        height = height || this.parentElement.clientHeight;
        // Request matplotlib to resize the figure. Matplotlib will then trigger a resize in the client,
        // which will in turn request a refresh of the image.
        this.sendMessage('resize', {width, height});
    }

    sendDrawMessage() {
        if (!this.waiting) {
            this.waiting = true;
            this.sendMessage('draw');
        }
    }

    sendRefresh() {
        this.sendMessage("refresh");
    }

    sendCanvasUpdated() {
        // Called whenever the canvas gets updated.
        this.sendMessage("ack");
    }

    sendMessage(type: string, properties?: any) {
        const jsonText = JSON.stringify({...properties, type, figure_id: this.id});
        if (_DEBUG_WEB_SOCKET_RPC) {
            console.log(`MplFigure.sendMessage: ${jsonText}`);
        }
        this.webSocket.send(jsonText);
    }

    // Outgoing messages
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * Process incoming WebSocket messages.
     *
     * @param evt The WebSocket message event
     */
    private processMessage(evt: MessageEvent) {
        // console.log(`MplFigure.processMessage: ${evt.data}`);
        if (evt.data instanceof Blob) {
            const blobData = evt.data as any;

            /* Free the memory for the previous frames */
            if (this.imageObj.src) {
                (window.URL || window['webkitURL']).revokeObjectURL(this.imageObj.src);
            }

            this.imageObj.src = (window.URL || window['webkitURL']).createObjectURL(blobData);
            this.sendCanvasUpdated();
            this.waiting = false;
            return;
        } else if (typeof evt.data === 'string' && evt.data.slice(0, 21) == "data:image/png;base64") {
            this.imageObj.src = evt.data;
            this.sendCanvasUpdated();
            this.waiting = false;
            return;
        }

        const jsonText = evt.data;
        const msg = JSON.parse(jsonText);
        const msgType = msg['type'];

        // Call the  "handle_${msgType}" callback, which takes
        // the JSON message as its only argument.
        try {
            const callback = this["handle_" + msgType];
            if (callback) {
                try {
                    // console.log(`Calling: handle_${msg_type}(${jsonText})`);
                    callback.bind(this)(msg);
                } catch (e) {
                    console.error("Exception inside the 'handler_" + msgType + "' callback:", e, e.stack, msg);
                }
            }
        } catch (e) {
            console.error("No handler for the '" + msgType + "' message type: ", msg);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Handlers for incoming messages

    //noinspection JSUnusedLocalSymbols
    private handle_resize(msg) {
        const size = msg['size'];
        if (size[0] !== this.figureImageCanvas.width || size[1] !== this.figureImageCanvas.height) {
            this.resizeCanvas(size[0], size[1]);
            this.sendRefresh();
        }
    }

    //noinspection JSUnusedLocalSymbols
    private handle_rubberband(msg) {
        let x0 = msg['x0'];
        let y0 = this.figureImageCanvas.height - msg['y0'];
        let x1 = msg['x1'];
        let y1 = this.figureImageCanvas.height - msg['y1'];
        x0 = Math.floor(x0) + 0.5;
        //noinspection JSSuspiciousNameCombination
        y0 = Math.floor(y0) + 0.5;
        x1 = Math.floor(x1) + 0.5;
        //noinspection JSSuspiciousNameCombination
        y1 = Math.floor(y1) + 0.5;
        const xMin = Math.min(x0, x1);
        const yMin = Math.min(y0, y1);
        const width = Math.abs(x1 - x0);
        const height = Math.abs(y1 - y0);

        const rubberBandCanvasContext = this.rubberBandCanvas.getContext("2d");
        rubberBandCanvasContext.clearRect(0, 0, this.figureImageCanvas.width, this.figureImageCanvas.height);
        rubberBandCanvasContext.strokeRect(xMin, yMin, width, height);
    }

    //noinspection JSUnusedLocalSymbols
    private handle_figure_label(msg) {
        // console.warn(`MplFigure.handle_figure_label() - unhandled, figure #${this.id}`, msg);
    }

    //noinspection JSUnusedLocalSymbols
    private handle_message(msg) {
        if (this.onMessage) {
            this.onMessage(msg['message']);
        }
    }

    //noinspection JSUnusedLocalSymbols
    private handle_cursor(msg) {
        const cursor = msg['cursor'];
        this.rubberBandCanvas.style.cursor = {0: 'pointer', 1: 'default', 2: 'crosshair', 3: 'move'}[cursor];
    }

    //noinspection JSUnusedLocalSymbols
    private handle_draw() {
        // Request the server to send over a new figure.
        this.sendDrawMessage();
    }

    //noinspection JSUnusedLocalSymbols
    private handle_image_mode(msg) {
        this.imageMode = msg['mode'];
    }

    // Handlers for incoming messages
    ///////////////////////////////////////////////////////////////////////////////

    private handleMouseEvent(event: MouseEvent, extraData) {
        const name = extraData.name;
        const step = extraData.step;
        const canvas_pos = findpos(event);

        if (name === 'button_press') {
            this.figureImageCanvas.focus();
            this.parentElement.focus();
        }

        const x = canvas_pos.x;
        const y = canvas_pos.y;

        this.sendMessage(name, {
            x, y,
            button: event.button,
            step,
            guiEvent: simpleKeys(event)
        });

        /* This prevents the web browser from automatically changing to
         * the text insertion cursor when the button is pressed.  We want
         * to control all of the cursor setting manually through the
         * 'cursor' event from matplotlib */
        event.preventDefault();
        return false;
    }

    private handleKeyboardEvent(event: KeyboardEvent, extraData) {
        const name = extraData.name;

        // Prevent repeat events
        if (name == 'key_press') {
            if (event.which === this.lastKey)
                return;
            else
                this.lastKey = event.which;
        }
        if (name == 'key_release')
            this.lastKey = null;

        let value = '';
        if (event.ctrlKey && event.which != 17)
            value += "ctrl+";
        if (event.altKey && event.which != 18)
            value += "alt+";
        if (event.shiftKey && event.which != 16)
            value += "shift+";

        value += 'k';
        value += event.which.toString();

        this.sendMessage(name, {
            key: value,
            guiEvent: simpleKeys(event)
        });
    }
}


function wrapEvent<E extends Event>(name: string, callback: (event: E, userData: any) => void): (event: E) => void {
    return (event: E) => {
        callback(event, {name});
    };
}

// from http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
function findpos(e: MouseEvent) {
    //this section is from http://www.quirksmode.org/js/events_properties.html
    let targ;
    if (e.target)
        targ = e.target;
    else if (e.srcElement)
        targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;

    const bodyRect = document.body.getBoundingClientRect();
    const elemRect = targ.getBoundingClientRect();
    const offsetX = elemRect.left - bodyRect.left;
    const offsetY = elemRect.top - bodyRect.top;

    const x = e.pageX - offsetX;
    const y = e.pageY - offsetY;

    return {"x": x, "y": y};
}

/*
 * return a copy of an object with only non-object keys
 * we need this to avoid circular references
 * http://stackoverflow.com/a/24161582/3208463
 */
function simpleKeys(original) {
    return Object.keys(original).reduce(function (obj, key) {
        if (typeof original[key] !== 'object')
            obj[key] = original[key];
        return obj;
    }, {});
}
