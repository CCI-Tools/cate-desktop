import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "./ExpansionPanel";
import {State, TaskState} from "../state";
import {ProgressBar} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "./ListBox";
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
 * The TaskPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class TaskPanel extends React.Component<ITaskPanelProps, null> {
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
            taskIdList.push(taskId);
            taskStateList.push(this.props.tasks[taskId]);
        }
        const renderItem = (itemIndex: number) => {
            let pm = null;
            const tastState = taskStateList[itemIndex];
            if (TaskPanel.hasActiveProgress(tastState)) {
                pm = <ProgressBar value={tastState.progress.worked / tastState.progress.total}/>;
            }
            let msg = null;
            if (tastState.progress && tastState.progress.message) {
                msg = <span style={{color: 'rgba(0,255,0,0.8)', fontSize: '0.8em'}}>{tastState.progress.message}</span>
            }
            return (<span>{taskIdList[itemIndex]}{pm} {msg}</span>);
        };
        return (
            <ExpansionPanel icon="pt-icon-database" text="Tasks" isExpanded={true} defaultHeight={400}>
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
export default connect(mapStateToProps)(TaskPanel);
