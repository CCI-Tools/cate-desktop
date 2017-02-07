/**
 * Job-related interfaces and type definitions.
 *
 * @author Norman Fomferra
 */

/**
 * A job represents the execution of a remote method.
 */
export interface Job {
    getRequest(): JobRequest;
    getStatus(): JobStatus;
    isCancelled(): boolean;
    cancel(): void;
}

/**
 * A promise representing a remote method call.
 */
export interface JobPromise<JobResponse> extends Promise<JobResponse> {
    getJob(): Job;
    getJobId(): number;
}

/**
 * All the possible job statuses.
 */
export type JobStatus = 'NEW'|'SUBMITTED'|'IN_PROGRESS'|'FAILED'|'CANCELLED'|'DONE';

export class JobStatusEnum {
    static readonly NEW = 'NEW';
    static readonly SUBMITTED = 'SUBMITTED';
    static readonly IN_PROGRESS = 'IN_PROGRESS';
    static readonly DONE = 'DONE';
    static readonly FAILED = 'FAILED';
    static readonly CANCELLED = 'CANCELLED';
}

/**
 * Represents a job request using the JSON-RCP 2.0 style.
 */
export interface JobRequest {
    /** The JSON-RCP message identifier. */
    readonly id: number;
    readonly method: string;
    readonly params: Array<any>|Object;
}

/**
 * Job progress information, this is a Cate-specific extension to JSON-RCP 2.0.
 */
export interface JobProgress {
    /** The JSON-RCP message identifier. */
    readonly id: number;
    readonly label?: string;
    readonly message?: string;
    readonly total?: number;
    readonly worked?: number;
}

/**
 * Represents a job failure using the JSON-RCP 2.0 style.
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

/**
 * A callback listening for job progress messages.
 */
export type JobProgressHandler = (progress: JobProgress) => void;

/**
 * A callback listening for job responses.
 */
export type JobResponseHandler<JobResponse> = (response: JobResponse) => void;

/**
 * A callback listening for job failures.
 */
export type JobFailureHandler = (failure: JobFailure) => void;

