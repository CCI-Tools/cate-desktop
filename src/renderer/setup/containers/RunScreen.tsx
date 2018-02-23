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

const TIMEOUT = 100;
const TOTAL_WORK = 100;

class _RunScreen extends React.PureComponent<IRunScreenProps & actions.DispatchProp> {
    private timerId;
    private progress;

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
                statusMessage = "Please wait until all tasks have completed. This may take several minutes.";
                const ratio = progress.worked / progress.totalWork;
                progressBar = <ProgressBar value={ratio}/>;
            } else {
                statusMessage = "All tasks completed.";
            }

            logPanel = (
                <React.Fragment>
                    <Button style={{marginTop: 4, marginBottom: 2}}
                            onClick={() => this.props.dispatch(actions.toggleLogOpen())}
                            iconName={this.props.isLogOpen ? "caret-up" : "caret-down"}
                            text={this.props.isLogOpen ? "Hide Log" : "Show Log"}/>
                    <Collapse isOpen={this.props.isLogOpen}>
                        <LogField lines={this.props.logLines}/>
                    </Collapse>
                </React.Fragment>
            );
        }

        const panel = (
            <div>
                <p>{statusMessage}</p>
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
            this.timerId = setTimeout(() => this.incProgress(), TIMEOUT);
        }
    }

    componentWillUnmount() {
        if (SETUP_TEST_MODE) {
            clearTimeout(this.timerId);
        }
    }

    private incProgress() {
        if (!this.progress) {
            this.progress = {
                worked: 0,
                totalWork: TOTAL_WORK,
                stdout: "Tasks started\n"
            };
        } else {
            this.progress = {
                ...this.progress,
                worked: this.progress.worked + 1,
                stdout: `Running task ${this.progress.worked + 1} out of ${this.progress.totalWork}\n`
            };
        }
        this.props.dispatch(actions.updateProgress(this.progress));
        if (this.progress.worked < this.progress.totalWork) {
            this.timerId = setTimeout(() => this.incProgress(), TIMEOUT);
        } else {
            this.props.dispatch(actions.setSetupStatus(SETUP_STATUS_SUCCEEDED));
        }
    }
}

export const RunScreen = connect(mapStateToProps)(_RunScreen);
