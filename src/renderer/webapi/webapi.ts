
export interface Message {
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

export interface Job {
    readonly status: JobStatus;
    readonly message: Message;
    then(callback: (result: any) => void): Job;
    during(callback: (message?: string, worked?: number, total?: number) => void): Job;
    failed(callback: (err?: any, cancelled?: boolean) => void): Job;
    cancel(): Job;
    isCancelled(): boolean;
}

class JobImpl implements Job {
    private webAPI: WebAPI;
    readonly message: Message;
    private _status: JobStatus;

    private onDone: (result: any) => void;
    private onProgress: (message?: string, worked?: number, total?: number) => void;
    private onError: (err?: any, cancelled?: boolean) => void;

    constructor(webAPI: WebAPI, message) {
        this.webAPI = webAPI;
        this.message = message;
        this._status = JobStatus.SUBMITTED;
    }

    get status(): JobStatus {
        return this._status;
    }

    set status(status: JobStatus) {
        this._status = status;
    }

    then(callback: (result: any)=>void): Job {
        this.onDone = callback;
        return this;
    }

    during(callback: (message?: string, worked?: number, total?: number)=>void): Job {
        this.onProgress = callback;
        return this;
    }

    failed(callback: (err?: any, cancelled?: boolean)=>void): Job {
        this.onError = callback;
        return this;
    }

    cancel(): Job {
        this.webAPI.sendMessage('cancelJob', {id: this.message.id})
            .then(() => {
                this.fail(`"${this.message.method}" has been cancelled`, true);
            });
        return this;
    }

    isCancelled(): boolean {
        return this._status === JobStatus.CANCELLED;
    }

    progress(message?: string, worked?: number, totalWork?: number) {
        this._status = JobStatus.RUNNING;
        if (this.onProgress) {
            this.onProgress(message, worked, totalWork);
        }
    }

    done(result: any) {
        this._status = JobStatus.DONE;
        if (this.onDone) {
            this.onDone(result);
        }
    }

    fail(err: any, cancelled = false) {
        this._status = cancelled ? JobStatus.CANCELLED : JobStatus.FAILED;
        if (this.onError) {
            this.onError(err, cancelled);
        }
    }
}


export class WorkspaceAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
       this.webAPI = webAPI;
    }

    newWorkspace(path: string): Job {
        return this.webAPI.sendMessage('newWorkspace', {path: path});
    }
}

export class DatasetAPI {
    private webAPI: WebAPI;

    constructor(webAPI: WebAPI) {
        this.webAPI = webAPI;
    }

    getDataStoreNames(): Job {
        return this.webAPI.sendMessage('getDataStoreNames', {});
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
    private runningJobs: JobImpl[];

    constructor(url: string, firstMessageId = 0, socket?: WebSocket) {
        this.url = url;
        this.currentMessageId = firstMessageId;
        this.runningJobs = [];
        this.socket = socket ? socket : new WebSocket(url);
        this.socket.onopen = (event) => {
            // TODO: notify client listeners
            console.log("WebAPI connection opened:", event);
        };
        this.socket.onclose = (event) => {
            // TODO: notify client listeners
            console.log("WebAPI connection closed:", event);
        };
        this.socket.onerror = (event) => {
            // TODO: notify client listeners
            console.log("WebAPI connection failed:", event);
        };
        this.socket.onmessage = (event) => {
            console.log("WebAPI connection received message:", event);
            this.processMessage(event.data);
        }
    }

    getDatasetAPI(): DatasetAPI {
        return new DatasetAPI(this);
    }

    getWorkspaceAPI(): WorkspaceAPI {
        return new WorkspaceAPI(this);
    }

    private processMessage(messageText: string): void {
        const message = JSON.parse(messageText);
        if (message.jsonrcp !== '2.0' || typeof message.id !== 'number') {
            // TODO: notify client listeners
            console.error("WebAPI message is not valid JSON-RCP 2.0 --> ignored");
            return;
        }

        const job = this.runningJobs[message.id];
        if (!job) {
            // TODO: notify client listeners
            console.error(`WebAPI message with id=${message.id} has no (more?) associated job --> ignored`);
            return;
        }

        if (message.response) {
            job.done(message.response);
            delete this.runningJobs[message.id];
        } else if (message.progress) {
            job.progress(message.progress)
        } else if (message['error']) {
            job.fail(message['error']);
            delete this.runningJobs[message.id];
        } else {
            // ?
        }
    }

    sendMessage(method: string, params: Object): Job {
        const id = this.newId();
        const message = {
            "jsonrcp": "2.0",
            "id": id,
            "method": method,
            "params": params,
        };
        this.socket.send(JSON.stringify(message));
        const job = new JobImpl(this, message);
        this.runningJobs[id] = job;
        return job;
    }

    private newId(): number {
        return this.currentMessageId++;
    }
}

