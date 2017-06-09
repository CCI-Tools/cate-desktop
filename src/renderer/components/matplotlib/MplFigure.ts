const _DEBUG_WEB_SOCKET_RPC = false;

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
        console.log('MplFigureCommandSourceImpl.addCommandListener', figureId, listener);
    }

    removeCommandListener(figureId: number, listener: MplFigureCommandListener): void {
        console.log('MplFigureCommandSourceImpl.removeCommandListener', figureId, listener);
        const listeners = this.listenersMap[figureId];
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size == 0) {
                delete this.listenersMap[figureId];
            }
        }
    }

    removeCommandListeners(figureId: number): void {
        console.log('MplFigureCommandSourceImpl.removeCommandListeners', figureId);
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
    private root: HTMLElement;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private rubberBandCanvas: HTMLCanvasElement;
    private rubberBandContext: CanvasRenderingContext2D;
    private canvasDiv: HTMLDivElement;
    private supports_binary: boolean;
    private imageObj: any;
    private imageMode: string;
    private waiting: boolean;
    private lastKey: number | null;

    constructor(figureId: number, webSocketUrl: string, parentElement: HTMLElement, commandSource?: MplFigureCommandSource) {

        this.id = figureId;
        this.root = parentElement;
        this.commandSource = commandSource;
        this.imageMode = 'full';
        this.imageObj = new Image();

        this.initCanvas();

        this.waiting = false;

        this.imageObj.onload = () => {
            if (this.imageMode == 'full') {
                // Full images could contain transparency (where diff images
                // almost always do), so we need to clear the canvas so that
                // there is no ghosting.
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
            this.context.drawImage(this.imageObj, 0, 0);
        };

        const handleWebSocketMessage = this.processMessage.bind(this);
        this.imageObj.onunload = function () {
            this.webSocket.removeEventListener('message', handleWebSocketMessage);
        };

        this.webSocket = new WebSocket(webSocketUrl);
        this.webSocket.onopen = () => {
            this.webSocket.addEventListener('message', handleWebSocketMessage);

            const supports_binary = !!this.webSocket.binaryType;
            if (!supports_binary) {
                const warnings = document.getElementById("mpl-warnings");
                if (warnings) {
                    warnings.style.display = 'block';
                    warnings.textContent = (
                    "This browser does not support binary websocket messages. " +
                    "Figure update performance may be slow.");
                }
            }
            this.sendMessage("supports_binary", {value: supports_binary});
            this.sendMessage("send_image_mode");
            this.sendMessage("refresh");
            this.sendResize(this.root.clientWidth, this.root.clientHeight);
            if (this.commandSource) {
                const commandListener = this.handleCommand.bind(this);
                this.commandSource.addCommandListener(this.id, commandListener);
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
        const canvasDiv = document.createElement('div') as HTMLDivElement;
        canvasDiv.setAttribute('style', 'position: relative; clear: both; outline: 0');

        const handleKeyboardEvent = this.handleKeyboardEvent.bind(this);
        canvasDiv.onkeydown = wrapEvent('key_press', handleKeyboardEvent);
        canvasDiv.onkeyup = wrapEvent('key_release', handleKeyboardEvent);
        this.canvasDiv = canvasDiv;
        this.root.appendChild(canvasDiv);

        const canvas = document.createElement('canvas');
        canvas.className = 'mpl-canvas';
        canvas.setAttribute('style', "left: 0; top: 0; z-index: 0; outline: 0");

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        const rubberBand = document.createElement('canvas');
        rubberBand.setAttribute('style', "position: absolute; left: 0; top: 0; z-index: 1;");

        // TODO (forman): translate the below.
        //                see https://codepen.io/adammertel/pen/yyzPrj
        //                see http://www.coffeegnome.net/draggable-resizable-without-jqueryui/
        // canvas_div.resizable({
        //     start: function(event, ui) {
        //         pass_mouse_events = false;
        //     },
        //     resize: function(event, ui) {
        //         fig.request_resize(ui.size.width, ui.size.height);
        //     },
        //     stop: function(event, ui) {
        //         pass_mouse_events = true;
        //         fig.request_resize(ui.size.width, ui.size.height);
        //     },
        // });

        const handleMouseEvent = this.handleMouseEvent.bind(this);

        rubberBand.onmousedown = wrapEvent('button_press', handleMouseEvent);
        rubberBand.onmouseup = wrapEvent('button_release', handleMouseEvent);
        // Throttle sequential mouse events to 1 every 20ms.
        rubberBand.onmousemove = wrapEvent('motion_notify', handleMouseEvent);

        rubberBand.onmouseenter = wrapEvent('figure_enter', handleMouseEvent);
        rubberBand.onmouseleave = wrapEvent('figure_leave', handleMouseEvent);

        canvasDiv.onwheel = (event: WheelEvent) => {
            //event = event.originalEvent;
            const name = 'scroll';
            let step;
            if (event.deltaY < 0) {
                step = 1;
            } else {
                step = -1;
            }
            this.handleMouseEvent(event, {name, step});
        };

        canvasDiv.appendChild(canvas);
        canvasDiv.appendChild(rubberBand);

        this.rubberBandCanvas = rubberBand;
        this.rubberBandContext = rubberBand.getContext("2d");
        this.rubberBandContext.strokeStyle = "#000000";

        // Set the figure to an initial 600x600px, this will subsequently be updated
        // upon first draw.
        this.resizeCanvas(600, 600);

        function setFocus() {
            canvas.focus();
            canvasDiv.focus();
        }

        window.setTimeout(setFocus, 100);
    }

    private resizeCanvas(width, height) {
        // Keep the size of the canvas, canvas container, and rubber band
        // canvas in sync.
        this.canvasDiv.style.width = width;
        this.canvasDiv.style.height = height;

        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);

        this.rubberBandCanvas.setAttribute('width', width);
        this.rubberBandCanvas.setAttribute('height', height);
    };

    ///////////////////////////////////////////////////////////////////////////////
    // Outgoing messages

    //noinspection JSUnusedGlobalSymbols
    sendResize(width, height) {
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
        const msg_type = msg['type'];

        // Call the  "handle_{type}" callback, which takes
        // the JSON message as its only argument.
        try {
            const callback = this["handle_" + msg_type];
            if (callback) {
                try {
                    // console.log(`Calling: handle_${msg_type}(${jsonText})`);
                    callback.bind(this)(msg);
                } catch (e) {
                    console.error("Exception inside the 'handler_" + msg_type + "' callback:", e, e.stack, msg);
                }
            }
        } catch (e) {
            console.error("No handler for the '" + msg_type + "' message type: ", msg);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Handlers for incoming messages

    //noinspection JSUnusedLocalSymbols
    private handle_resize(msg) {
        const size = msg['size'];
        if (size[0] != this.canvas.width || size[1] != this.canvas.height) {
            this.resizeCanvas(size[0], size[1]);
            this.sendMessage("refresh");
        }
    }

    //noinspection JSUnusedLocalSymbols
    private handle_rubberband(msg) {
        let x0 = msg['x0'];
        let y0 = this.canvas.height - msg['y0'];
        let x1 = msg['x1'];
        let y1 = this.canvas.height - msg['y1'];
        x0 = Math.floor(x0) + 0.5;
        //noinspection JSSuspiciousNameCombination
        y0 = Math.floor(y0) + 0.5;
        x1 = Math.floor(x1) + 0.5;
        //noinspection JSSuspiciousNameCombination
        y1 = Math.floor(y1) + 0.5;
        const min_x = Math.min(x0, x1);
        const min_y = Math.min(y0, y1);
        const width = Math.abs(x1 - x0);
        const height = Math.abs(y1 - y0);

        this.rubberBandContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.rubberBandContext.strokeRect(min_x, min_y, width, height);
    }

    //noinspection JSUnusedLocalSymbols
    private handle_figure_label(msg) {
        // Updates the figure title.
        //this.header.textContent = msg['label'];
    }

    //noinspection JSUnusedLocalSymbols
    private handle_message(msg) {
        //this.message.textContent = msg['message'];
    }

    //noinspection JSUnusedLocalSymbols
    private handle_cursor(msg) {
        let cursor = msg['cursor'];
        switch (cursor) {
            case 0:
                cursor = 'pointer';
                break;
            case 1:
                cursor = 'default';
                break;
            case 2:
                cursor = 'crosshair';
                break;
            case 3:
                cursor = 'move';
                break;
        }
        this.rubberBandCanvas.style.cursor = cursor;
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
            this.canvas.focus();
            this.canvasDiv.focus();
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
