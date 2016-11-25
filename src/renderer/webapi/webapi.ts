
export interface JobRequest {
    readonly id: number;
    readonly method: string;
    readonly params: Object;
}

export enum JobStatus {
    SUBMITTED,
    RUNNING,
    FAILED,
    CANCELLED,
    DONE,
}

export type JobResponse = any;

export interface JobProgress {
    readonly message?: string;
    readonly worked?: number;
    readonly total?: number;
}

export interface JobFailure {
    readonly message?: string;
    readonly cancelled?: boolean;
    readonly request?: JobRequest;
}

export interface Job {
    readonly status: JobStatus;
    readonly request: JobRequest;
    then(callback: (response: JobResponse) => void): Job;
    during(callback: (progress: JobProgress) => void): Job;
    failed(callback: (failure: JobFailure) => void): Job;
    cancel(): Job;
    isCancelled(): boolean;
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

    set status(status: JobStatus) {
        this._status = status;
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

    cancel(): Job {
        this.webAPI.submit('cancelJob', {id: this.request.id})
            .then(() => {
                this.notifyFailure({cancelled: true, request: this.request, message: 'cancelled'});
            });
        return this;
    }

    isCancelled(): boolean {
        return this._status === JobStatus.CANCELLED;
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
        this._status = failure.cancelled ? JobStatus.CANCELLED : JobStatus.FAILED;
        if (this.onFailure) {
            this.onFailure(failure);
        }
    }
}


/**
 * Uses JSON-RCP.
 *
 * See https://de.wikipedia.org/wiki/JSON-RPC.
 */
export class WebAPI {
    readonly url: string;
    private currentMessageId = 0;
    private socket: WebSocket;
    private activeJobs: JobImpl[];

    constructor(url: string, firstMessageId = 0, socket?: WebSocket) {
        this.url = url;
        this.currentMessageId = firstMessageId;
        this.activeJobs = [];
        this.socket = socket ? socket : new WebSocket(url);
        this.socket.onopen = (event) => {
            // TODO: notify client listeners (info)
            console.log("WebAPI connection opened:", event);
        };
        this.socket.onclose = (event) => {
            // TODO: notify client listeners (info), pass this.activeJobs
            console.log("WebAPI connection closed:", event);
        };
        this.socket.onerror = (event) => {
            // TODO: notify client listeners (error), pass this.activeJobs
            console.error("WebAPI connection failed:", event);
        };
        this.socket.onmessage = (event) => {
            // console.log("WebAPI connection received request:", event);
            this.processMessage(event.data);
        }
    }

    private processMessage(messageText: string): void {
        const message = JSON.parse(messageText);
        if (message.jsonrcp !== '2.0' || typeof message.id !== 'number') {
            // TODO: notify client listeners (warning)
            console.warn("WebAPI request is not valid JSON-RCP 2.0 --> ignored");
            return;
        }

        const job = this.activeJobs[message.id];
        if (!job) {
            // TODO: notify client listeners (warning)
            console.warn(`WebAPI message with id=${message.id} does not have an associated job --> ignored`);
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
            // TODO: notify client listeners (warning)
            console.warn(`illegal WebAPI message with id=${message.id} is neither a response, progress, nor error --> ignored`);
        }
    }

    submit(method: string, params: Object): Job {
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

    private newId(): number {
        return this.currentMessageId++;
    }
}

