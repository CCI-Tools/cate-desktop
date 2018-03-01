import * as React from "react";
import {connect} from "react-redux";
import {Button, Intent, ProgressBar} from "@blueprintjs/core";
import {
    SETUP_STATUS_CANCELLED, SETUP_STATUS_FAILED, SETUP_STATUS_IN_PROGRESS, SETUP_STATUS_SUCCEEDED, SETUP_TEST_MODE,
    SetupStatus,
    State
} from "../state";
import * as actions from "../actions";
import {TransactionProgress} from "../../../common/transaction";
import {LogField} from "../components/LogField";
import {SetupScreen} from "../components/SetupScreen";
import {isDefined, isNumber} from "../../../common/types";

interface IRunScreenProps {
    setupStatus: SetupStatus;
    error?: any;
    progress: TransactionProgress;
    logLines: string[];
    isLogOpen: boolean;
}

function mapStateToProps(state: State): IRunScreenProps {
    return {
        setupStatus: state.setupStatus,
        error: state.error,
        progress: state.progress,
        logLines: state.logLines,
        isLogOpen: state.isLogOpen,
    };
}

// For testing only
const NUM_TASKS = 30;
const NUM_SUB_PROGRESSES = 10;
const PROGRESS_TIME = 10000; // ms
const NUM_PROGRESSES = NUM_TASKS * NUM_SUB_PROGRESSES;
const PROGRESS_TIMEOUT = PROGRESS_TIME / NUM_PROGRESSES;

class _RunScreen extends React.PureComponent<IRunScreenProps & actions.DispatchProp> {
    static readonly SCREEN_STYLE: React.CSSProperties = {display: "flex", flexDirection: "column", height: "100%"};
    static readonly BUTTON_STYLE: React.CSSProperties = {marginTop: 4, marginBottom: 2, alignSelf: "flex-end"};
    static readonly ITEM_STYLE: React.CSSProperties = {marginBottom: 4};

    private timerId;
    private counter;
    private worked;

    constructor(props: IRunScreenProps) {
        super(props);
        this.handleShowLogClicked = this.handleShowLogClicked.bind(this);
        this.handleNextClicked = this.handleNextClicked.bind(this);
        this.handleCancelClicked = this.handleCancelClicked.bind(this);
    }

    handleShowLogClicked() {
        this.props.dispatch(actions.openLog());
    }

    handleNextClicked() {
        this.props.dispatch(actions.moveForward());
    }

    handleCancelClicked() {
        this.props.dispatch(actions.cancelSetup());
    }

    render() {

        const panel = (
            <div style={_RunScreen.SCREEN_STYLE}>
                {this.renderStatusMessage()}
                {this.renderProgressBar()}
                {this.renderMessageLog()}
            </div>
        );

        const canProceed = this.props.setupStatus === SETUP_STATUS_SUCCEEDED;
        return (
            <SetupScreen title="Run Setup Tasks"
                         panel={panel}
                         backButtonDisabled={true}
                         nextButtonDisabled={!canProceed}
                         onNextButtonClick={this.handleNextClicked}
                         onCancelClick={this.handleCancelClicked}
            />
        );
    }

    private renderStatusMessage() {
        const progress = this.props.progress;
        const setupStatus = this.props.setupStatus;
        let statusMessage;
        if (progress) {
            let name = progress.name;
            let message = progress.message;
            if (name && message) {
                statusMessage = `${name}: ${message}`;
            } else if (name) {
                statusMessage = name;
            } else if (message) {
                statusMessage = message;
            }
        }
        let statusIntent;
        switch (setupStatus) {
            case SETUP_STATUS_IN_PROGRESS: {
                statusMessage = statusMessage || "Executing background tasks...";
                break;
            }
            case SETUP_STATUS_SUCCEEDED: {
                statusMessage = "All tasks successfully completed.";
                statusIntent = Intent.PRIMARY;
                break;
            }
            case SETUP_STATUS_FAILED: {
                let error = this.props.error;
                if (error && error.message) {
                    statusMessage = "Setup failed: " + error.message;
                } else {
                    statusMessage = "Setup failed.";
                }
                statusIntent = Intent.DANGER;
                break;
            }
            case SETUP_STATUS_CANCELLED: {
                statusMessage = "Setup cancelled.";
                statusIntent = Intent.WARNING;
                break;
            }
        }
        return <div className={statusIntent} style={_RunScreen.ITEM_STYLE}>{statusMessage}</div>;
    }

    renderMessageLog() {
        let isLogOpen = this.props.isLogOpen;
        let logLines = this.props.logLines;
        if (isLogOpen) {
            return <LogField lines={logLines}/>
        } else if (logLines && logLines.length > 0) {
            return <Button style={_RunScreen.BUTTON_STYLE}
                           onClick={this.handleShowLogClicked}
                           text="Show Log"/>
        }
    }

    renderProgressBar() {
        const progress = this.props.progress;

        let value;
        let className;
        if (progress) {
            let worked = progress.worked;
            let totalWork = progress.totalWork;
            if (progress.done) {
                className = "pt-no-stripes";
                value = 1;
            } else if (isNumber(worked) && isNumber(totalWork)) {
                let subWorked = progress.subWorked;
                if (isNumber(subWorked)) {
                    worked += subWorked;
                }
                value = worked / totalWork;
            }
        }

        if (!isNumber(value)) {
            value = 0;
        }

        return (
            <div style={_RunScreen.ITEM_STYLE}>
                <ProgressBar className={className} value={value}/>
            </div>
        );
    }

    componentDidMount() {
        if (SETUP_TEST_MODE) {
            this.timerId = setTimeout(() => this.incProgress(), PROGRESS_TIMEOUT);
        }
    }

    componentWillUnmount() {
        if (SETUP_TEST_MODE) {
            clearTimeout(this.timerId);
        }
    }

    private incProgress() {

        if (!isDefined(this.counter)) {
            this.counter = 0;
            this.worked = 0;
        }

        let worked;
        let totalWork;
        let done;
        let name;
        let message;
        let stdout;

        if (this.counter % 10 === 0) {
            totalWork = NUM_TASKS;
            worked = this.worked;
            name = `Task ${worked + 1}`;
            message = `Running task ${worked + 1} out of ${totalWork}`;
            stdout = `\n`;
            done = worked === totalWork;
            this.worked++;
        } else {
            stdout = `\rReceived output ${this.counter} on stdout`;
        }

        this.props.dispatch(actions.updateProgress({name, message, worked, totalWork, done, stdout}));
        if (this.counter < NUM_PROGRESSES) {
            this.timerId = setTimeout(() => this.incProgress(), PROGRESS_TIMEOUT);
        } else {
            this.props.dispatch(actions.setSetupStatus(SETUP_STATUS_SUCCEEDED));
        }

        this.counter++;
    }
}

export const RunScreen = connect(mapStateToProps)(_RunScreen);
