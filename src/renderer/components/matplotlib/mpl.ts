/* Put everything inside the global mpl namespace */
const mpl = {} as any;
export default mpl;
let $;

mpl.get_websocket_type = function() {
    return WebSocket;
};

mpl.figure = function(figure_id, websocket, ondownload, parent_element) {
    this.id = figure_id;

    this.ws = websocket;

    this.supports_binary = (this.ws.binaryType != undefined);

    if (!this.supports_binary) {
        const warnings = document.getElementById("mpl-warnings");
        if (warnings) {
            warnings.style.display = 'block';
            warnings.textContent = (
            "This browser does not support binary websocket messages. " +
            "Performance may be slow.");
        }
    }

    this.imageObj = new Image();

    this.context = undefined;
    this.message = undefined;
    this.canvas = undefined;
    this.rubberband_canvas = undefined;
    this.rubberband_context = undefined;
    this.format_dropdown = undefined;

    this.image_mode = 'full';

    this.root = $('<div/>');
    this._root_extra_style(this.root);
    this.root.attr('style', 'display: inline-block');

    $(parent_element).append(this.root);

    this._init_header(this);
    this._init_canvas(this);
    this._init_toolbar(this);

    const fig = this;

    this.waiting = false;

    this.ws.onopen =  function () {
        fig.send_message("supports_binary", {value: fig.supports_binary});
        fig.send_message("send_image_mode", {});
        if (mpl.ratio != 1) {
            fig.send_message("set_dpi_ratio", {'dpi_ratio': mpl.ratio});
        }
        fig.send_message("refresh", {});
    };

    this.imageObj.onload = function() {
        if (fig.image_mode == 'full') {
            // Full images could contain transparency (where diff images
            // almost always do), so we need to clear the canvas so that
            // there is no ghosting.
            fig.context.clearRect(0, 0, fig.canvas.width, fig.canvas.height);
        }
        fig.context.drawImage(fig.imageObj, 0, 0);
    };

    this.imageObj.onunload = function() {
        fig.ws.close();
    };

    this.ws.onmessage = this._make_on_message_function(this);

    this.ondownload = ondownload;
};

mpl.figure.prototype._init_header = function() {
    const titlebar = $(
        '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ' +
        'ui-helper-clearfix"/>');
    const titletext = $(
        '<div class="ui-dialog-title" style="width: 100%; ' +
        'text-align: center; padding: 3px;"/>');
    titlebar.append(titletext);
    this.root.append(titlebar);
    this.header = titletext[0];
};



mpl.figure.prototype._canvas_extra_style = function(canvas_div) {

};


mpl.figure.prototype._root_extra_style = function(canvas_div) {

};

mpl.figure.prototype._init_canvas = function() {
    const fig = this;

    const canvas_div = $('<div/>');

    canvas_div.attr('style', 'position: relative; clear: both; outline: 0');

    function canvas_keyboard_event(event) {
        return fig.key_event(event, event['data']);
    }

    canvas_div.keydown('key_press', canvas_keyboard_event);
    canvas_div.keyup('key_release', canvas_keyboard_event);
    this.canvas_div = canvas_div;
    this._canvas_extra_style(canvas_div);
    this.root.append(canvas_div);

    const canvas = $('<canvas/>');
    canvas.addClass('mpl-canvas');
    canvas.attr('style', "left: 0; top: 0; z-index: 0; outline: 0");

    this.canvas = canvas[0];
    this.context = canvas[0].getContext("2d");

    const backingStore = this.context.backingStorePixelRatio ||
        this.context.webkitBackingStorePixelRatio ||
        this.context.mozBackingStorePixelRatio ||
        this.context.msBackingStorePixelRatio ||
        this.context.oBackingStorePixelRatio ||
        this.context.backingStorePixelRatio || 1;

    mpl.ratio = (window.devicePixelRatio || 1) / backingStore;

    const rubberband = $('<canvas/>');
    rubberband.attr('style', "position: absolute; left: 0; top: 0; z-index: 1;");

    let pass_mouse_events = true;

    canvas_div.resizable({
        start: function(event, ui) {
            pass_mouse_events = false;
        },
        resize: function(event, ui) {
            fig.request_resize(ui.size.width, ui.size.height);
        },
        stop: function(event, ui) {
            pass_mouse_events = true;
            fig.request_resize(ui.size.width, ui.size.height);
        },
    });

    function mouse_event_fn(event) {
        if (pass_mouse_events)
            return fig.mouse_event(event, event['data']);
    }

    rubberband.mousedown('button_press', mouse_event_fn);
    rubberband.mouseup('button_release', mouse_event_fn);
    // Throttle sequential mouse events to 1 every 20ms.
    rubberband.mousemove('motion_notify', mouse_event_fn);

    rubberband.mouseenter('figure_enter', mouse_event_fn);
    rubberband.mouseleave('figure_leave', mouse_event_fn);

    canvas_div.on("wheel", function (event) {
        event = event.originalEvent;
        event['data'] = 'scroll';
        if (event.deltaY < 0) {
            event.step = 1;
        } else {
            event.step = -1;
        }
        mouse_event_fn(event);
    });

    canvas_div.append(canvas);
    canvas_div.append(rubberband);

    this.rubberband = rubberband;
    this.rubberband_canvas = rubberband[0];
    this.rubberband_context = rubberband[0].getContext("2d");
    this.rubberband_context.strokeStyle = "#000000";

    this._resize_canvas = function(width, height) {
        // Keep the size of the canvas, canvas container, and rubber band
        // canvas in synch.
        canvas_div.css('width', width);
        canvas_div.css('height', height);

        canvas.attr('width', width * mpl.ratio);
        canvas.attr('height', height * mpl.ratio);
        canvas.attr('style', 'width: ' + width + 'px; height: ' + height + 'px;');

        rubberband.attr('width', width);
        rubberband.attr('height', height);
    };

    // Set the figure to an initial 600x600px, this will subsequently be updated
    // upon first draw.
    this._resize_canvas(600, 600);

    // Disable right mouse context menu.
    $(this.rubberband_canvas).bind("contextmenu",function(e){
        return false;
    });

    function set_focus () {
        canvas.focus();
        canvas_div.focus();
    }

    window.setTimeout(set_focus, 100);
};

mpl.figure.prototype._init_toolbar = function() {
    const fig = this;

    const nav_element = $('<div/>');
    nav_element.attr('style', 'width: 100%');
    this.root.append(nav_element);

    // Define a callback function for later on.
    function toolbar_event(event) {
        return fig.toolbar_button_onclick(event['data']);
    }
    function toolbar_mouse_event(event) {
        return fig.toolbar_button_onmouseover(event['data']);
    }

    for(let toolbar_ind in mpl.toolbar_items) {
        let name = mpl.toolbar_items[toolbar_ind][0];
        const tooltip = mpl.toolbar_items[toolbar_ind][1];
        const image = mpl.toolbar_items[toolbar_ind][2];
        const method_name = mpl.toolbar_items[toolbar_ind][3];

        if (!name) {
            // put a spacer in here.
            continue;
        }
        const button = $('<button/>');
        button.addClass('ui-button ui-widget ui-state-default ui-corner-all ' +
            'ui-button-icon-only');
        button.attr('role', 'button');
        button.attr('aria-disabled', 'false');
        button.click(method_name, toolbar_event);
        button.mouseover(tooltip, toolbar_mouse_event);

        const icon_img = $('<span/>');
        icon_img.addClass('ui-button-icon-primary ui-icon');
        icon_img.addClass(image);
        icon_img.addClass('ui-corner-all');

        const tooltip_span = $('<span/>');
        tooltip_span.addClass('ui-button-text');
        tooltip_span.html(tooltip);

        button.append(icon_img);
        button.append(tooltip_span);

        nav_element.append(button);
    }

    const fmt_picker_span = $('<span/>');

    const fmt_picker = $('<select/>');
    fmt_picker.addClass('mpl-toolbar-option ui-widget ui-widget-content');
    fmt_picker_span.append(fmt_picker);
    nav_element.append(fmt_picker_span);
    this.format_dropdown = fmt_picker[0];

    for (let ind in mpl.extensions) {
        const fmt = mpl.extensions[ind];
        const option = $(
            '<option/>', {selected: fmt === mpl.default_extension}).html(fmt);
        fmt_picker.append(option)
    }

    // Add hover states to the ui-buttons
    $( ".ui-button" ).hover(
        function() { $(this).addClass("ui-state-hover");},
        function() { $(this).removeClass("ui-state-hover");}
    );

    const status_bar = $('<span class="mpl-message"/>');
    nav_element.append(status_bar);
    this.message = status_bar[0];
};

mpl.figure.prototype.request_resize = function(x_pixels, y_pixels) {
    // Request matplotlib to resize the figure. Matplotlib will then trigger a resize in the client,
    // which will in turn request a refresh of the image.
    this.send_message('resize', {'width': x_pixels, 'height': y_pixels});
};

mpl.figure.prototype.send_message = function(type, properties) {
    properties['type'] = type;
    properties['figure_id'] = this.id;
    this.ws.send(JSON.stringify(properties));
};

mpl.figure.prototype.send_draw_message = function() {
    if (!this.waiting) {
        this.waiting = true;
        this.ws.send(JSON.stringify({type: "draw", figure_id: this.id}));
    }
};


mpl.figure.prototype.handle_save = function(fig, msg) {
    const format_dropdown = fig.format_dropdown;
    const format = format_dropdown.options[format_dropdown.selectedIndex].value;
    fig.ondownload(fig, format);
};


mpl.figure.prototype.handle_resize = function(fig, msg) {
    const size = msg['size'];
    if (size[0] != fig.canvas.width || size[1] != fig.canvas.height) {
        fig._resize_canvas(size[0], size[1]);
        fig.send_message("refresh", {});
    }
};

mpl.figure.prototype.handle_rubberband = function(fig, msg) {
    let x0 = msg['x0'] / mpl.ratio;
    let y0 = (fig.canvas.height - msg['y0']) / mpl.ratio;
    let x1 = msg['x1'] / mpl.ratio;
    let y1 = (fig.canvas.height - msg['y1']) / mpl.ratio;
    x0 = Math.floor(x0) + 0.5;
    y0 = Math.floor(y0) + 0.5;
    x1 = Math.floor(x1) + 0.5;
    y1 = Math.floor(y1) + 0.5;
    const min_x = Math.min(x0, x1);
    const min_y = Math.min(y0, y1);
    const width = Math.abs(x1 - x0);
    const height = Math.abs(y1 - y0);

    fig.rubberband_context.clearRect(
        0, 0, fig.canvas.width, fig.canvas.height);

    fig.rubberband_context.strokeRect(min_x, min_y, width, height);
};

mpl.figure.prototype.handle_figure_label = function(fig, msg) {
    // Updates the figure title.
    fig.header.textContent = msg['label'];
};

mpl.figure.prototype.handle_cursor = function(fig, msg) {
    let cursor = msg['cursor'];
    switch(cursor)
    {
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
    fig.rubberband_canvas.style.cursor = cursor;
};

mpl.figure.prototype.handle_message = function(fig, msg) {
    fig.message.textContent = msg['message'];
};

mpl.figure.prototype.handle_draw = function(fig, msg) {
    // Request the server to send over a new figure.
    fig.send_draw_message();
};

mpl.figure.prototype.handle_image_mode = function(fig, msg) {
    fig.image_mode = msg['mode'];
};

mpl.figure.prototype.updated_canvas_event = function() {
    // Called whenever the canvas gets updated.
    this.send_message("ack", {});
};

// A function to construct a web socket function for onmessage handling.
// Called in the figure constructor.
mpl.figure.prototype._make_on_message_function = function(fig) {
    return function socket_on_message(evt) {
        if (evt.data instanceof Blob) {
            /* FIXME: We get "Resource interpreted as Image but
             * transferred with MIME type text/plain:" errors on
             * Chrome.  But how to set the MIME type?  It doesn't seem
             * to be part of the websocket stream */
            evt.data.type = "image/png";

            /* Free the memory for the previous frames */
            if (fig.imageObj.src) {
                (window.URL || window['webkitURL']).revokeObjectURL(
                    fig.imageObj.src);
            }

            fig.imageObj.src = (window.URL || window['webkitURL']).createObjectURL(
                evt.data);
            fig.updated_canvas_event();
            fig.waiting = false;
            return;
        }
        else if (typeof evt.data === 'string' && evt.data.slice(0, 21) == "data:image/png;base64") {
            fig.imageObj.src = evt.data;
            fig.updated_canvas_event();
            fig.waiting = false;
            return;
        }

        const msg = JSON.parse(evt.data);
        const msg_type = msg['type'];

        // Call the  "handle_{type}" callback, which takes
        // the figure and JSON message as its only arguments.
        let callback;
        try {
            callback = fig["handle_" + msg_type];
        } catch (e) {
            console.log("No handler for the '" + msg_type + "' message type: ", msg);
            return;
        }

        if (callback) {
            try {
                // console.log("Handling '" + msg_type + "' message: ", msg);
                callback(fig, msg);
            } catch (e) {
                console.log("Exception inside the 'handler_" + msg_type + "' callback:", e, e.stack, msg);
            }
        }
    };
};

// from http://stackoverflow.com/questions/1114465/getting-mouse-location-in-canvas
mpl.findpos = function(e) {
    //this section is from http://www.quirksmode.org/js/events_properties.html
    let targ;
    if (!e)
        e = window.event;
    if (e.target)
        targ = e.target;
    else if (e.srcElement)
        targ = e.srcElement;
    if (targ.nodeType == 3) // defeat Safari bug
        targ = targ.parentNode;

    // jQuery normalizes the pageX and pageY
    // pageX,Y are the mouse positions relative to the document
    // offset() returns the position of the element relative to the document
    const x = e.pageX - $(targ).offset().left;
    const y = e.pageY - $(targ).offset().top;

    return {"x": x, "y": y};
};

/*
 * return a copy of an object with only non-object keys
 * we need this to avoid circular references
 * http://stackoverflow.com/a/24161582/3208463
 */
function simpleKeys (original) {
    return Object.keys(original).reduce(function (obj, key) {
        if (typeof original[key] !== 'object')
            obj[key] = original[key];
        return obj;
    }, {});
}

mpl.figure.prototype.mouse_event = function(event, name) {
    const canvas_pos = mpl.findpos(event);

    if (name === 'button_press')
    {
        this.canvas.focus();
        this.canvas_div.focus();
    }

    const x = canvas_pos.x * mpl.ratio;
    const y = canvas_pos.y * mpl.ratio;

    this.send_message(name, {x: x, y: y, button: event.button,
        step: event.step,
        guiEvent: simpleKeys(event)});

    /* This prevents the web browser from automatically changing to
     * the text insertion cursor when the button is pressed.  We want
     * to control all of the cursor setting manually through the
     * 'cursor' event from matplotlib */
    event.preventDefault();
    return false;
};

mpl.figure.prototype._key_event_extra = function(event, name) {
    // Handle any extra behaviour associated with a key event
};

mpl.figure.prototype.key_event = function(event, name) {

    // Prevent repeat events
    if (name == 'key_press')
    {
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

    this._key_event_extra(event, name);

    this.send_message(name, {key: value,
        guiEvent: simpleKeys(event)});
    return false;
};

mpl.figure.prototype.toolbar_button_onclick = function(name) {
    if (name == 'download') {
        this.handle_save(this, null);
    } else {
        this.send_message("toolbar_button", {name: name});
    }
};

mpl.figure.prototype.toolbar_button_onmouseover = function(tooltip) {
    this.message.textContent = tooltip;
};
mpl.toolbar_items = [["Home", "Reset original view", "ui-icon ui-icon-home", "home"], ["Back", "Back to  previous view", "ui-icon ui-icon-circle-arrow-w", "back"], ["Forward", "Forward to next view", "ui-icon ui-icon-circle-arrow-e", "forward"], ["", "", "", ""], ["Pan", "Pan axes with left mouse, zoom with right", "ui-icon ui-icon-arrow-4", "pan"], ["Zoom", "Zoom to rectangle", "ui-icon ui-icon-search", "zoom"], ["", "", "", ""], ["Download", "Download plot", "ui-icon ui-icon-disk", "download"]];

mpl.extensions = ["eps", "jpeg", "pdf", "png", "ps", "raw", "svg", "tif"];

mpl.default_extension = "png";
