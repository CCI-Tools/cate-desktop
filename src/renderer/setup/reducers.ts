import {AnyAction, Reducer} from 'redux';
import {MAX_PANELS, State} from "./state";

const initialState: State = {
    panelIndex: 0,
    mode: "new",
    targetDir: "~/cate/python",
    pythonExe: "",
};

export const stateReducer: Reducer<State> = (state: State = initialState, action: AnyAction) => {
    if (action.type === "BACK") {
        if (state.panelIndex > 0) {
            return {...state, panelIndex: state.panelIndex - 1};
        }
    } else if (action.type === "NEXT") {
        if (state.panelIndex < MAX_PANELS - 1) {
            return {...state, panelIndex: state.panelIndex + 1};
        }
    } else if (action.type === "MODE") {
        return {...state, mode: action.payload.mode};
    } else if (action.type === "TARGET_DIR") {
        return {...state, targetDir: action.payload.targetDir};
    } else if (action.type === "PYTHON_EXE") {
        return {...state, pythonExe: action.payload.pythonExe};
    }
    return state;
};
