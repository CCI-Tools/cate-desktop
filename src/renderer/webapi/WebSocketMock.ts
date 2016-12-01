
/**
 * This represents the WebSocket API we are implementing in WebSocketMock and using in WebAPIClientImpl.
 *
 * @author Norman Fomferra
 */
export interface WebSocketMin {
    onclose: (this: this, ev: CloseEvent) => any;
    onerror: (this: this, ev: ErrorEvent) => any;
    onmessage: (this: this, ev: MessageEvent) => any;
    onopen: (this: this, ev: Event) => any;

    send(data: any): void;
    close(code?: number, reason?: string): void;
}

/**
 * A mock for a real WebSocket as provided by Firefox/Chromium, etc.
 * It is used for testing only.
 *
 * @author Norman Fomferra
 */
export class WebSocketMock implements WebSocketMin {
    ////////////////////////////////////////////
    // >>>> WebSocketMin implementation

    onmessage: (this: this, ev: any) => any;
    onopen: (this: this, ev: any) => any;
    onerror: (this: this, ev: any) => any;
    onclose: (this: this, ev: any) => any;

    send(data: string) {
        this.messageLog.push(data);
        this.maybeUseServiceObj(data);
    }

    close(code?: number, reason?: string): void {
        this.onclose({code, reason});
    }

    // <<<< WebSocketMin implementation
    ////////////////////////////////////////////

    readonly messageLog: string[] = [];
    readonly serviceObj;

    constructor(openDelay = 100, serviceObj?) {
        if (openDelay) {
            setTimeout(() => {
                if (this.onopen) {
                    this.onopen({})
                }
            }, openDelay || 100);
        }
        this.serviceObj = serviceObj;
    }

    emulateIncomingMessages(...messages: Object[]) {
        for (let i = 0; i < messages.length; i++) {
            const event = {data: JSON.stringify(messages[i])};
            this.onmessage(event);
        }
    }

    emulateIncomingRawMessages(...messageTexts: string[]) {
        for (let i = 0; i < messageTexts.length; i++) {
            const event = {data: messageTexts};
            this.onmessage(event);
        }
    }

    emulateOpen(event) {
        this.onopen(event);
    }

    emulateError(event) {
        this.onerror(event);
    }

    emulateClose(event) {
        this.onclose(event);
    }

    private maybeUseServiceObj(messageText) {
        if (!this.serviceObj) {
            return;
        }

        // The following code emulates the behaviour of a remote service

        let message;
        try {
            message = JSON.parse(messageText);
        } catch (e) {
            // Note we can't respond to any message here, because we don't have a method ID!
            console.error(`WebSocketMock: received invalid JSON: ${messageText}`, e);
            throw e;
        }

        if (message.id >= 0 && message.method && message.params) {
            const method = this.serviceObj[message.method];

            if (!method) {
                this.emulateIncomingMessages({
                    jsonrcp: "2.0",
                    id: message.id,
                    error: {
                        code: 1,
                        message: `${message.method}(): no such method`
                    }
                });
                return;
            }

            // TODO: Use delayed async tasks here, also emulate progress emitting
            try {
                const result = method.apply(this.serviceObj, message.params);
                this.emulateIncomingMessages({
                    jsonrcp: "2.0",
                    id: message.id,
                    response: result
                });
            } catch (e) {
                this.emulateIncomingMessages({
                    jsonrcp: "2.0",
                    id: message.id,
                    error: {
                        code: 2,
                        message: `${message.method}(): ${e}`,
                    }
                });
            }
        }
    }
}
