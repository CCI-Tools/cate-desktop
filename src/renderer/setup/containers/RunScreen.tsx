import * as React from "react";
import {connect} from "react-redux";
import {Button, Collapse, ProgressBar} from "@blueprintjs/core";
import {
    SETUP_STATUS_CANCELLED, SETUP_STATUS_FAILED, SETUP_STATUS_SUCCEEDED, SETUP_TEST_MODE, SetupStatus,
    State
} from "../state";
import * as actions from "../actions";
import {RequirementProgress} from "../../../common/requirement";
import {LogField} from "../components/LogField";
import {SetupScreen} from "../components/SetupScreen";
import {isDefined} from "../../../common/types";

interface IRunScreenProps {
    setupStatus: SetupStatus;
    progress: RequirementProgress;
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

        const progress = this.props.progress;

        let statusMessage;
        let progressBar;
        let logPanel;
        if (!progress) {
            statusMessage = "Waiting for background tasks to be started...";
            progressBar = <ProgressBar/>;
        } else {
            if (progress.worked < progress.totalWork) {
                let name = progress.name;
                let message = progress.message;
                if (name || message) {
                    if (name && message) {
                        statusMessage = `${name}: ${message}`;
                    } else if (name) {
                        statusMessage = name;
                    } else if (message) {
                        statusMessage = message;
                    } else {
                        statusMessage = "Running setup tasks. This may take several minutes.";
                    }
                }
                const ratio = progress.worked / progress.totalWork;
                progressBar = <ProgressBar value={ratio}/>;
            } else {
                statusMessage = "All tasks completed.";
            }

            let messageField;
            if (!this.props.isLogOpen) {
                let name = progress.name;
                let message = progress.message;
                if (name || message) {
                    messageField = (
                        <div>
                            <h5>{name}</h5>
                            <span>{message}</span>
                        </div>
                    );
                }
            }

            logPanel = (
                <React.Fragment>
                    <Button style={{marginTop: 4, marginBottom: 2}}
                            className="pt-small"
                            onClick={() => this.props.dispatch(actions.toggleLogOpen())}
                            iconName={this.props.isLogOpen ? "caret-up" : "caret-down"}
                            text={this.props.isLogOpen ? "Hide Log" : "Show Log"}/>
                    <Collapse isOpen={this.props.isLogOpen}>
                        <LogField lines={this.props.logLines}/>
                    </Collapse>
                </React.Fragment>
            );
        }

        const messagePanel = <div style={{marginBottom: 4}}>{statusMessage}</div>;

        const panel = (
            <div>
                {messagePanel}
                {progressBar}
                {logPanel}
            </div>
        );

        const isDone = this.props.setupStatus === SETUP_STATUS_SUCCEEDED
                       || this.props.setupStatus === SETUP_STATUS_FAILED
                       || this.props.setupStatus === SETUP_STATUS_CANCELLED;

        return <SetupScreen
            title="Run Setup Tasks"
            panel={panel}
            backButtonDisabled={true}
            nextButtonDisabled={!isDone}
            onNextButtonClick={() => this.props.dispatch(actions.moveForward())}
            onCancelClick={() => this.props.dispatch(actions.cancelSetup())}
        />;
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
        let name;
        let message;
        let stdout;
        //let stderr;
        //let error: RequirementError;

        if (this.counter % 10 === 0) {
            totalWork = NUM_TASKS;
            worked = this.worked;
            name = `Task ${worked + 1}`;
            message = `Running task ${worked + 1} out of ${totalWork}`;
            stdout = `\n`;
            this.worked++;
        } else {
            stdout = `\rReceived output ${this.counter} on stdout`;
        }

        this.props.dispatch(actions.updateProgress({name, message, worked, totalWork, stdout}));
        if (this.counter < NUM_PROGRESSES) {
            this.timerId = setTimeout(() => this.incProgress(), PROGRESS_TIMEOUT);
        } else {
            this.props.dispatch(actions.setSetupStatus(SETUP_STATUS_SUCCEEDED));
        }

        this.counter++;
    }
}

export const RunScreen = connect(mapStateToProps)(_RunScreen);
