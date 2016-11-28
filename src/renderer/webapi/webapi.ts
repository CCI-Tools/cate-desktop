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

export interface WebAPI {
    readonly url: string;
    onOpen: (event) => void;
    onClose: (event) => void;
    onError: (event) => void;
    onWarning: (event) => void;

    submit(method: string, params: Array<any>|Object): Job;
    close(): void;
}

export function openWebAPI(url: string, firstMessageId = 0, socket?: WebSocket): WebAPI {
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

    private currentMessageId = 0;
    private socket: WebSocket;
    private activeJobs: JobImpl[];
    private isOpen: boolean;

    constructor(url: string, firstMessageId = 0, socket?: WebSocket) {
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
     * Submit an JSON-RCP request.
     *
     * @param method The method name.
     * @param params The named parameters.
     * @returns {Job} The associated job.
     */
    submit(method: string, params: Array<any>|Object): Job {
        const id = this.newId();
        const message = {
            "jsonrcp": "2.0",
            "id": id,
            "method": method,
            "params": params,
        };
        this.socket.send(JSON.stringify(message));
        const job = new JobImpl(this, message);
        this.activeJobs[id] = job;
        return job;
    }

    close(): void {
        this.socket.close();
    }

    private processMessage(content: string): void {
        const message = JSON.parse(content);
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
            job.notifyProgress(message.progress)
        } else if (message.error) {
            job.notifyFailure(message.error);
            delete this.activeJobs[message.id];
        } else {
            this.warn(`Received invalid Cate WebAPI message (id: ${message.id}), which is neither a response, progress, nor error. Ignoring it.`)
        }
    }

    private warn(message: string) {
        if (this.onWarning) {
            this.onWarning({message: message})
        }
    }

    private newId(): number {
        return this.currentMessageId++;
    }
}

const CANCEL_METHOD = '__cancelJob__';
const CANCELLED_CODE = 999;

export interface Job {
    readonly status: JobStatus;
    readonly request: JobRequest;
    readonly cancelled: boolean;
    then(callback: (response: JobResponse) => void): Job;
    during(callback: (progress: JobProgress) => void): Job;
    failed(callback: (failure: JobFailure) => void): Job;
    cancel(): Job;
}

export enum JobStatus {
    SUBMITTED,
    RUNNING,
    FAILED,
    CANCELLED,
    DONE,
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

class JobImpl implements Job {
    private webAPI: WebAPI;
    readonly request: JobRequest;
    private _status: JobStatus;

    private onProgress: (progress: JobProgress) => void;
    private onDone: (result: JobResponse) => void;
    private onFailure: (failure: JobFailure) => void;

    constructor(webAPI: WebAPI, request: JobRequest) {
        this.webAPI = webAPI;
        this.request = request;
        this._status = JobStatus.SUBMITTED;
    }

    get status(): JobStatus {
        return this._status;
    }

    get cancelled(): boolean {
        return this._status === JobStatus.CANCELLED;
    }

    then(callback: (response: JobResponse)=>void): Job {
        this.onDone = callback;
        return this;
    }

    during(callback: (progress: JobProgress)=>void): Job {
        this.onProgress = callback;
        return this;
    }

    failed(callback: (failure: JobFailure) => void): Job {
        this.onFailure = callback;
        return this;
    }

    cancel(successCallback?: (response: JobResponse) => void,
           failureCallback?: (failure: JobFailure) => void): Job {
        this.webAPI.submit(CANCEL_METHOD, {jobId: this.request.id})
            .then(successCallback || (() => {}))
            .failed(failureCallback || (() => {}));
        return this;
    }

    ////////////////////////////////////////////////////////////
    // Implementation details

    notifyDone(result: any) {
        this._status = JobStatus.DONE;
        if (this.onDone) {
            this.onDone(result);
        }
    }

    notifyProgress(progress: JobProgress) {
        this._status = JobStatus.RUNNING;
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    notifyFailure(failure: JobFailure) {
        this._status = failure.code === CANCELLED_CODE ? JobStatus.CANCELLED : JobStatus.FAILED;
        if (this.onFailure) {
            this.onFailure(failure);
        }
    }
}




