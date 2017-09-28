import * as React from 'react';
import {State, ResourceState, DialogState, WorkflowStepState} from "../state";
import {connect, DispatchProp} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import * as assert from "../../common/assert";
import {ModalDialog} from "../components/ModalDialog";
import {Checkbox} from "@blueprintjs/core";

const DIALOG_ID = 'workflowStepPropertiesDialog';
const DIALOG_TITLE = 'Workflow Step & Resource Properties';

interface IResourcePropertiesDialogOwnProps {
    selectedWorkflowStep: WorkflowStepState;
}

interface IWorkflowStepPropertiesDialogProps extends IResourcePropertiesDialogOwnProps, DialogState {
    resources: ResourceState[];
}

interface IWorkflowStepPropertiesDialogState {
    stepId: string;
    stepPersistent: boolean;
}

function mapStateToProps(state: State, ownProps: IResourcePropertiesDialogOwnProps): IWorkflowStepPropertiesDialogProps {
    return {
        selectedWorkflowStep: ownProps.selectedWorkflowStep,
        isOpen: selectors.dialogStateSelector(DIALOG_ID)(state).isOpen,
        resources: selectors.resourcesSelector(state),
    };
}

class WorkflowStepPropertiesDialog extends React.Component<IWorkflowStepPropertiesDialogProps & DispatchProp<State>, IWorkflowStepPropertiesDialogState> {

    constructor(props: IWorkflowStepPropertiesDialogProps & DispatchProp<State>) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = WorkflowStepPropertiesDialog.mapPropsToState(props);
    }

    private static mapPropsToState(props: IWorkflowStepPropertiesDialogProps) {
        const step = props.selectedWorkflowStep;
        assert.ok(step);
        return {
            stepId: step.id || '',
            stepPersistent: step.persistent || false,
        };
    }

    componentWillReceiveProps(nextProps: IWorkflowStepPropertiesDialogProps): void {
        this.setState(WorkflowStepPropertiesDialog.mapPropsToState(nextProps));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(DIALOG_ID));

        const oldStepId = this.props.selectedWorkflowStep.id || '';
        const newStepId = this.state.stepId ? this.state.stepId.trim() : '';
        const oldStepPersistent = this.props.selectedWorkflowStep.persistent || false;
        const newStepPersistent = this.state.stepPersistent || false;

        if (oldStepPersistent !== newStepPersistent) {
            this.props.dispatch(actions.setWorkspaceResourcePersistence(oldStepId, newStepPersistent));
        }
        if (oldStepId !== newStepId) {
            this.props.dispatch(actions.renameWorkspaceResource(oldStepId, newStepId));
        }
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(DIALOG_ID));
    }

    private canConfirm(): boolean {
        const oldStepId = this.props.selectedWorkflowStep.id || '';
        const newStepId = this.state.stepId ? this.state.stepId.trim() : '';
        const oldStepPersistent = this.props.selectedWorkflowStep.persistent || false;
        const newStepPersistent = this.state.stepPersistent || false;
        const newStepIdIsValid = /^[a-zA-z_][a-zA-z0-9_]$/.test(newStepId);
        return newStepId !== '' && (newStepId !== oldStepId || newStepPersistent !== oldStepPersistent) && newStepIdIsValid;
    }

    render() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={DIALOG_TITLE}
                iconName="edit"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        return (
            <div style={{width: '100%', padding: 6}}>
                <label className="pt-label">
                    Resource name
                    <span className="pt-text-muted"> (must be unique within the workspace)</span>
                    <input className="pt-input"
                           style={{width: '100%'}}
                           type="text"
                           value={this.state.stepId}
                           onChange={(ev: any) => this.setState({stepId: ev.target.value})}/>
                    <span className="pt-text-muted">The Resource name must only contain the uppercase and lowercase letters A through Z,
                        the underscore _ and, except for the first character, the digits 0 through 9.</span>
                </label>

                <div style={{paddingTop: 10}}>
                    <Checkbox checked={this.state.stepPersistent}
                              onChange={(ev: any) => this.setState({stepPersistent: ev.target.checked})}
                              label="Persist resulting resource"
                    />
                    <span className="pt-text-muted">If checked, the resource will be read from a file in the workspac next time the workspace is opened.
                        This usually speeds up the loading of workspace, but requires extra disk space.</span>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(WorkflowStepPropertiesDialog);

