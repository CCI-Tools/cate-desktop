import * as React from 'react';
import { ModalDialog } from "../components/ModalDialog";
import {
    ERROR_CODE_INVALID_PARAMS,
    getJobFailureIconName, getJobFailureTitle,
    JobFailure
} from "../webapi";
import { Button, Checkbox, Collapse, IconName, Label } from "@blueprintjs/core";
import * as selectors from "../selectors";
import { State } from "../state";
import { connect, DispatchProp } from "react-redux";
import * as actions from "../actions";

interface IJobFailureDialogProps {
    isOpen: boolean;
    jobTitle: string;
    jobFailure: JobFailure;
}

interface IJobFailureDialogState {
    copyReport: boolean;
    showDetails: boolean;
}

function mapStateToProps(state: State): IJobFailureDialogProps {
    const dialogState = selectors.dialogStateSelector(JobFailureDialog.DIALOG_ID)(state) as any;
    return {
        isOpen: dialogState.isOpen,
        jobTitle: dialogState.jobTitle,
        jobFailure: dialogState.jobFailure,
    };
}


class JobFailureDialog extends React.Component<DispatchProp<State> & IJobFailureDialogProps, IJobFailureDialogState> {

    static readonly DIALOG_ID = 'jobFailureDialog';

    constructor(props: IJobFailureDialogProps) {
        super(props);
        this.renderBody = this.renderBody.bind(this);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleCopyReport = this.handleCopyReport.bind(this);
        this.handleShowDetails = this.handleShowDetails.bind(this);
        this.state = {copyReport: false, showDetails: false};
    }

    handleConfirm() {
        if (this.state.copyReport) {
            let title = this.props.jobTitle;
            let failure = this.props.jobFailure;
            let report = `Job: ${title}\nMessage: ${failure.message}\n`;
            report += `Code: ${failure.code}\n`;
            if (failure.data) {
                if (failure.data.method) {
                    report += `Method: ${failure.data.method}\n`;
                }
                if (failure.data.exception) {
                    report += `Exception: ${failure.data.exception}\n`;
                }
                if (failure.data.traceback) {
                    report += `\n${failure.data.traceback}\n`;
                }
            }
            actions.copyTextToClipboard(report);
        }
        this.props.dispatch(actions.hideDialog(JobFailureDialog.DIALOG_ID));
    }

    handleCancel() {
        this.props.dispatch(actions.hideDialog(JobFailureDialog.DIALOG_ID));
    }

    handleCopyReport(event) {
        this.setState({copyReport: event.target.checked});
    }

    handleShowDetails() {
        this.setState({showDetails: !this.state.showDetails});
    }

    render() {
        if (!this.props.isOpen || !this.props.jobFailure) {
            return null;
        }
        const iconName = getJobFailureIconName(this.props.jobFailure) as IconName;
        const title = getJobFailureTitle(this.props.jobFailure);
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         iconName={iconName}
                         title={title}
                         onConfirm={this.handleConfirm}
                         onCancel={this.handleCancel}
                         noCancelButton={true}
                         renderBody={this.renderBody}/>
        );
    }

    renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        let messageText = this.props.jobFailure.message;
        if (!messageText) {
            messageText = `An unknown error occurred (code ${this.props.jobFailure.code}).`;
        }
        let message = (
            <div>
                <p>Oops, Cate couldn't carry out the request <em>{this.props.jobTitle}</em> because:</p>
                <h6 className="user-selectable">{messageText}</h6>
            </div>
        );

        let traceback;
        if (this.props.jobFailure.data && this.props.jobFailure.data.traceback) {
            traceback = (
                <div style={{marginTop: '0.5em'}}>
                    <Button onClick={this.handleShowDetails}>{this.state.showDetails ? "Hide" : "Show"} Details</Button>
                    <Collapse isOpen={this.state.showDetails}>
                        <pre className="user-selectable"
                             style={{overflow: 'auto', height: '20em'}}>{this.props.jobFailure.data.traceback}</pre>
                    </Collapse>
                </div>
            );
        }

        let reporting;
        if (this.props.jobFailure.code !== ERROR_CODE_INVALID_PARAMS) {
            reporting = (
                <Label
                    style={{marginTop: '0.5em'}}
                    text={<span className="pt-text-muted">Please consider reporting this issue in Cate's <a
                        href="https://github.com/CCI-Tools/cate/issues" target="_blank">issue tracker</a>.</span>}
                >
                    <Checkbox label='Copy error report to clipboard'
                              checked={this.state.copyReport}
                              onChange={this.handleCopyReport}/>
                </Label>
            );
        }

        return (
            <React.Fragment>
                {message}
                {traceback}
                {reporting}
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps)(JobFailureDialog);
