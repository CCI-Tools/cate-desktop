import {AnyAction, Reducer} from 'redux';
import {CATE_MODE_NEW_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER} from "../../common/setup";
import {SCREEN_ID_CATE_INSTALL, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_TASK_MONITOR, State} from "./state";

const initialState: State = {
    screenId: SCREEN_ID_START,
    silentMode: false,
    setupMode: SETUP_MODE_AUTO,
    cateMode: CATE_MODE_NEW_CATE_DIR,
    condaDir: "",
    newCateDir: "cate",
    oldCateDir: "",
    progress: null,
    validations: {},
};

export const stateReducer: Reducer<State> = (state: State = initialState, action: AnyAction) => {
    switch (action.type) {
        case "MOVE_FORWARD":
            if (state.validations[state.screenId]) {
                return state;
            }
            switch (state.screenId) {
                case SCREEN_ID_START:
                    switch (state.setupMode) {
                        case SETUP_MODE_AUTO:
                            return {...state, screenId: SCREEN_ID_TASK_MONITOR};
                        case SETUP_MODE_USER:
                            return {...state, screenId: SCREEN_ID_CATE_INSTALL};
                    }
                    break;
                case SCREEN_ID_CATE_INSTALL:
                    return {...state, screenId: SCREEN_ID_TASK_MONITOR};
                case SCREEN_ID_TASK_MONITOR:
                    return {...state, screenId: SCREEN_ID_END};
            }
            break;
        case "MOVE_BACK":
            switch (state.screenId) {
                case SCREEN_ID_CATE_INSTALL:
                    return {...state, screenId: SCREEN_ID_START};
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
        case "SET_VALIDATION":
            return {
                ...state,
                validations: {...state.validations, [action.payload.screenId]: action.payload.validation}
            };
    }

    return state;
};
