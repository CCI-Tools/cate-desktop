export const SCREEN_ID_START = "start";
export const SCREEN_ID_END = "end";
export const SCREEN_ID_CONDA_INSTALL = "condaInstall";
export const SCREEN_ID_CATE_INSTALL = "cateInstall";
export const SCREEN_ID_TASK_MONITOR = "taskMonitor";
export const SCREEN_ID_TARGET_DIR = "targetDir";
export const SCREEN_ID_PYTHON_EXE = "pythonExe";

export const SETUP_MODE_AUTO = "auto";
export const SETUP_MODE_USER = "user";

export const CONDA_MODE_NEW = "new";
export const CONDA_MODE_EXISTING = "existing";

export const CATE_MODE_TOP_LEVEL = "topLevel";
export const CATE_MODE_NEW_ENV = "newEnv";

export type ScreenId = "start" | "condaInstall" | "cateInstall" | "targetDir" | "pythonExe" | "taskMonitor" | "end";

export type SetupMode = "auto" | "user";
export type CondaMode = "new" | "existing";
export type CateMode = "topLevel" | "newEnv";

export interface State {
    screenId: ScreenId;
    silentMode: boolean,
    setupReason: string;
    setupMode: SetupMode;
    condaMode: CondaMode;
    cateMode: CateMode | null;
    targetDir: string;
    pythonExe: string;
    progress: number | null;
}
