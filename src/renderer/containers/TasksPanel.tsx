import * as React from "react";
import {connect} from "react-redux";
import {State, TaskState} from "../state";
import {Button, ProgressBar, Intent} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {JobStatusEnum} from "../webapi/Job";
import * as actions from "../actions";
import {Card} from "../components/Card";
import {ScrollablePanelContent} from "../components/ScrollableContent";

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
    removeJob: actions.removeJob
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
            if (TasksPanel.isActive(taskState)) {
                if (TasksPanel.isMakingProgress(taskState)) {
                    const progress = <ProgressBar intent={Intent.SUCCESS}
                                                  value={taskState.progress.worked / taskState.progress.total}/>;
                    // cancel is only possible, if we have a progress monitor
                    const cancelJob = () => this.props.cancelJob(jobId);
                    const cancelButton = <Button type="button"
                                                 className="pt-intent-primary"
                                                 onClick={cancelJob}
                                                 iconName="pt-icon-cross">Cancel</Button>;


                    const cancelableProgress = <div style={{display: "flex", flexFlow: "row nowrap", width: "100%"}}>
                        <div style={{
                            flex: "3 1 auto",
                            display: "flex",
                            flexFlow: "column",
                            justifyContent: "center",
                            padding: "1px 1px 1px 1px"
                        }}>{progress}</div>
                        <div style={{flex: "0 1 auto"}}>{cancelButton}</div>
                    </div>;

                    let progressMag = null;
                    if (taskState.progress && taskState.progress.message) {
                        progressMag = <div style={{fontSize: '0.8em'}}>{taskState.progress.message}</div>;
                    }
                    activity = <div>{cancelableProgress}{progressMag}</div>
                } else {
                    activity = <ProgressBar/>
                }
            }
            let errorMsg = null;
            if (taskState.failure && taskState.failure.message) {
                const removeJob = () => this.props.removeJob(jobId);
                errorMsg = <div style={{display: "flex", flexFlow: "row nowrap", width: "100%"}}>
                    <div className="pt-intent-danger" style={{flex: "0 1 auto", color: 'rgb(255, 0, 0)', fontSize: '0.8em'}}>{taskState.failure.message}</div>
                    <div style={{flex: "10 1 auto"}}/>
                    <Button style={{flex: "0 1 auto"}} iconName="cross" onClick={removeJob}/>
                </div>;
            }
            const title = taskState.title || visibleTaskIds[itemIndex];
            return (<div>{title}{activity}{errorMsg}</div>);
        };

        let panelContents;
        if (visibleTaskIds.length) {
            panelContents = (
                <ScrollablePanelContent>
                    <ListBox items={visibleTaskIds}
                             getItemKey={TasksPanel.getItemKey}
                             renderItem={renderItem}
                             selectionMode={ListBoxSelectionMode.SINGLE}/>
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
