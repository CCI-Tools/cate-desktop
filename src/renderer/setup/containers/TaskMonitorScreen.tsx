import * as React from "react";
import {connect} from "react-redux";
import {ProgressBar} from "@blueprintjs/core";
import {State} from "../state";
import * as actions from "../actions";
import {RequirementProgress} from "../../../common/requirement";
import {LogField} from "../components/LogField";

interface ITaskMonitorScreenProps {
    progress: RequirementProgress;
    messageLog: string[];
}

function mapStateToProps(state: State): ITaskMonitorScreenProps {
    return {
        progress: state.progress,
        messageLog: state.messageLog,
    };
}

const TIMEOUT = 50;
const TOTAL_WORK = 100;

class _TaskMonitorScreen extends React.PureComponent<ITaskMonitorScreenProps & actions.DispatchProp> {
    private timerId;
    private progress;

    componentDidMount() {
        this.timerId = setTimeout(() => this.incProgress(), TIMEOUT);
    }

    componentWillUnmount() {
        clearTimeout(this.timerId);
    }

    incProgress() {
        if (!this.progress) {
            this.progress = {
                worked: 0,
                totalWork: TOTAL_WORK,
                stdout: "Tasks started"
            };
        } else {
            this.progress = {
                ...this.progress,
                worked: this.progress.worked + 1,
                stdout: `Running task ${this.progress.worked + 1} out of ${this.progress.totalWork}`
            };
        }
        this.props.dispatch(actions.updateProgress(this.progress));
        if (this.progress.worked < this.progress.totalWork) {
            this.timerId = setTimeout(() => this.incProgress(), TIMEOUT);
        }
    }

    render() {

        const progress = this.props.progress;

        if (!progress) {
            return (
                <div>
                    <p>Waiting for background tasks to be started...</p>
                </div>
            );
        }

        if (progress.worked === progress.totalWork) {
            return (
                <div>
                    <p>All tasks completed.</p>

                    <ProgressBar value={1} />

                    <LogField textElements={this.props.messageLog}/>
                </div>
            );
        } else {
            const ratio = progress.worked /progress.totalWork;
            return (
                <div>
                    <p>Please wait until all tasks have completed. This may take several minutes.</p>

                    <ProgressBar value={ratio}/>

                    <LogField textElements={this.props.messageLog}/>

                </div>
            );
        }
    }
}

export const TaskMonitorScreen = connect(mapStateToProps)(_TaskMonitorScreen);
