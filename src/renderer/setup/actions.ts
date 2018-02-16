import {ipcRenderer} from 'electron';
import {Dispatch} from "react-redux";
import {CateMode, CondaMode, SetupMode, State} from "./state";

export function moveForward() {
    return {type: "MOVE_FORWARD"};
}

export function moveBack() {
    return {type: "MOVE_BACK"};
}

export function setSilentMode(silentMode: boolean) {
    return {type: "SET_SILENT_MODE", payload: {silentMode}};
}

export function setSetupMode(setupMode: SetupMode) {
    return {type: "SET_SETUP_MODE", payload: {setupMode}};
}

export function setCondaMode(condaMode: CondaMode) {
    return {type: "SET_CONDA_MODE", payload: {condaMode}};
}

export function setCateMode(cateMode: CateMode) {
    return {type: "SET_CATE_MODE", payload: {cateMode}};
}

export function setPythonExe(pythonExe: string) {
    return {type: "SET_PYTHON_EXE", payload: {pythonExe}};
}

export function setTargetDir(targetDir: string) {
    return {type: "SET_TARGET_DIR", payload: {targetDir}};
}

export function setProgress(progress: number) {
    return {type: "SET_PROGRESS", payload: {progress}};
}

export function browsePythonExe() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        ipcRenderer.once("browsePythonExe-response", (event, pythonExe: string) => {
            dispatch(setPythonExe(pythonExe));
        });
        ipcRenderer.send("browsePythonExe", getState().pythonExe);
    };
}

export function browseTargetDir() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        ipcRenderer.once("browseTargetDir-response", (event, targetDir: string) => {
            dispatch(setTargetDir(targetDir));
        });
        ipcRenderer.send("browseTargetDir", getState().targetDir);
    };
}

export function cancelSetup() {
    return () => {
        ipcRenderer.send("cancelSetup");
    };
}

export function endSetup() {
    return (dispatch: Dispatch<any>, getState: () => State) => {
        ipcRenderer.send("endSetup", getState());
    };
}
