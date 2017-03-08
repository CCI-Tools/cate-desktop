import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, TaskState} from "../state";
import {Button, ProgressBar, Intent} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {JobStatusEnum} from "../webapi/Job";
import * as actions from "../actions";
import {Card} from "../components/Card";

interface ITaskPanelProps {
    tasks: {[jobId: number]: TaskState};
}

interface ITaskPanelDispatch {
    cancelJob(number): void;
}

function mapStateToProps(state: State): ITaskPanelProps {
    return {
        tasks: state.communication.tasks
    };
}

const mapDispatchToProps = {cancelJob: actions.cancelJob};

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

    private static isActive(tastState: TaskState): boolean {
        return tastState.status === JobStatusEnum.NEW ||
            tastState.status === JobStatusEnum.SUBMITTED ||
            tastState.status === JobStatusEnum.IN_PROGRESS;
    }

    private static isMakingProgress(tastState: TaskState): boolean {
        return tastState.status === JobStatusEnum.IN_PROGRESS &&
            tastState.progress &&
            tastState.progress.worked &&
            tastState.progress.total > 0;
    }

    private static getItemKey(jobId: number) {
        return jobId;
    }

    render() {
        const visibleTaskIds: string[] = [];
        const taskStateList: TaskState[] = [];
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status !== JobStatusEnum.DONE) {
                visibleTaskIds.push(taskId);
                taskStateList.push(task);
            }
        }
        const renderItem = (jobId: number, itemIndex: number) => {
            const taskState = taskStateList[itemIndex];
            let activity = null;
            if (TasksPanel.isActive(taskState) && TasksPanel.isMakingProgress(taskState)) {
                // cancel is only possible, if we have a progress monitor
                const cancelJob = () => this.props.cancelJob(jobId);
                const cancelButton = <Button type="button"
                                             className="pt-intent-primary"
                                             onClick={cancelJob}
                                             iconName="pt-icon-cross">Cancel</Button>;

                const progress = <div style={{padding: '0.5em'}}>
                    <ProgressBar intent={Intent.SUCCESS}
                                 value={taskState.progress.worked / taskState.progress.total}/>
                </div>;

                let message = null;
                if (taskState.progress && taskState.progress.message) {
                    message = <div style={{fontSize: '0.8em'}}>{taskState.progress.message}</div>;
                }

                // TODO (marcoz): styling issue: place progress bar and cancel button on a single line
                activity = <div>
                    {progress}
                    {cancelButton}
                    {message}
                </div>
            }
            let error = null;
            if (taskState.failure && taskState.failure.message) {
                error = <div style={{color: 'rgb(255, 0, 0)', fontSize: '0.8em'}}>{taskState.failure.message}</div>;
            }
            const title = taskState.title || visibleTaskIds[itemIndex];
            return (<div>{title}{activity}{error}</div>);
        };

        let panelContents;
        if (visibleTaskIds.length) {
            panelContents = (
                <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                    <ListBox items={visibleTaskIds}
                             getItemKey={TasksPanel.getItemKey}
                             renderItem={renderItem}
                             selectionMode={ListBoxSelectionMode.SINGLE}/>
                </div>
            );
        } else {
            panelContents = (
                <Card>
                    <p><strong>No tasks</strong></p>
                </Card>
            );
        }

        return (
            <ExpansionPanel icon="pt-icon-play" text="Tasks" isExpanded={true} defaultHeight={100}>
                {panelContents}
            </ExpansionPanel>
        );
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TasksPanel);
