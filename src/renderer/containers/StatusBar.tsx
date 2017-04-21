import * as React from "react";
import {connect} from "react-redux";
import {State, TaskState} from "../state";
import * as actions from "../actions";
import {Classes, Intent, Popover, PopoverInteractionKind, Position, Spinner, Tooltip} from "@blueprintjs/core";
import {JobStatusEnum} from "../webapi/Job";
import {TaskComponent} from "./TaskComponent";
import {ListBox} from "../components/ListBox";

interface IStatusBarProps {
    webAPIStatus: 'connecting' | 'open' | 'error' | 'closed' | null;
    tasks: { [jobId: number]: TaskState };
}

interface IStatusBarDispatch {
    cancelJob(number): void;
    removeJob(number): void;
}

function mapStateToProps(state: State): IStatusBarProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
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
class StatusBar extends React.Component<IStatusBarProps & IStatusBarDispatch, null> {
    constructor(props: IStatusBarProps) {
        super(props);
    }

    private renderTasks() {
        let numRunningTasks = 0;
        let numFailedTasks = 0;
        const visibleTaskIds: string[] = [];
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status === JobStatusEnum.SUBMITTED || task.status === JobStatusEnum.IN_PROGRESS) {
                numRunningTasks++;
                visibleTaskIds.push(taskId);
            } else if (task.status === JobStatusEnum.CANCELLED || task.status === JobStatusEnum.FAILED) {
                numFailedTasks++;
                visibleTaskIds.push(taskId);
            }
        }
        console.log("numRunningTasks", numRunningTasks);
        const renderItem = (jobId: number, itemIndex: number) => <TaskComponent
            jobId={jobId}
            task={this.props.tasks[jobId]}
            onRemoveJob={this.props.removeJob}
            onCancelJob={this.props.cancelJob}
        />;

        if (visibleTaskIds.length > 0) {
            let msg;
            let spinner = null;
            if (numRunningTasks > 0 && numFailedTasks > 0) {
                msg = `${numRunningTasks} running / {numFailedTasks} failed Task`;
            } else if (numRunningTasks > 0) {
                msg = `${numRunningTasks} running Task`;
            } else if (numFailedTasks > 0) {
                msg = `${numFailedTasks} failed Task`;
            }
            if (numRunningTasks > 0) {
                spinner = <div style={{
                    display: "flex",
                    flexFlow: "column",
                    justifyContent: "center",
                    width: "1.5em",
                    height: "1.5em"
                }}>
                    <Spinner className={Classes.SMALL} intent={Intent.SUCCESS}/>
                </div>;
            }
            const tasksInPopover = <ListBox style={{width: "300px"}} items={visibleTaskIds} renderItem={renderItem}/>;
            return <Popover
                content={tasksInPopover}
                position={Position.TOP}
                interactionKind={PopoverInteractionKind.HOVER}>
                <div style={{display: "flex", flexFlow: "row nowrap"}}>
                    {spinner}
                    <div style={{display: "flex", flexFlow: "column", justifyContent: "center", paddingLeft: "5px"}}>
                        {msg}
                    </div>
                </div>
            </Popover>;
        } else {
            return null;
        }
    }

    private renderBackend() {
        let iconName = null;
        let tooltipText = null;
        if (this.props.webAPIStatus === 'connecting') {
            iconName = "pt-icon-link";
            tooltipText = "Connecting";
        } else if (this.props.webAPIStatus === 'open') {
            iconName = "pt-icon-link";
            tooltipText = "Connected";
        } else if (this.props.webAPIStatus === 'error') {
            iconName = "pt-icon-offline";
            tooltipText = "Error";
        } else if (this.props.webAPIStatus === 'closed') {
            iconName = "pt-icon-offline";
            tooltipText = "Closed";
        } else {
            iconName = "pt-icon-help";
            tooltipText = "Unknown";
        }
        return <Tooltip content={tooltipText} hoverOpenDelay={1500} position={Position.LEFT_TOP}>
            <span className={`pt-icon-standard ${iconName}` }/>
        </Tooltip>;
    };

    render() {
        // TODO dummy
        const message = "";

        // TODO dummy
        const lat = 22.22;
        const lon = 11.11;
        const cursor = `LAT = ${lat.toFixed(2)} LON = ${lon.toFixed(2)}`;

        return (
            <div
                style={{
                    display: "flex",
                    flexFlow: "row nowrap",
                    height: "1.5em",
                    fontSize: "small",
                    backgroundColor: "#2B95D6"
                }}>
                <div style={{flex: "80 1 auto", padding: "1px 1px 1px 1px"}}>{message}</div>
                <div style={{flex: "20 1 auto", padding: "1px 1px 1px 1px"}}>{this.renderTasks()}</div>
                {/*<div style={{flex: "9 1 auto", padding: "1px 1px 1px 1px"}}>{cursor}</div>*/}
                <div style={{flex: "0 1 auto", marginLeft: "auto", padding: "1px 1px 1px 1px"}}>{this.renderBackend()}</div>
            </div>
        );
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(StatusBar);
