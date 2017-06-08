/* IMPORTANT NOTE: This file is a port of mpl.js from matplotlib's web_agg. */

export type DownloadCallback = (figure: MplFigure, format: string) => any;

const TOOLBAR_ITEMS = [
    ["Home", "Reset original view", "ui-icon ui-icon-home", "home"],
    ["Back", "Back to  previous view", "ui-icon ui-icon-circle-arrow-w", "back"],
    ["Forward", "Forward to next view", "ui-icon ui-icon-circle-arrow-e", "forward"],
    ["", "", "", ""],
    ["Pan", "Pan axes with left mouse, zoom with right", "ui-icon ui-icon-arrow-4", "pan"],
    ["Zoom", "Zoom to rectangle", "ui-icon ui-icon-search", "zoom"],
    ["", "", "", ""],
    ["Download", "Download plot", "ui-icon ui-icon-disk", "download"]];

const EXTENSIONS = ["eps", "jpeg", "pdf", "png", "ps", "raw", "svg", "tif"];

const DEFAULT_EXTENSION = "png";


export class MplFigure {

    readonly id: number;
    private webSocket: WebSocket;
    private supports_binary: boolean;
    private imageObj: any;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private canvas_div: HTMLDivElement;
    private message: HTMLSpanElement;
    private rubberband_canvas: HTMLCanvasElement;
    private rubberband_context: CanvasRenderingContext2D;
    private format_dropdown: HTMLSelectElement;
    private image_mode: string;
    private root: HTMLDivElement;
    private waiting: boolean;
    private ondownload: DownloadCallback;
    private header: HTMLDivElement;
    private _key: number | null;
    private ready: boolean;

    constructor(figureId: number, webSocketUrl: string, downloadCallback: DownloadCallback, parentElement: HTMLElement) {

        this.id = figureId;
        this.ondownload = downloadCallback;
        this.image_mode = 'full';
        this.imageObj = new Image();

        // TODO (forman): this.root = parentElement;
        this.root = document.createElement('div') as HTMLDivElement;
        this.root.setAttribute('style', 'display: inline-block');

        parentElement.appendChild(this.root);

        this._init_header();
        this._init_canvas();
        this._init_toolbar();

        this.waiting = false;

        this.imageObj.onload = () => {
            if (this.image_mode == 'full') {
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
        };
    }

    private _init_header() {
        let titlebar = document.createElement('div') as HTMLDivElement;
        titlebar.className = "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix";
        titlebar.setAttribute('style', "width: 100%; text-align: center; padding: 3px;");
        let titletext = document.createElement('div') as HTMLDivElement;
        titletext.className = "ui-dialog-title";
        titletext.setAttribute('style', "width: 100%; text-align: center; padding: 3px;");
        titlebar.appendChild(titletext);
        this.root.appendChild(titlebar);
        this.header = titletext;
    }

    private _init_canvas() {
        const canvas_div = document.createElement('div') as HTMLDivElement;
        canvas_div.setAttribute('style', 'position: relative; clear: both; outline: 0');

        const handleKeyboardEvent = this.handleKeyboardEvent.bind(this);
        canvas_div.onkeydown = wrapEvent('key_press', handleKeyboardEvent);
        canvas_div.onkeyup = wrapEvent('key_release', handleKeyboardEvent);
        this.canvas_div = canvas_div;
        this.root.appendChild(canvas_div);

        const canvas = document.createElement('canvas');
        canvas.className = 'mpl-canvas';
        canvas.setAttribute('style', "left: 0; top: 0; z-index: 0; outline: 0");

        this.canvas = canvas;
        this.context = canvas.getContext("2d");

        const rubberband = document.createElement('canvas');
        rubberband.setAttribute('style', "position: absolute; left: 0; top: 0; z-index: 1;");

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

        rubberband.onmousedown = wrapEvent('button_press', handleMouseEvent);
        rubberband.onmouseup = wrapEvent('button_release', handleMouseEvent);
        // Throttle sequential mouse events to 1 every 20ms.
        rubberband.onmousemove = wrapEvent('motion_notify', handleMouseEvent);

        rubberband.onmouseenter = wrapEvent('figure_enter', handleMouseEvent);
        rubberband.onmouseleave = wrapEvent('figure_leave', handleMouseEvent);

        canvas_div.onwheel = (event: WheelEvent) => {
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

        canvas_div.appendChild(canvas);
        canvas_div.appendChild(rubberband);

        this.rubberband_canvas = rubberband;
        this.rubberband_context = rubberband.getContext("2d");
        this.rubberband_context.strokeStyle = "#000000";

        // Set the figure to an initial 600x600px, this will subsequently be updated
        // upon first draw.
        this._resize_canvas(600, 600);

        // TODO (forman): translate the below
        // // Disable right mouse context menu.
        // $(this.rubberband_canvas).bind("contextmenu",function(e){
        //     return false;
        // });

        function set_focus() {
            canvas.focus();
            canvas_div.focus();
        }

        window.setTimeout(set_focus, 100);
    }

    private _resize_canvas(width, height) {
        // Keep the size of the canvas, canvas container, and rubber band
        // canvas in sync.
        this.canvas_div.style.width = width;
        this.canvas_div.style.height = height;

        this.canvas.setAttribute('width', width);
        this.canvas.setAttribute('height', height);

        this.rubberband_canvas.setAttribute('width', width);
        this.rubberband_canvas.setAttribute('height', height);
    };

    private _init_toolbar() {
        const nav_element = document.createElement('div') as HTMLDivElement;
        nav_element.setAttribute('style', 'width: 100%');
        this.root.appendChild(nav_element);

        const handleToolbarButtonClick = this.handleToolbarButtonClick.bind(this);
        const handleToolbarButtonMouseOver = this.handleToolbarButtonMouseOver.bind(this);

        for (let toolbar_ind in TOOLBAR_ITEMS) {
            //noinspection JSUnfilteredForInLoop
            let name = TOOLBAR_ITEMS[toolbar_ind][0];
            //noinspection JSUnfilteredForInLoop
            let tooltip = TOOLBAR_ITEMS[toolbar_ind][1];
            //noinspection JSUnfilteredForInLoop
            let image = TOOLBAR_ITEMS[toolbar_ind][2];
            //noinspection JSUnfilteredForInLoop
            let method_name = TOOLBAR_ITEMS[toolbar_ind][3];

            if (!name) {
                // put a spacer in here.
                continue;
            }
            let button = document.createElement('button') as HTMLButtonElement;
            button.className = 'ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only';
            button.setAttribute('role', 'button');
            button.setAttribute('aria-disabled', 'false');
            button.onclick = wrapEvent(method_name, handleToolbarButtonClick);
            button.onmouseover = wrapEvent(tooltip, handleToolbarButtonMouseOver);

            const icon_img = document.createElement('span') as HTMLSpanElement;
            icon_img.className = 'ui-button-icon-primary ui-icon ' + image + ' ui-corner-all';

            const tooltip_span = document.createElement('span') as HTMLSpanElement;
            tooltip_span.className = 'ui-button-text';
            tooltip_span.innerHTML = tooltip;

            button.appendChild(icon_img);
            button.appendChild(tooltip_span);

            nav_element.appendChild(button);
        }

        const fmt_picker_span = document.createElement('span') as HTMLSpanElement;

        const fmt_picker = document.createElement('select') as HTMLSelectElement;
        fmt_picker.className = 'mpl-toolbar-option ui-widget ui-widget-content';
        fmt_picker_span.appendChild(fmt_picker);
        nav_element.appendChild(fmt_picker_span);
        this.format_dropdown = fmt_picker;

        for (let ind in EXTENSIONS) {
            const fmt = EXTENSIONS[ind];
            const option = document.createElement('option') as HTMLOptionElement;
            option.setAttribute('selected', (fmt === DEFAULT_EXTENSION) + "");
            option.innerHTML = fmt;
            fmt_picker.appendChild(option)
        }

        // Add hover states to the ui-buttons
        const buttons = document.getElementsByClassName('ui-button') as HTMLCollectionOf<HTMLButtonElement>;
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons.item(i);
            button.onmouseenter = function () {
                button.classList.add("ui-state-hover");
            };
            button.onmouseleave = function () {
                button.classList.remove("ui-state-hover");
            };
        }

        const status_bar = document.createElement('span') as HTMLSpanElement;
        status_bar.className = "mpl-message";
        nav_element.appendChild(status_bar);
        this.message = status_bar;
    }

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
        console.log(`MplFigure.sendMessage: ${jsonText}`);
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

    //noinspection JSUnusedGlobalSymbols
    private handle_save() {
        const format_dropdown = this.format_dropdown;
        const format = format_dropdown.options[format_dropdown.selectedIndex].value;
        this.ondownload(this, format);
    }

    //noinspection JSUnusedGlobalSymbols
    private handle_resize(msg) {
        const size = msg['size'];
        if (size[0] != this.canvas.width || size[1] != this.canvas.height) {
            this._resize_canvas(size[0], size[1]);
            this.sendMessage("refresh");
        }
    }

    //noinspection JSUnusedGlobalSymbols
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

        this.rubberband_context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.rubberband_context.strokeRect(min_x, min_y, width, height);
    }

    //noinspection JSUnusedGlobalSymbols
    private handle_figure_label(msg) {
        // Updates the figure title.
        this.header.textContent = msg['label'];
    }

    //noinspection JSUnusedGlobalSymbols
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
        this.rubberband_canvas.style.cursor = cursor;
    }

    //noinspection JSUnusedGlobalSymbols
    private handle_message(msg) {
        this.message.textContent = msg['message'];
    }

    //noinspection JSUnusedGlobalSymbols
    private handle_draw() {
        // Request the server to send over a new figure.
        this.sendDrawMessage();
    }

    //noinspection JSUnusedGlobalSymbols
    private handle_image_mode(msg) {
        this.image_mode = msg['mode'];
    }

    // Handlers for incoming messages
    ///////////////////////////////////////////////////////////////////////////////

    private handleMouseEvent(event: MouseEvent, extraData) {
        const name = extraData.name;
        const step = extraData.step;
        const canvas_pos = findpos(event);

        if (name === 'button_press') {
            this.canvas.focus();
            this.canvas_div.focus();
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
            if (event.which === this._key)
                return;
            else
                this._key = event.which;
        }
        if (name == 'key_release')
            this._key = null;

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

    //noinspection JSUnusedLocalSymbols
    private handleToolbarButtonClick(event: MouseEvent, extraData) {
        if (extraData.name == 'download') {
            this.handle_save();
        } else {
            this.sendMessage("toolbar_button", extraData);
        }
    }

    //noinspection JSUnusedLocalSymbols
    private handleToolbarButtonMouseOver(event: MouseEvent, extraData) {
        this.message.textContent = extraData.name;
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
