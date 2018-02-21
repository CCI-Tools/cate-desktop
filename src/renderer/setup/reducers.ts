import {AnyAction, Reducer} from 'redux';
import {
    CATE_MODE_NEW_CATE_DIR, CATE_MODE_OLD_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER, SETUP_REASON_INSTALL_CATE,
    SETUP_REASON_UPDATE_CATE,
    SetupReason
} from "../../common/setup";
import {SCREEN_ID_CATE_INSTALL, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_TASK_MONITOR, State} from "./state";

const initialState: State = {
    setupInfo: {
        //setupReason: SETUP_REASON_UPDATE_CATE,
        setupReason: SETUP_REASON_INSTALL_CATE,
        newCateDir: "",
        oldCateDir: "",
        newCateVersion: "X",
        oldCateVersion: "Y",
    },
    screenId: SCREEN_ID_START,
    setupMode: SETUP_MODE_AUTO,
    cateMode: CATE_MODE_NEW_CATE_DIR,
    condaDir: "",
    newCateDir: "",
    oldCateDir: "",
    progress: null,
    validations: {},
    autoUpdateCate: true,
};

export const stateReducer: Reducer<State> = (state: State = initialState, action: AnyAction) => {
    switch (action.type) {
        case "SET_SETUP_INFO": {
            const setupInfo = action.payload.setupInfo;
            const newCateDir = setupInfo.newCateDir || state.newCateDir;
            const oldCateDir = setupInfo.oldCateDir || state.oldCateDir;
            let cateMode;
            if (setupInfo.setupReason === SETUP_REASON_INSTALL_CATE) {
                cateMode = setupInfo.oldCateDir ? CATE_MODE_NEW_CATE_DIR : state.cateMode;
            } else if (setupInfo.setupReason === SETUP_REASON_UPDATE_CATE) {
                cateMode = setupInfo.oldCateDir ? CATE_MODE_OLD_CATE_DIR : state.cateMode;
            }
            return {...state, setupInfo, newCateDir, oldCateDir, cateMode};
        }
        case "MOVE_FORWARD":
            if (state.validations[state.screenId]) {
                // Don't move forward, if this screen's validation failed.
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
                case SCREEN_ID_TASK_MONITOR:
                    switch (state.setupMode) {
                        case SETUP_MODE_AUTO:
                            return {...state, screenId: SCREEN_ID_START};
                        case SETUP_MODE_USER:
                            return {...state, screenId: SCREEN_ID_CATE_INSTALL};
                    }
                    break;
                case SCREEN_ID_END:
                    return {...state, screenId: SCREEN_ID_TASK_MONITOR};
            }
            break;
        case "SET_SETUP_MODE":
            return {...state, setupMode: action.payload.setupMode};
        case "SET_CATE_MODE":
            return {...state, cateMode: action.payload.cateMode};
        case "SET_NEW_CATE_DIR":
            return {...state, newCateDir: action.payload.newCateDir};
        case "SET_OLD_CATE_DIR":
            return {...state, oldCateDir: action.payload.oldCateDir};
        case "SET_CONDA_DIR":
            return {...state, condaDir: action.payload.condaDir};
        case "SET_PROGRESS":
            return {...state, progress: action.payload.progress};
        case "SET_VALIDATION":
            return {
                ...state,
                validations: {...state.validations, [action.payload.screenId]: action.payload.validation}
            };
        case "SET_AUTO_UPDATE_CATE":
            return {...state, autoUpdateCate: action.payload.autoUpdateCate};
    }

    return state;
};
