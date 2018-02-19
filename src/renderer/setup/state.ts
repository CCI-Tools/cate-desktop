import {SetupOptions} from "../../common/setup";

export const SCREEN_ID_START = "start";
export const SCREEN_ID_END = "end";
export const SCREEN_ID_CATE_INSTALL = "cateInstall";
export const SCREEN_ID_TASK_MONITOR = "taskMonitor";

export type ScreenId = "start" | "cateInstall" | "taskMonitor" | "end";

export interface State extends SetupOptions {
    screenId: ScreenId;
    silentMode: boolean,
    progress: number | null;
    validations: {[screenId: string]: string};
}
