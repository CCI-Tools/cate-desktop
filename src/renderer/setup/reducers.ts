import {AnyAction, Reducer} from 'redux';
import {
    CATE_MODE_NEW_ENV, CATE_MODE_TOP_LEVEL, CONDA_MODE_EXISTING,
    CONDA_MODE_NEW,
    CondaMode, SCREEN_ID_CATE_INSTALL, SCREEN_ID_CONDA_INSTALL, SCREEN_ID_END, SCREEN_ID_PYTHON_EXE, SCREEN_ID_START,
    SCREEN_ID_TARGET_DIR, SCREEN_ID_TASK_MONITOR,
    SETUP_MODE_AUTO,
    SETUP_MODE_USER,
    State
} from "./state";

const initialState: State = {
    screenId: SCREEN_ID_START,
    silentMode: false,
    setupReason: "Install Cate's Python back-end",
    setupMode: SETUP_MODE_AUTO,
    condaMode: CONDA_MODE_NEW,
    cateMode: null,
    targetDir: "~/cate/python",
    pythonExe: "",
    progress: null,
};

export const stateReducer: Reducer<State> = (state: State = initialState, action: AnyAction) => {
    switch (action.type) {
        case "MOVE_FORWARD":
            switch (state.screenId) {
                case SCREEN_ID_START:
                    switch (state.setupMode) {
                        case SETUP_MODE_AUTO:
                            return {...state, screenId: SCREEN_ID_TASK_MONITOR};
                        case SETUP_MODE_USER:
                            return {...state, screenId: SCREEN_ID_CONDA_INSTALL};
                    }
                    break;
                case SCREEN_ID_CONDA_INSTALL:
                    let cateMode;
                    switch (state.condaMode) {
                        case CONDA_MODE_NEW:
                            cateMode = state.cateMode || CATE_MODE_TOP_LEVEL;
                            return {...state, screenId: SCREEN_ID_CATE_INSTALL, cateMode};
                        case CONDA_MODE_EXISTING:
                            cateMode = state.cateMode || CATE_MODE_NEW_ENV;
                            return {...state, screenId: SCREEN_ID_CATE_INSTALL, cateMode};
                    }
                    break;
                case SCREEN_ID_CATE_INSTALL:
                    switch (state.cateMode) {
                        case CATE_MODE_NEW_ENV:
                            return {...state, screenId: SCREEN_ID_TASK_MONITOR};
                        case CATE_MODE_TOP_LEVEL:
                            return {...state, screenId: SCREEN_ID_TASK_MONITOR};
                    }
                    break;
                case SCREEN_ID_TASK_MONITOR:
                    return {...state, screenId: SCREEN_ID_END};
            }
            break;
        case "MOVE_BACK":
            switch (state.screenId) {
                case SCREEN_ID_CONDA_INSTALL:
                    return {...state, screenId: SCREEN_ID_START};
                case SCREEN_ID_CATE_INSTALL:
                    return {...state, screenId: SCREEN_ID_CONDA_INSTALL};
                case SCREEN_ID_END:
                    switch (state.setupMode) {
                        case SETUP_MODE_AUTO:
                            return {...state, screenId: SCREEN_ID_START};
                        case SETUP_MODE_USER:
                            return {...state, screenId: SCREEN_ID_CATE_INSTALL};
                    }
                    break;
            }
            break;
        case "SET_SILENT_MODE":
            return {...state, silentMode: action.payload.silentMode};
        case "SET_SETUP_MODE":
            return {...state, setupMode: action.payload.setupMode};
        case "SET_CONDA_MODE":
            return {...state, condaMode: action.payload.condaMode};
        case "SET_CATE_MODE":
            return {...state, cateMode: action.payload.cateMode};
        case "SET_TARGET_DIR":
            return {...state, targetDir: action.payload.targetDir};
        case "SET_PYTHON_EXE":
            return {...state, pythonExe: action.payload.pythonExe};
        case "SET_PROGRESS":
            return {...state, progress: action.payload.progress};
    }

    return state;
};
