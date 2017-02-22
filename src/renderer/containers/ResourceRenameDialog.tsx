import * as React from 'react';
import {Dialog, Classes, Button} from "@blueprintjs/core";
import {State, ResourceState, DialogState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";

interface IResourceRenameDialogProps extends DialogState {
    dispatch?: any;
    resources: ResourceState[];
    selectedResource: ResourceState;
}

interface IResourceRenameDialogState {
    newName: string;
}

function mapStateToProps(state: State): IResourceRenameDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(ResourceRenameDialog.DIALOG_ID)(state).isOpen,
        resources: selectors.resourcesSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
    };
}

class ResourceRenameDialog extends React.Component<IResourceRenameDialogProps, IResourceRenameDialogState> {
    static readonly DIALOG_ID = 'resourceRenameDialog';
    static readonly DIALOG_TITLE = 'Rename Resource';

    constructor(props: IResourceRenameDialogProps) {
        super(props);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.state = ResourceRenameDialog.getStateFromProps(props);
    }

    private static getStateFromProps(props: IResourceRenameDialogProps) {
        return {newName: props.selectedResource ? props.selectedResource.name : ''};
    }

    componentWillReceiveProps(nextProps: IResourceRenameDialogProps): void {
        this.setState(ResourceRenameDialog.getStateFromProps(nextProps));
    }

    private handleConfirm() {
        this.props.dispatch(actions.updateDialogState(ResourceRenameDialog.DIALOG_ID, {isOpen: false}));
        this.props.dispatch(actions.renameWorkspaceResource(this.props.selectedResource.name, this.state.newName));
    }

    private handleCancel() {
        this.props.dispatch(actions.updateDialogState(ResourceRenameDialog.DIALOG_ID, {isOpen: false}));
    }

    render() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <Dialog
                isOpen={this.props.isOpen}
                iconName="confirm"
                onClose={this.handleCancel}
                title={ResourceRenameDialog.DIALOG_TITLE}
                autoFocus={true}
                canEscapeKeyClose={true}
                canOutsideClickClose={true}
                enforceFocus={true}
            >
                {this.renderDialogBody()}
                {this.renderDialogFooter()}
            </Dialog>
        );
    }

    private renderDialogBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_BODY}>
                {this.renderDialogContents()}
            </div>
        );
    }


    private renderDialogFooter() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    {this.renderDialogFooterActions()}
                </div>
            </div>
        );
    }

    private renderDialogFooterActions() {
        const newName = this.state.newName ? this.state.newName.trim() : '';
        const isValidNewName = newName !== ''
            && newName !== this.props.selectedResource.name
            && !this.props.resources.find(r => r.name === newName);
        return [
            <Button key={0} onClick={this.handleCancel}>Cancel</Button>,
            <Button key={1} onClick={this.handleConfirm}
                    disabled={!isValidNewName}
                    className="pt-intent-primary">OK</Button>
        ];
    }

    private renderDialogContents() {
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto', padding: '1em'}}>
                <label className="pt-label">
                    New resource name
                    <span className="pt-text-muted"> (must be unique within the workspace)</span>
                    <input className="pt-input"
                           style={{width: '100%'}}
                           type="text"
                           value={this.state.newName}
                           onChange={(ev: any) => this.setState({newName: ev.target.value})}/>
                </label>
            </div>
        );
    }

}

export default connect(mapStateToProps)(ResourceRenameDialog);

