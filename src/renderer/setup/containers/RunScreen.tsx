import * as React from "react";
import {connect} from "react-redux";
import {Button, Collapse, Intent, ProgressBar} from "@blueprintjs/core";
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
    progress: TransactionProgress;
    logLines: string[];
    isLogOpen: boolean;
}

function mapStateToProps(state: State): IRunScreenProps {
    return {
        setupStatus: state.setupStatus,
        progress: state.progress,
        logLines: state.logLines,
        isLogOpen: state.isLogOpen,
    };
}

const NUM_TASKS = 30;
const NUM_SUB_PROGRESSES = 10;
const PROGRESS_TIME = 10000; // ms
const NUM_PROGRESSES = NUM_TASKS * NUM_SUB_PROGRESSES;
const PROGRESS_TIMEOUT = PROGRESS_TIME / NUM_PROGRESSES;

class _RunScreen extends React.PureComponent<IRunScreenProps & actions.DispatchProp> {
    private timerId;
    private counter;
    private worked;

    constructor(props: IRunScreenProps) {
        super(props);
    }

    render() {

        const panel = (
            <div>
                {this.renderStatusMessage()}
                {this.renderProgressBar()}
                {this.renderMessageLog()}
            </div>
        );

        return (
            <SetupScreen title="Run Setup Tasks"
                         panel={panel}
                         backButtonDisabled={true}
                         nextButtonDisabled={!(this.props.setupStatus === SETUP_STATUS_SUCCEEDED)}
                         onNextButtonClick={() => this.props.dispatch(actions.moveForward())}
                         onCancelClick={() => this.props.dispatch(actions.cancelSetup())}
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
                statusMessage = statusMessage || "Setup failed.";
                statusIntent = Intent.DANGER;
                break;
            }
            case SETUP_STATUS_CANCELLED: {
                statusMessage = "Setup cancelled.";
                statusIntent = Intent.WARNING;
                break;
            }
        }
        return <div className={statusIntent} style={{marginBottom: 4}}>{statusMessage}</div>;
    }

    renderMessageLog() {
        let isLogOpen = this.props.isLogOpen;
        let logLines = this.props.logLines;
        return (
            <React.Fragment>
                <Button style={{marginTop: 4, marginBottom: 2}}
                        className="pt-small"
                        onClick={() => this.props.dispatch(actions.toggleLogOpen())}
                        iconName={isLogOpen ? "caret-up" : "caret-down"}
                        text={isLogOpen ? "Hide Log" : "Show Log"}/>
                <Collapse isOpen={isLogOpen}>
                    <LogField lines={logLines}/>
                </Collapse>
            </React.Fragment>
        );
    }

    renderProgressBar() {
        const progress = this.props.progress;
        const setupStatus = this.props.setupStatus;

        let value;
        if (progress) {
            let worked = progress.worked;
            let totalWork = progress.totalWork;
            if (progress.done) {
                // set value to zero
                value = 0;
            } else if (isNumber(worked) && isNumber(totalWork)) {
                let subWorked = progress.subWorked;
                if (isNumber(subWorked)) {
                    worked += subWorked;
                }
                value = worked / totalWork;
            }
        }

        if (!isNumber(value)) {
            if (setupStatus !== SETUP_STATUS_IN_PROGRESS) {
                // value remains undefined --> indeterminate state
            } else {
                value = 0;
            }
        }

        return <ProgressBar value={value}/>;
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
        //let stderr;
        //let error: TransactionError;

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
