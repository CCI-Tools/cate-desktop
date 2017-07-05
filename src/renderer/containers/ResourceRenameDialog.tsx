import * as React from 'react';
import {State, ResourceState, DialogState} from "../state";
import {connect, DispatchProp} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ModalDialog} from "../components/ModalDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";

interface IResourceRenameDialogOwnProps {
    selectedResource: ResourceState;
}

interface IResourceRenameDialogProps extends IResourceRenameDialogOwnProps, DialogState {
    resources: ResourceState[];
    selectedResource: ResourceState;
}

interface IResourceRenameDialogState {
    newName: string;
}

function mapStateToProps(state: State, ownProps: IResourceRenameDialogOwnProps): IResourceRenameDialogProps {
    return {
        selectedResource: ownProps.selectedResource,
        isOpen: selectors.dialogStateSelector(ResourceRenameDialog.DIALOG_ID)(state).isOpen,
        resources: selectors.resourcesSelector(state),
    };
}

class ResourceRenameDialog extends React.Component<IResourceRenameDialogProps & DispatchProp<State>, IResourceRenameDialogState> {
    static readonly DIALOG_ID = 'resourceRenameDialog';
    static readonly DIALOG_TITLE = 'Rename Resource';

    constructor(props: IResourceRenameDialogProps & DispatchProp<State>) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = ResourceRenameDialog.mapPropsToState(props);
    }

    private static mapPropsToState(props: IResourceRenameDialogProps) {
        return {newName: props.selectedResource ? props.selectedResource.name : ''};
    }

    componentWillReceiveProps(nextProps: IResourceRenameDialogProps): void {
        this.setState(ResourceRenameDialog.mapPropsToState(nextProps));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(ResourceRenameDialog.DIALOG_ID));
        this.props.dispatch(actions.renameWorkspaceResource(this.props.selectedResource.name, this.state.newName));
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(ResourceRenameDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        const newName = this.state.newName ? this.state.newName.trim() : '';
        return newName !== ''
            && newName !== this.props.selectedResource.name
            && !this.props.resources.find(r => r.name === newName);
    }

    render() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={ResourceRenameDialog.DIALOG_TITLE}
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
            <ScrollablePanelContent>
                <label className="pt-label">
                    New resource name
                    <span className="pt-text-muted"> (must be unique within the workspace)</span>
                    <input className="pt-input"
                           style={{width: '100%', margin: '0.2em'}}
                           type="text"
                           value={this.state.newName}
                           onChange={(ev: any) => this.setState({newName: ev.target.value})}/>
                </label>
            </ScrollablePanelContent>
        );
    }
}

export default connect(mapStateToProps)(ResourceRenameDialog);

