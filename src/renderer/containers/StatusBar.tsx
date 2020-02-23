import * as React from "react";
import {CSSProperties} from "react";
import {connect, DispatchProp} from "react-redux";
import { GeographicPosition, State, TaskState, WebAPIStatus } from "../state";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Intent, Popover, PopoverInteractionKind, Position, ProgressBar, Tooltip} from "@blueprintjs/core";
import {JobStatusEnum} from "../webapi";
import TaskComponent from "./TaskComponent";

interface IStatusBarProps {
    webAPIStatus: WebAPIStatus;
    tasks: { [jobId: number]: TaskState };
    globePosition: GeographicPosition | null;
}

interface IStatusBarDispatch {
    cancelJob(number): void;

    removeJob(number): void;
}

function mapStateToProps(state: State): IStatusBarProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
        tasks: state.communication.tasks,
        globePosition: selectors.globeMousePositionSelector(state) || selectors.globeViewPositionSelector(state),
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
class StatusBar extends React.Component<IStatusBarProps & IStatusBarDispatch & DispatchProp<State>, null> {

    static readonly DIV_STYLE: CSSProperties = {
        flex: "none",
        display: "flex",
        flexFlow: "row nowrap",
        height: "1.5em",
        fontSize: "small",
        backgroundColor: "#2B95D6",
        overflow: "hidden",
    };

    private renderTasks() {
        const tasks: { [jobId: number]: TaskState } = this.props.tasks;

        let numRunningTasks = 0;
        let numFailedTasks = 0;
        const taskComponents = [];
        for (let jobId in tasks) {
            const task = tasks[jobId];
            let render = false;
            if (task.status === JobStatusEnum.SUBMITTED || task.status === JobStatusEnum.IN_PROGRESS) {
                numRunningTasks++;
                render = true;
            } else if (task.status === JobStatusEnum.CANCELLED || task.status === JobStatusEnum.FAILED) {
                numFailedTasks++;
                render = true;
            }
            if (render) {
                taskComponents.push(
                    <TaskComponent
                        key={jobId}
                        jobId={jobId}
                        task={this.props.tasks[jobId]}
                        onRemoveJob={this.props.removeJob}
                        onCancelJob={this.props.cancelJob}
                    />);
            }
        }

        if (taskComponents.length > 0) {
            let msg;
            let spinner = null;
            if (numRunningTasks > 0 && numFailedTasks > 0) {
                msg = `${numRunningTasks} running / ${numFailedTasks} failed task(s)`;
            } else if (numRunningTasks > 0) {
                msg = `${numRunningTasks} running task(s)`;
            } else if (numFailedTasks > 0) {
                msg = `${numFailedTasks} failed task(s)`;
            }
            if (numRunningTasks > 0) {
                spinner = (
                    <div style={{
                        display: "flex",
                        flexFlow: "column",
                        justifyContent: "center",
                        width: "12em",
                        height: "1.5em"
                    }}>
                        <ProgressBar intent={Intent.SUCCESS}/>
                    </div>);
            }
            const tasksInPopover = <div style={{width: "300px"}}>{taskComponents}</div>;
            return (
                <Popover
                    content={tasksInPopover}
                    position={Position.TOP}
                    interactionKind={PopoverInteractionKind.HOVER}>
                    <div style={{display: "flex", flexFlow: "row nowrap"}}>
                        {spinner}
                        <div
                            style={{display: "flex", flexFlow: "column", justifyContent: "center", paddingLeft: "5px"}}>
                            {msg}
                        </div>
                    </div>
                </Popover>
            );
        } else {
            return null;
        }
    }

    private renderBackendStatus() {
        let icon = null;
        let tooltipText = null;
        if (this.props.webAPIStatus === 'connecting') {
            icon = "pt-icon-link";
            tooltipText = "Connecting";
        } else if (this.props.webAPIStatus === 'open') {
            icon = "pt-icon-link";
            tooltipText = "Connected";
        } else if (this.props.webAPIStatus === 'error') {
            icon = "pt-icon-offline";
            tooltipText = "Error";
        } else if (this.props.webAPIStatus === 'closed') {
            icon = "pt-icon-offline";
            tooltipText = "Closed";
        } else {
            icon = "pt-icon-help";
            tooltipText = "Unknown";
        }
        return (
            <Tooltip content={tooltipText} hoverOpenDelay={1500} position={Position.LEFT_TOP}>
                <span className={`pt-icon-small ${icon}`}/>
            </Tooltip>
        );
    };

    render() {
        // TODO dummy
        const message = "Ready.";

        let cursor;
        let position = this.props.globePosition;
        if (position) {
            cursor = `lon=${position.longitude.toFixed(2)}, lat=${position.latitude.toFixed(2)}`
        } else {
            cursor = '';
        }

        return (
            <div style={StatusBar.DIV_STYLE}>
                <div style={{flex: "60 1 auto", padding: 2}}>{message}</div>
                <div style={{flex: "20 1 auto", padding: 2}}>{this.renderTasks()}</div>
                <div style={{flex: "20 1 auto", padding: 1}}>{cursor}</div>
                <div style={{
                    flex: "0 1 auto",
                    padding: 2
                }}>{this.renderBackendStatus()}</div>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(StatusBar as any);
