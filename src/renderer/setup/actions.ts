import {ipcRenderer} from 'electron';

export function next() {
    return {type: "NEXT"};
}

export function back() {
    return {type: "BACK"};
}

export function mode(mode: "existing" | "new") {
    return {type: "MODE", payload: {mode}};
}

export function pythonExe(pythonExe: string) {
    return {type: "PYTHON_EXE", payload: {pythonExe}};
}

export function targetDir(targetDir: string) {
    return {type: "TARGET_DIR", payload: {targetDir}};
}

export function cancel() {
    return () => {
        ipcRenderer.send("cancel");
    };
}
