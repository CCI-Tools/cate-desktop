import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {Button, Label, ProgressBar, Radio, RadioGroup} from "@blueprintjs/core";
import * as actions from "../actions";
import {CONDA_MODE_EXISTING, CONDA_MODE_NEW, CondaMode, State} from "../state";

interface ITaskMonitorScreenProps {
    progress: number;
}

function mapStateToProps(state: State): ITaskMonitorScreenProps {
    return {
        progress: state.progress,
    };
}

class _TaskMonitorScreen extends React.PureComponent<ITaskMonitorScreenProps & DispatchProp<ITaskMonitorScreenProps>> {
    private timerId;

    componentDidMount() {
        this.timerId = setTimeout(() => this.incProgress(), 100);
    }

    componentWillUnmount() {
        clearTimeout(this.timerId);
    }

    incProgress() {
        let progress = this.props.progress === null ? 0 : this.props.progress + 0.01;
        if (progress >= 1) {
            this.props.dispatch(actions.setProgress(1));
        } else {
            this.props.dispatch(actions.setProgress(progress));
            this.timerId = setTimeout(() => this.incProgress(), 100);
        }
    }

    render() {
        return (
            <div>
                <p>Please wait until all tasks have completed. This may take several minutes.</p>

                <ProgressBar value={this.props.progress}/>

            </div>
        );
    }
}

export const TaskMonitorScreen = connect(mapStateToProps)(_TaskMonitorScreen);
