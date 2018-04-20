import {AnyAction, Reducer} from 'redux';
import {
    CATE_MODE_NEW_CATE_DIR, CATE_MODE_OLD_CATE_DIR, SETUP_MODE_AUTO, SETUP_MODE_USER, SETUP_REASON_INSTALL_CATE,
    SETUP_REASON_UPDATE_CATE,
    SetupReason
} from "../../common/setup";
import {
    SCREEN_ID_CONFIG, SCREEN_ID_END, SCREEN_ID_START, SCREEN_ID_RUN, SETUP_STATUS_NOT_STARTED,
    State, SETUP_STATUS_SUCCEEDED, SETUP_STATUS_CANCELLED, SETUP_STATUS_FAILED, SETUP_STATUS_IN_PROGRESS
} from "./state";
import {parseTerminalOutput, TEXT_LINE_TYPE, TextLineType} from "../../common/terminal-output";
import {updateConditionally2} from "../../common/objutil";

const initialState: State = {
    setupInfo: {
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
    logLines: [],
    validations: {},
    setupStatus: SETUP_STATUS_NOT_STARTED,
    error: null,
    autoUpdateCate: true,
    isLogOpen: false,
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
            let hasErrors = !!state.validations[state.screenId];
            if (hasErrors) {
                const isStartAndUserDefined = state.screenId === SCREEN_ID_START && state.setupMode === SETUP_MODE_USER;
                if (!isStartAndUserDefined) {
                    return state;
                }
            }
            switch (state.screenId) {
                case SCREEN_ID_START:
                    switch (state.setupMode) {
                        case SETUP_MODE_AUTO:
                            if (state.setupStatus === SETUP_STATUS_NOT_STARTED) {
                                return {...state, screenId: SCREEN_ID_RUN};
                            }
                            break;
                        case SETUP_MODE_USER:
                            return {...state, screenId: SCREEN_ID_CONFIG};
                    }
                    break;
                case SCREEN_ID_CONFIG:
                    if (state.setupStatus === SETUP_STATUS_NOT_STARTED) {
                        return {...state, screenId: SCREEN_ID_RUN};
                    }
                    break;
                case SCREEN_ID_RUN:
                    if (state.setupStatus === SETUP_STATUS_SUCCEEDED
                        || state.setupStatus === SETUP_STATUS_FAILED
                        || state.setupStatus === SETUP_STATUS_CANCELLED ) {
                        return {...state, screenId: SCREEN_ID_END};
                    }
                    break;
            }
            break;
        case "MOVE_BACK":
            switch (state.screenId) {
                case SCREEN_ID_CONFIG:
                    return {...state, screenId: SCREEN_ID_START};
                case SCREEN_ID_RUN:
                    // We cannot leave SCREEN_ID_RUN
                    break;
                case SCREEN_ID_END:
                    return {...state, screenId: SCREEN_ID_RUN};
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
        case "SET_VALIDATION":
            return {
                ...state,
                validations: {...state.validations, [action.payload.screenId]: action.payload.validation}
            };
        case "SET_SETUP_STATUS":
            return {...state, setupStatus: action.payload.setupStatus, error: action.payload.error};
        case "OPEN_LOG":
            return {...state, isLogOpen: true};
        case "UPDATE_PROGRESS": {
            const progressDelta = action.payload.progress;
            let logLines = state.logLines;
            let setupStatus = state.setupStatus;
            if (progressDelta.stdout) {
                logLines = parseTerminalOutput(progressDelta.stdout, TEXT_LINE_TYPE, logLines);
            }
            if (progressDelta.stderr) {
                logLines = parseTerminalOutput(progressDelta.stderr, TEXT_LINE_TYPE, logLines);
            }
            const error = progressDelta.error;
            const progress = updateConditionally2(state.progress, progressDelta);
            if (error) {
                let errDump = error.stack || error.message || error.name;
                if (errDump) {
                    logLines = logLines.slice();
                    logLines.push(`\n${errDump}\n`);
                }
                setupStatus = SETUP_STATUS_FAILED;
            }
            return {...state, setupStatus, progress, logLines};
        }
        case "SET_AUTO_UPDATE_CATE":
            return {...state, autoUpdateCate: action.payload.autoUpdateCate};
    }

    return state;
};
