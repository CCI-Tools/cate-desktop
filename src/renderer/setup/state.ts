import {SetupInfo, SetupOptions} from "../../common/setup";
import {TransactionProgress} from "../../common/transaction";

// Set this to false to simulate a running setup tasks that produces a dummy log
export const SETUP_TEST_MODE = false;

export const SCREEN_ID_START = "START";
export const SCREEN_ID_CONFIG = "CONFIG";
export const SCREEN_ID_RUN = "RUN";
export const SCREEN_ID_END = "END";

export type ScreenId = "START" | "CONFIG" | "RUN" | "END";

export const SETUP_STATUS_NOT_STARTED = "NOT_STARTED";
export const SETUP_STATUS_IN_PROGRESS = "IN_PROGRESS";
export const SETUP_STATUS_SUCCEEDED = "SUCCEEDED";
export const SETUP_STATUS_FAILED = "FAILED";
export const SETUP_STATUS_CANCELLED = "CANCELLED";

export type SetupStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface State extends SetupOptions {
    setupInfo: SetupInfo;
    screenId: ScreenId;
    validations: { [screenId: string]: string };
    progress: TransactionProgress;
    logLines: string[];
    setupStatus: SetupStatus;
    isLogOpen: boolean;
}
