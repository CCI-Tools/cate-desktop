import * as React from "react";
import {CSSProperties} from "react";
import {TaskState} from "../state";
import {AnchorButton, Intent, ProgressBar} from "@blueprintjs/core";
import {JobStatusEnum} from "../webapi/Job";
import {Card} from "../components/Card";
import * as actions from "../actions";

interface ITaskComponentProps {
    task: TaskState;
    jobId: string;
    onCancelJob(number): void;
    onRemoveJob(number): void;
}

export class TaskComponent extends React.Component<ITaskComponentProps, null> {
    static readonly FLEX_ROW_STYLE: CSSProperties = {display: 'flex', flexFlow: 'row nowrap', width: '100%'};
    static readonly PROGRESS_STYLE: CSSProperties = {
        flex: "3 1 auto",
        display: "flex",
        flexFlow: "column",
        justifyContent: "center",
        paddingRight: 10
    };
    constructor(props: ITaskComponentProps) {
        super(props);
    }

    private static isRunning(taskState: TaskState): boolean {
        return taskState.status === JobStatusEnum.NEW ||
            taskState.status === JobStatusEnum.SUBMITTED ||
            taskState.status === JobStatusEnum.IN_PROGRESS;
    }

    private static isMakingProgress(taskState: TaskState): boolean {
        return taskState.status === JobStatusEnum.IN_PROGRESS && !!taskState.progress;
    }

    private static renderIcon(icon: string, intent: string) {
        return <span
            className={"pt-icon-standard pt-icon-" + icon + " pt-intent-" + intent}
            style={{paddingRight: '0.4em'}}/>;
    }

    render() {
        const taskState = this.props.task;
        const jobId = this.props.jobId;

        let title = taskState.title || `Task #${jobId}`;
        let body = null;

        if (TaskComponent.isRunning(taskState)) {
            if (TaskComponent.isMakingProgress(taskState)) {
                // cancel is only possible, if we have a progress monitor
                let progressValue = 0;
                if (taskState.progress.total > 0 && taskState.progress.worked > 0) {
                    progressValue = taskState.progress.worked / taskState.progress.total;
                }
                const progressBar = <ProgressBar intent={Intent.SUCCESS} value={progressValue}/>;
                const cancelJob = () => this.props.onCancelJob(jobId);
                const cancelButton = <AnchorButton type="button" onClick={cancelJob} text="Cancel"/>;

                const cancelableProgress = <div style={TaskComponent.FLEX_ROW_STYLE}>
                    <div style={TaskComponent.PROGRESS_STYLE}>{progressBar}</div>
                    <div style={{flex: "0 1 auto"}}>{cancelButton}</div>
                </div>;

                let progressMag = null;
                if (taskState.progress && taskState.progress.message) {
                    progressMag = <div className="pt-text-muted">{taskState.progress.message}</div>;
                }
                body = <div>{cancelableProgress}{progressMag}</div>
            } else {
                body = <ProgressBar/>
            }
        } else if (taskState.status === JobStatusEnum.CANCELLED || taskState.status === JobStatusEnum.FAILED) {
            const removeJob = () => this.props.onRemoveJob(jobId);
            let detailsButton;
            let message;
            if (taskState.status === JobStatusEnum.CANCELLED) {
                message = <div>{TaskComponent.renderIcon("hand", "warning")}Task has been cancelled by the user.</div>
            } else {
                const showFailureDetails = () => {
                    actions.showMessageBox({
                        type: "error",
                        title: "Cate - Error",
                        message: taskState.failure.message,
                        detail: `An error (code ${taskState.failure.code}) occurred while executing a backend process:\n\n${taskState.failure.data}`,
                        buttons: [],
                    }, actions.MESSAGE_BOX_NO_REPLY);
                };
                detailsButton = <AnchorButton onClick={showFailureDetails}>Details</AnchorButton>;
                message = <div>{TaskComponent.renderIcon("warning-sign", "danger")}Task has failed:<br/>
                    <div className="pt-text-muted" style={{paddingTop: '0.4em'}}>{taskState.failure.message}</div></div>;
            }
            body = <div>
                <div className="pt-button-group pt-minimal" style={{float: 'right'}}>
                    {detailsButton}
                    <AnchorButton iconName="cross" onClick={removeJob}/>
                </div>
                {message}
            </div>;
        }
        return (<Card><h5>{title}</h5>{body}</Card>);
    };
}
