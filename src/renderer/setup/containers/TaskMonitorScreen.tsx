import * as React from "react";
import {connect} from "react-redux";
import {ProgressBar} from "@blueprintjs/core";
import {State} from "../state";
import * as actions from "../actions";

interface ITaskMonitorScreenProps {
    progress: number;
}

function mapStateToProps(state: State): ITaskMonitorScreenProps {
    return {
        progress: state.progress,
    };
}

class _TaskMonitorScreen extends React.PureComponent<ITaskMonitorScreenProps & actions.DispatchProp> {
    private timerId;

    componentDidMount() {
        this.timerId = setTimeout(() => this.incProgress(), 100);
    }

    componentWillUnmount() {
        clearTimeout(this.timerId);
    }

    incProgress() {
        let progress = this.props.progress === null ? 0 : this.props.progress + 0.1;
        if (progress >= 1) {
            this.props.dispatch(actions.setProgress(1));
        } else {
            this.props.dispatch(actions.setProgress(progress));
            this.timerId = setTimeout(() => this.incProgress(), 100);
        }
    }

    render() {
        if (this.props.progress === 1) {
            return (
                <div>
                    <p>All tasks completed.</p>
                </div>
            );
        } else {
            return (
                <div>
                    <p>Please wait until all tasks have completed. This may take several minutes.</p>

                    <ProgressBar value={this.props.progress}/>

                </div>
            );
        }
    }
}

export const TaskMonitorScreen = connect(mapStateToProps)(_TaskMonitorScreen);
