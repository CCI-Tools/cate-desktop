import * as React from "react";
import {connect, Dispatch} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, TaskState} from "../state";
import {ProgressBar, Intent} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {JobStatusEnum} from "../webapi/Job";
import * as actions from "../actions";
import {Button} from "../../../app/node_modules/@blueprintjs/core/dist/components/button/buttons";

interface ITaskPanelProps {
    tasks: {[taskId: string]: TaskState};
}

interface ITaskPanelDispatch {
    cancel: (number) => void;
}

function mapStateToProps(state: State): ITaskPanelProps {
    return {
        tasks: state.communication.tasks
    };
}

function mapDispatchToProps(dispatch: Dispatch<State>): ITaskPanelDispatch {
    return {
        cancel: (jobId) => {
            dispatch(actions.cancelJob(jobId))
        }
    };
}

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

    private static hasActiveProgress(tastState: TaskState): boolean {
        return tastState.status === JobStatusEnum.IN_PROGRESS &&
            tastState.progress &&
            tastState.progress.worked &&
            tastState.progress.total > 0;
    }

    render() {
        const taskIdList: string[] = [];
        const taskStateList: TaskState[] = [];
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status !== JobStatusEnum.DONE) {
                taskIdList.push(taskId);
                taskStateList.push(task);
            }
        }
        const renderItem = (itemIndex: number) => {
            let activity = null;
            const taskState = taskStateList[itemIndex];
            if (TasksPanel.hasActiveProgress(taskState)) {
                const progress = <div style={{padding: '0.5em'}}>
                    <ProgressBar intent={Intent.SUCCESS}
                                 value={taskState.progress.worked / taskState.progress.total}/>
                </div>;
                if (taskState.jobId) {
                    const cancelJob = () => this.props.cancel(taskState.jobId);
                    const cancelButton = <Button type="button"
                                                 className="pt-intent-primary"
                                                 onClick={cancelJob}
                                                 iconName="pt-icon-cross">Cancel</Button>;

                    activity = <div>
                        {progress}
                        {cancelButton}
                    </div>
                } else {
                    activity =progress;
                }
            }
            let msg = null;
            if (taskState.progress && taskState.progress.message) {
                msg = <div style={{fontSize: '0.8em'}}>{taskState.progress.message}</div>;
            }
            let error = null;
            if (taskState.failure && taskState.failure.message) {
                error = <div style={{color: 'rgb(255, 0, 0)', fontSize: '0.8em'}}>{taskState.failure.message}</div>;
            }
            const title = taskState.jobTitle || taskIdList[itemIndex];
            return (<div>{title}{activity}{msg}{error}</div>);
        };
        return (
            <ExpansionPanel icon="pt-icon-play" text="Tasks" isExpanded={true} defaultHeight={400}>
                <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                    <ListBox numItems={taskIdList.length}
                             getItemKey={index => taskIdList[index]}
                             renderItem={renderItem}
                             selectionMode={ListBoxSelectionMode.SINGLE}/>
                </div>
            </ExpansionPanel>
        );

    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TasksPanel);
