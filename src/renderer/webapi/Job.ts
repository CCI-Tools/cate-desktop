/**
 * A client for Cate's WebAPI.
 *
 * Implementation is based on WebSockets with a JSON-RPC-based protocol.
 * For JSON-RPC details see http://www.jsonrpc.org/specification.
 *
 * A Cate WebAPIClient server must implement a general method "__cancelJob__(jobId: number): void"
 * which cancels the job with given *jobId*. The method call must either succeed with any "response" value
 * or fail by returning an "error" object.
 *
 * If the Cate WebAPIClient server has successfully cancelled a running job, an "error" object with code 999
 * must be returned.
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

export interface Job {
    getRequest(): JobRequest;
    getStatus(): JobStatus;
    isCancelled(): boolean;
    cancel(): Promise<JobResponse>;
}

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
 * Progress info, this is a Cate-specific extension to JSON-RCP.
 */
export interface JobProgress {
    readonly label?: string;
    readonly message?: string;
    readonly total?: number;
    readonly worked?: number;
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

