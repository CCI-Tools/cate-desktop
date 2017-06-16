import * as React from "react";
import {connect} from "react-redux";
import {State, TaskState} from "../state";
import {ListBox} from "../components/ListBox";
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
class TasksPanel extends React.Component<ITaskPanelProps & ITaskPanelDispatch, null> {
    constructor(props: ITaskPanelProps) {
        super(props);
    }

    render() {
        const visibleTaskIds: string[] = [];
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status !== JobStatusEnum.DONE) {
                visibleTaskIds.push(taskId);
            }
        }
        const renderItem = (jobId: number, itemIndex: number) => <TaskComponent
            jobId={jobId}
            task={this.props.tasks[jobId]}
            onRemoveJob={this.props.removeJob}
            onCancelJob={this.props.cancelJob}
        />;

        let panelContents;
        if (visibleTaskIds.length) {
            panelContents = (
                <ScrollablePanelContent>
                    <ListBox items={visibleTaskIds}
                             renderItem={renderItem}
                    />
                </ScrollablePanelContent>
            );
        } else {
            panelContents = (
                <Card>
                    <p><strong>There are currently no active tasks.</strong></p>
                </Card>
            );
        }

        return panelContents;
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TasksPanel);
