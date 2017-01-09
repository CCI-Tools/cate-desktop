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
 * Instances of this type can be stored for each method in the service object.
 */
export interface IProcessData {
    /**
     * Number of steps.
     */
    numSteps?: number;
    /**
     * Delay per step in milliseconds
     */
    delayPerStep?: number;
    /**
     * Delay in milliseconds before a method call returns.
     */
    delay;
}

export interface IServiceObject {
    processData: {[methodName: string]: IProcessData};
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
    readonly serviceObj: any;
    readonly asyncCalls: boolean;
    readonly cancelledJobsIds: Set<number> = new Set();

    constructor(openDelay = 100, serviceObj?: IServiceObject, asyncCalls?: boolean) {
        if (openDelay) {
            setTimeout(() => {
                if (this.onopen) {
                    this.onopen({})
                }
            }, openDelay || 100);
        }
        this.serviceObj = serviceObj;
        this.asyncCalls = asyncCalls;
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
            if (message.method === '__cancelJob__') {
                this.cancelledJobsIds.add(message.params['jobId']);
            } else {
                this.callServiceObjectMethod(message);
            }
        } else {
            console.error(`WebSocketMock: received invalid message: ${message}`);
        }
    }

    private callServiceObjectMethod(requestMessage) {
        const method = this.serviceObj[requestMessage.method];
        if (!method) {
            this.emulateIncomingMessages({
                jsonrcp: "2.0",
                id: requestMessage.id,
                error: {
                    code: 1,
                    message: `${requestMessage.method}(): no such method`
                }
            });
            return;
        }

        const processData = this.serviceObj.processData && this.serviceObj.processData[requestMessage.method];
        const numSteps = (processData && processData.numSteps) || 0;
        const delayPerStep = (processData && processData.delayPerStep) || 0;
        const delay = (processData && processData.delay) || 0;

        const responseTasks = [];

        for (let i = 0; i < numSteps; i++) {
            responseTasks.push({
                delay: delayPerStep,
                perform: () => {
                    this.emulateIncomingMessages({
                        jsonrcp: "2.0",
                        id: requestMessage.id,
                        progress: {
                            worked: i + 1,
                            total: numSteps
                        }
                    });
                }
            });
        }

        responseTasks.push({
            delay: delay,
            perform: () => {
                try {
                    const result = method.apply(this.serviceObj, requestMessage.params);
                    this.emulateIncomingMessages({
                        jsonrcp: "2.0",
                        id: requestMessage.id,
                        response: result
                    });
                } catch (e) {
                    this.emulateIncomingMessages({
                        jsonrcp: "2.0",
                        id: requestMessage.id,
                        error: {
                            code: 2,
                            message: `${requestMessage.method}(): ${e}`,
                        }
                    });
                }
            }
        });

        if (!this.asyncCalls) {
            responseTasks.forEach(task => task.perform());
        } else {
            function performDeferred(i: number, webSocketMock: WebSocketMock) {
                if (webSocketMock.cancelledJobsIds.has(requestMessage.id)) {
                    webSocketMock.emulateIncomingMessages({
                        jsonrcp: "2.0",
                        id: requestMessage.id,
                        error: {
                            code: 999,
                            message: `Cancelled ${requestMessage.method}()`,
                        }
                    });
                } else {
                    if (i < responseTasks.length) {
                        const task = responseTasks[i];
                        setTimeout(() => {
                                task.perform();
                                performDeferred(i + 1, webSocketMock);
                            },
                            task.delay
                        );
                    }
                }
            }
            performDeferred(0, this);
        }
    }
}
