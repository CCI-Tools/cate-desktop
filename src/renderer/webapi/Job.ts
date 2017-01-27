/**
 * @author Norman Fomferra
 */
export interface Job {
    getRequest(): JobRequest;
    getStatus(): JobStatus;
    isCancelled(): boolean;
    cancel(): void;
}

export interface JobPromise<JobResponse> extends Promise<JobResponse> {
    getJob(): Job;
    getJobId(): number;
}

export type JobStatus = 'NEW'|'SUBMITTED'|'IN_PROGRESS'|'FAILED'|'CANCELLED'|'DONE';

export class JobStatusEnum {
    static readonly NEW = 'NEW';
    static readonly SUBMITTED = 'SUBMITTED';
    static readonly IN_PROGRESS = 'IN_PROGRESS';
    static readonly DONE = 'DONE';
    static readonly FAILED = 'FAILED';
    static readonly CANCELLED = 'CANCELLED';
}

export interface JobRequest {
    readonly id: number;
    readonly method: string;
    readonly params: Array<any>|Object;
}

/**
 * Progress info, this is a Cate-specific extension to JSON-RCP.
 */
export interface JobProgress {
    /** The ID of the job request. */
    readonly id?: number;
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
export type JobResponseHandler<JobResponse> = (response: JobResponse) => void;
export type JobFailureHandler = (failure: JobFailure) => void;

