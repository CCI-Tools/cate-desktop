import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, TaskState} from "../state";
import {ProgressBar, Intent} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {JobStatusEnum} from "../webapi/Job";

interface ITaskPanelProps {
    dispatch?: any;
    tasks: {[taskId: string]: TaskState};
}

function mapStateToProps(state: State): ITaskPanelProps {
    return {
        tasks: state.communication.tasks
    };
}

/**
 * The TasksPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class TasksPanel extends React.Component<ITaskPanelProps, null> {
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
            let pm = null;
            const tastState = taskStateList[itemIndex];
            if (TasksPanel.hasActiveProgress(tastState)) {
                pm = <div style={{padding: '0.5em'}}>
                    <ProgressBar intent={Intent.SUCCESS} value={tastState.progress.worked / tastState.progress.total}/>
                </div>
            }
            let msg = null;
            if (tastState.progress && tastState.progress.message) {
                msg = <div style={{fontSize: '0.8em'}}>{tastState.progress.message}</div>;
            }
            let error = null;
            if (tastState.failure && tastState.failure.message) {
                error = <div style={{color: 'rgb(255, 0, 0)', fontSize: '0.8em'}}>{tastState.failure.message}</div>;
            }
            return (<div>{taskIdList[itemIndex]}{pm}{msg}{error}</div>);
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
export default connect(mapStateToProps)(TasksPanel);
