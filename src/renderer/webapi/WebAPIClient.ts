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

import {WebSocketMin} from './WebSocketMock'
import {
    Job,
    JobPromise,
    JobRequest,
    JobResponse,
    JobProgress,
    JobFailure,
    JobStatus,
    JobProgressHandler,
    JobResponseHandler,
    JobFailureHandler
} from './Job'

const CANCEL_METHOD = '__cancelJob__';
const CANCELLED_CODE = 999;

/**
 * A client for Cate's WebAPI.
 *
 * The WebAPIClient class is used to perform remote calls to server-side Cate methods and to observe
 * their progress, success, failure, or cancellation in an asynchronous fashion.
 *
 * The Cate WebAPI service must implement a general method "__cancelJob__(jobId: number): void"
 * which cancels the job with given *jobId*. The method call must either succeed with any "response" value
 * or fail by returning an "error" object.
 *
 * If the Cate WebAPIClient server has successfully cancelled a running job, an "error" object with the code
 * given by the CANCELLED_CODE constant (999) must be returned.
 *
 * To report progress, the Cate WebAPIClient server can send "progress" objects:
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
export interface WebAPIClient {
    readonly url: string;
    onOpen: (event) => void;
    onClose: (event) => void;
    onError: (event) => void;
    onWarning: (event) => void;

    /**
     * Perform a JSON-RPC call.
     *
     * @param method The method name.
     * @param params The method parameters, either a list with positional arguments or an object
     *               providing keyword arguments.
     * @param onProgress An optional handler that is notified while the Job progresses.
     *        Note that not all server-side methods provide progress notifications.
     */
    call(method: string,
         params: Array<any>|Object,
         onProgress?: (progress: JobProgress) => void): JobPromise;

    /**
     * Closes this client and the underlying connection, if any.
     */
    close(): void;
}

/**
 * Creates a new WebAPIClient.
 *
 * The implementation uses WebSockets with a JSON-RPC-based protocol.
 * For JSON-RPC details see http://www.jsonrpc.org/specification.
 *
 * @param url The WebSocket URL. WebSocket URL must start with "ws://".
 * @param firstMessageId The ID of the first JSON-RPC method call.
 * @param socket Alternative WebSocket instance for testing.
 * @returns {WebAPIClient} instance.
 */
export function newWebAPIClient(url: string, firstMessageId = 0, socket?: WebSocketMin): WebAPIClient {
    return new WebAPIClientImpl(url, firstMessageId, socket);
}

/**
 * The WebAPIClient class is used to JSON-RCP requests. Clients will receive a JobPromise object which provides
 * additional API to deal with asynchronously received job status messages and the final result.
 */
class WebAPIClientImpl implements WebAPIClient {

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
            // this.dispatchEvent('debug', `Cate WebAPIClient message received: ${event.data}`);
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

class JobImpl implements Job {

    private webAPI: WebAPIClientImpl;
    private request: JobRequest;
    private status: JobStatus;
    private onProgress: JobProgressHandler;
    private onResolve: JobResponseHandler;
    private onReject: JobFailureHandler;

    constructor(webAPI: WebAPIClientImpl, request: JobRequest) {
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
        // TODO: onProgress handler must be called async, similar to handlers of Promise.then(onResolve, onReject)

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
