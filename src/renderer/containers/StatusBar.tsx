import * as React from "react";
import {connect} from "react-redux";
import {State, TaskState} from "../state";
import {Tooltip, Position, ProgressBar, Intent} from "@blueprintjs/core";
import {JobStatusEnum} from "../webapi/Job";

interface IStatusBarProps {
    webAPIStatus: 'connecting'|'open'|'error'|'closed'|null;
    tasks: {[jobId: number]: TaskState};
}

function mapStateToProps(state: State): IStatusBarProps {
    return {
        webAPIStatus: state.communication.webAPIStatus,
        tasks: state.communication.tasks
    };
}

/**
 * The TasksPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class StatusBar extends React.Component<IStatusBarProps, null> {
    constructor(props: IStatusBarProps) {
        super(props);
    }

    render() {
        // TODO dummy
        const message = "Ready.";

        // TODO dummy
        const lat = 22.22;
        const lon = 11.11;
        const cursor = `LAT = ${lat.toFixed(2)} LON = ${lon.toFixed(2)}`;

        // TODO show summary of all tasks
        // TODO show tooltip with detailed information about the individual tasks
        // TODO code partly taken from TaskPanel => extract
        let tasksState = null;
        for (let taskId in this.props.tasks) {
            const task = this.props.tasks[taskId];
            if (task.status === JobStatusEnum.SUBMITTED || task.status === JobStatusEnum.IN_PROGRESS) {
                let progressValue = null;
                if (task.progress && task.progress.worked && task.progress.total > 0) {
                    progressValue = task.progress.worked / task.progress.total;
                }
                tasksState = <ProgressBar intent={Intent.SUCCESS} value={progressValue}/>;
                break;
            }
        }

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
        const backendState =
            <Tooltip content={tooltipText} hoverOpenDelay={1500} position={Position.LEFT_TOP}>
                <span className={`pt-icon-standard ${iconName}` }/>
            </Tooltip>;
        return (
            <div
                style={{display:"flex", flexFlow: "row nowrap", height: "1.5em", fontSize: "small", backgroundColor: "#2B95D6"}}>
                <div style={{flex: "80 0 auto", padding: "1px 1px 1px 1px"}}>{message}</div>
                <div style={{
                    flex: "9 0 auto",
                    padding: "1px 1px 1px 1px",
                    display: "flex",
                    flexFlow: "column",
                    justifyContent: "center"
                }}>{tasksState}</div>
                <div style={{flex: "9 0 auto", padding: "1px 1px 1px 1px"}}>{cursor}</div>
                <div style={{flex: "2 0 auto", padding: "1px 1px 1px 1px"}}>{backendState}</div>
            </div>
        );
    }
}
export default connect(mapStateToProps)(StatusBar);
