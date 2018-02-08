import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {State, TaskState} from "../state";
import {JobStatusEnum} from "../webapi/Job";
import * as actions from "../actions";
import {Card} from "../components/Card";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {TaskComponent} from "./TaskComponent";

interface ITaskPanelProps {
    tasks: { [jobId: number]: TaskState };
}

interface ITaskPanelDispatch {
    cancelJob(number): void;
    removeJob(number): void;
}

function mapStateToProps(state: State): ITaskPanelProps {
    return {
        tasks: state.communication.tasks
    };
}

const mapDispatchToProps = {
    cancelJob: actions.cancelJob,
    removeJob: actions.removeTaskState
};

/**
 * The TasksPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class TasksPanel extends React.Component<ITaskPanelProps & ITaskPanelDispatch & DispatchProp<State>, null> {
    constructor(props: ITaskPanelProps & ITaskPanelDispatch & DispatchProp<State>) {
        super(props);
    }

    render() {
        const tasks: { [jobId: number]: TaskState } = this.props.tasks;

        const taskComponents= [];
        for (let jobId in tasks) {
            if (tasks[jobId].status !== JobStatusEnum.DONE) {
                taskComponents.push(<TaskComponent
                    key={jobId}
                    jobId={jobId}
                    task={tasks[jobId]}
                    onRemoveJob={this.props.removeJob}
                    onCancelJob={this.props.cancelJob}
                />);
            }
        }
        if (taskComponents.length) {
            return <ScrollablePanelContent>
                {taskComponents}
            </ScrollablePanelContent>;
        } else {
            return <Card>
                <p><strong>There are currently no active tasks.</strong></p>
            </Card>;
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TasksPanel as any);
