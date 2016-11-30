/**
 * Cate's WebAPI.
 *
 * Implementation is based on WebSockets with a JSON-RPC-based protocol.
 * For JSON-RPC details see http://www.jsonrpc.org/specification.
 *
 * A Cate WebAPI server must implement a general method "__cancelJob__(jobId: number): void"
 * which cancels the job with given *jobId*. The method call must either succeed with any "response" value
 * or fail by returning an "error" object.
 *
 * If the Cate WebAPI server has successfully cancelled a running job, an "error" object with code 999
 * must be returned.
 *
 * To report progress, the Cate WebAPI server can send "progress" objects:
 *
 *   {
 *      work?: number,
 *      total?: number,
 *      message?: string
 *   }
 *
 * This is non JSON-RCP, which only allows for either the "response" or an "error" object.
 *
 * @author Norman Fomferra
 */


const CANCEL_METHOD = '__cancelJob__';
const CANCELLED_CODE = 999;

/*
 * This represents the WebSocket API we are using in this very impl.
 */
interface WebSocketMin {
    onclose: (this: this, ev: CloseEvent) => any;
    onerror: (this: this, ev: ErrorEvent) => any;
    onmessage: (this: this, ev: MessageEvent) => any;
    onopen: (this: this, ev: Event) => any;

    send(data: any): void;
    close(code?: number, reason?: string): void;
}


export interface WebAPI {
    readonly url: string;
    onOpen: (event) => void;
    onClose: (event) => void;
    onError: (event) => void;
    onWarning: (event) => void;

    call(method: string,
         params: Array<any>|Object,
         onProgress?: (progress: JobProgress) => void): JobPromise;

    close(): void;
}

export function openWebAPI(url: string, firstMessageId = 0, socket?: WebSocketMin): WebAPI {
    return new WebAPIImpl(url, firstMessageId, socket);
}

/**
 * The WebAPI class is used to @submit JSON-RCP requests. Clients will receive a @Job object which provides
 * additional API to deal with asynchronously received job status messages and the final result.
 */
class WebAPIImpl implements WebAPI {

    readonly url: string;
    onOpen: (event) => void;
    onClose: (event) => void;
    onError: (event) => void;
    onWarning: (event) => void;

    readonly socket: WebSocketMin;
    private currentMessageId = 0;
    private activeJobs: JobImpl[];
    private isOpen: boolean;

    constructor(url: string, firstMessageId = 0, socket?: WebSocketMin) {
        this.url = url;
        this.currentMessageId = firstMessageId;
        this.activeJobs = [];
        this.isOpen = false;
        this.socket = socket ? socket : new WebSocket(url);
        this.socket.onopen = (event) => {
            if (this.onOpen) {
                this.onOpen(event);
            }
        };
        this.socket.onclose = (event) => {
            if (this.onClose) {
                this.onClose(event);
            }
        };
        this.socket.onerror = (event) => {
            if (this.onError) {
                this.onError(event);
            }
        };
        this.socket.onmessage = (event) => {
            // this.dispatchEvent('debug', `Cate WebAPI message received: ${event.data}`);
            this.processMessage(event.data);
        }
    }

    /**
     * Call a remote procedure / method.
     *
     * @param method The method name.
     * @param params Positional parameters as array or named parameters as object.
     * @param onProgress Callback that is notified on progress.
     * @returns {Promise} A promise.
     */
    call(method: string,
         params: Array<any>|Object,
         onProgress?: (progress: JobProgress) => void): JobPromise {
        const request = {
            "id": this.newId(),
            "method": method,
            "params": params,
        };
        const job = new JobImpl(this, request);
        this.activeJobs[request.id] = job;
        return job.invoke(onProgress);
    }

    close(): void {
        this.socket.close();
    }

    sendMessage(request: JobRequest) {
        const message = Object.assign({}, {jsonrpc: "2.0"}, request);
        const messageText = JSON.stringify(message);
        this.socket.send(messageText);
    }

    private processMessage(messageText: string): void {
        let message;
        try {
            message = JSON.parse(messageText);
        } catch (err) {
            this.warn(`Received invalid JSON content from Cate WebAPI:\n--------------------\n${messageText}\n--------------------`);
            return;
        }
        if (message.jsonrcp !== '2.0' || typeof message.id !== 'number') {
            this.warn(`Received invalid Cate WebAPI message (id: ${message.id}). Ignoring it.`);
            return;
        }

        const job = this.activeJobs[message.id];
        if (!job) {
            this.warn(`Received Cate WebAPI message (id: ${message.id}), which does not have an associated job. Ignoring it.`);
            return;
        }

        if (message.response) {
            job.notifyDone(message.response);
            delete this.activeJobs[message.id];
        } else if (message.progress) {
            job.notifyInProgress(message.progress)
        } else if (message.error) {
            job.notifyFailed(message.error);
            delete this.activeJobs[message.id];
        } else {
            this.warn(`Received invalid Cate WebAPI message (id: ${message.id}), which is neither a response, progress, nor error. Ignoring it.`)
        }
    }

    private warn(message: string) {
        if (this.onWarning) {
            const warnEvent = {type: 'warning', message};
            this.onWarning(warnEvent);
        }
    }

    private newId(): number {
        return this.currentMessageId++;
    }
}

export interface Job {
    getRequest(): JobRequest;
    getStatus(): JobStatus;
    isCancelled(): boolean;
    cancel(): Promise<JobResponse>;
}

// Note: Job must have the same interface as JobBase

export interface JobPromise extends Promise<JobResponse> {
    getJob(): Job;
}

export enum JobStatus {
    NEW,
    SUBMITTED,
    IN_PROGRESS,
    DONE,
    FAILED,
    CANCELLED,
}

export interface JobRequest {
    readonly id: number;
    readonly method: string;
    readonly params: Array<any>|Object;
}

export type JobResponse = any;

/**
 * Progress info, this is not covered by JSON-RCP.
 */
export interface JobProgress {
    readonly message?: string;
    readonly worked?: number;
    readonly total?: number;
}

/**
 * JSON-RCP error value.
 */
export interface JobFailure {
    /** A Number that indicates the error type that occurred. */
    readonly code: number;

    /** A string providing a short description of the error. */
    readonly message: string;

    /**
     * A Primitive or Structured value that contains additional information about the error.
     * This may be omitted.
     * The value of this member is defined by the Server (e.g. detailed error information, nested errors etc.).
     */
    readonly data?: any;
}

export type JobProgressHandler = (progress: JobProgress) => void;
export type JobResponseHandler = (response: JobResponse) => void;
export type JobFailureHandler = (failure: JobFailure) => void;

class JobImpl implements Job {

    private webAPI: WebAPIImpl;
    private request: JobRequest;
    private status: JobStatus;
    private onProgress: JobProgressHandler;
    private onResolve: JobResponseHandler;
    private onReject: JobFailureHandler;

    constructor(webAPI: WebAPIImpl, request: JobRequest) {
        this.webAPI = webAPI;
        this.request = request;
        this.status = JobStatus.NEW;
    }

    getRequest() {
        return this.request;
    }

    getStatus(): JobStatus {
        return this.status;
    }

    isCancelled(): boolean {
        return this.status === JobStatus.CANCELLED;
    }

    cancel(onResolve?: JobResponseHandler,
           onReject?: JobFailureHandler): Promise<JobResponse> {
        return this.webAPI.call(CANCEL_METHOD, {jobId: this.request.id})
            .then(onResolve || (() => {
                }), onReject || (() => {
                }));
    }

    ////////////////////////////////////////////////////////////
    // Implementation details

    invoke(onProgress?: JobProgressHandler): JobPromise {
        // TODO: onProgress handler must be called async, simlilar to handlers of Promise.then(ononResolve, onReject)

        const executor = (onResolve: JobResponseHandler, onReject: JobFailureHandler) => {
            this.setHandlers(onProgress, onResolve, onReject);
            this.sendMessage();
            this.setStatus(JobStatus.SUBMITTED);
        };

        const promise = new Promise<JobResponse>(executor.bind(this));
        promise['getJob'] = this.getJob.bind(this);
        return promise as JobPromise;
    }

    private getJob(): Job {
        return this;
    }

    private setHandlers(onProgress, onResolve, onReject) {
        this.onProgress = onProgress;
        this.onResolve = onResolve;
        this.onReject = onReject;
    }

    private sendMessage() {
        this.webAPI.sendMessage(this.request);
    }

    private setStatus(status: JobStatus) {
        this.status = status;
    }

    notifyInProgress(progress: JobProgress) {
        this.setStatus(JobStatus.IN_PROGRESS);
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    notifyDone(response: JobResponse) {
        this.setStatus(JobStatus.DONE);
        if (this.onResolve) {
            this.onResolve(response);
        }
    }

    notifyFailed(failure: JobFailure) {
        this.setStatus(failure.code === CANCELLED_CODE ? JobStatus.CANCELLED : JobStatus.FAILED);
        if (this.onReject) {
            this.onReject(failure);
        }
    }
}


////////////////////////////////////////////////////


export class WebSocketMock implements WebSocketMin {
    ////////////////////////////////////////////
    // >>>> Minimum WebSocket interface impl.

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

    // <<<< WebSocket interface impl.
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





