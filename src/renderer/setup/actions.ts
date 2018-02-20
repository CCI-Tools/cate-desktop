import {ipcRenderer} from 'electron';
import {Dispatch} from "react-redux";
import {
    CateMode, SetupMode, CATE_MODE_NEW_CATE_DIR, CATE_MODE_OLD_CATE_DIR, CATE_MODE_CONDA_DIR,
} from "../../common/setup";
import {SCREEN_ID_CATE_INSTALL, State} from "./state";

// Strange, we must use this, imports from "react-redux" produce TS syntax errors
export interface DispatchProp {
    dispatch?: (action: any) => void;
}

export function moveForward() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "MOVE_FORWARD"});
        validatePaths(dispatch, getState);
    };
}

export function moveBack() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "MOVE_BACK"});
        validatePaths(dispatch, getState);
    };
}

export function setAutoUpdateCate(autoUpdateCate: boolean) {
    return {type: "SET_AUTO_UPDATE_CATE", payload: {autoUpdateCate}};
}

export function setSetupMode(setupMode: SetupMode) {
    return {type: "SET_SETUP_MODE", payload: {setupMode}};
}

export function setCateMode(cateMode: CateMode) {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "SET_CATE_MODE", payload: {cateMode}});
        validatePaths(dispatch, getState);
    };
}

export function setNewCateDir(newCateDir: string) {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "SET_NEW_CATE_DIR", payload: {newCateDir}});
        validatePaths(dispatch, getState);
    };
}

export function setOldCateDir(oldCateDir: string) {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "SET_OLD_CATE_DIR", payload: {oldCateDir}});
        validatePaths(dispatch, getState);
    };
}

export function setCondaDir(condaDir: string) {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        dispatch({type: "SET_CONDA_DIR", payload: {condaDir}});
        validatePaths(dispatch, getState);
    };
}

export function browseNewCateDir() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        const listener = (event, newCateDir: string) => dispatch(setNewCateDir(newCateDir));
        ipcRenderer && ipcRenderer.once("browseNewCateDir-response", listener);
        ipcRenderer && ipcRenderer.send("browseNewCateDir", getState().newCateDir);
    };
}


export function browseOldCateDir() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        const listener = (event, oldCateDir: string) => dispatch(setOldCateDir(oldCateDir));
        ipcRenderer && ipcRenderer.once("browseOldCateDir-response", listener);
        ipcRenderer && ipcRenderer.send("browseOldCateDir", getState().oldCateDir);
    };
}

export function browseCondaDir() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        const listener = (event, condaDir: string) => dispatch(setCondaDir(condaDir));
        ipcRenderer && ipcRenderer.once("browseCondaDir-response", listener);
        ipcRenderer && ipcRenderer.send("browseCondaDir", getState().condaDir);
    };
}

export function setProgress(progress: number) {
    return {type: "SET_PROGRESS", payload: {progress}};
}

export function setValidation(screenId: string, validation: any) {
    return {type: "SET_VALIDATION", payload: {screenId, validation}};
}

export function cancelSetup() {
    return () => {
        ipcRenderer && ipcRenderer.send("cancelSetup");
    };
}

export function endSetup() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        ipcRenderer && ipcRenderer.send("endSetup", getState());
    };
}

function validatePaths(dispatch: Dispatch<any>, getState: () => State) {
    if (getState().screenId === SCREEN_ID_CATE_INSTALL) {
        if (getState().cateMode === CATE_MODE_NEW_CATE_DIR) {
            validateNewCateDir(dispatch, getState);
        } else if (getState().cateMode === CATE_MODE_OLD_CATE_DIR) {
            validateOldCateDir(dispatch, getState);
        } else if (getState().cateMode === CATE_MODE_CONDA_DIR) {
            validateCondaDir(dispatch, getState);
        }
    }
}

function validateNewCateDir(dispatch: Dispatch<any>, getState: () => State) {
    const newCateDir = getState().newCateDir && getState().newCateDir.trim();
    if (!newCateDir || newCateDir === "") {
        dispatch(setValidation(getState().screenId, "Cate directory must be given"));
    } else {
        const listener = (event, validation: string | null) => dispatch(setValidation(getState().screenId, validation));
        ipcRenderer && ipcRenderer.once("validateNewCateDir-response", listener);
        ipcRenderer && ipcRenderer.send("validateNewCateDir", newCateDir);
    }
}

function validateOldCateDir(dispatch: Dispatch<any>, getState: () => State) {
    const oldCateDir = getState().oldCateDir && getState().oldCateDir.trim();
    if (!oldCateDir || oldCateDir === "") {
        dispatch(setValidation(getState().screenId, "Cate directory must be given"));
    } else {
        const listener = (event, validation: string | null) => dispatch(setValidation(getState().screenId, validation));
        ipcRenderer && ipcRenderer.once("validateOldCateDir-response", listener);
        ipcRenderer && ipcRenderer.send("validateOldCateDir", oldCateDir);
    }
}

function validateCondaDir(dispatch: Dispatch<any>, getState: () => State) {
    const condaDir = getState().condaDir && getState().condaDir.trim();
    if (!condaDir || condaDir === "") {
        dispatch(setValidation(getState().screenId, "Anaconda/Miniconda directory must be given"));
    } else {
        const listener = (event, validation: string | null) => dispatch(setValidation(getState().screenId, validation));
        ipcRenderer && ipcRenderer.once("validateCondaDir-response", listener);
        ipcRenderer && ipcRenderer.send("validateCondaDir", condaDir);
    }
}

export function performSetupTasks() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        const listener = (event, progress: any) => dispatch({type: "SET_TASK_PROGRESS", payload: {progress}});
        ipcRenderer && ipcRenderer.on("performSetupTasks-response", listener);
        ipcRenderer && ipcRenderer.send("performSetupTasks", getState());
    }
}

