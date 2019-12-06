import * as React from "react";
import { AnchorButton } from "@blueprintjs/core";
import { DialogState, State } from "../state";
import { ModalDialog } from "../components/ModalDialog";
import { connect, DispatchProp } from "react-redux";
import * as actions from "../actions";
import { OpenDialogProperty } from "../actions";
import * as selectors from "../selectors";

interface ISelectWorkspaceDialogState extends DialogState {
    workspaceDir: string;
    workspaceName: string;
}

interface ISelectWorkspaceDialogOwnProps {
    dialogId: string;
}

interface ISelectWorkspaceDialogProps extends ISelectWorkspaceDialogState, ISelectWorkspaceDialogOwnProps {
    isOpen: boolean;
    isNewDialog: boolean;
    isLocalWebAPI: boolean;
}

function mapStateToProps(state: State, ownProps: ISelectWorkspaceDialogOwnProps): ISelectWorkspaceDialogProps {
    const dialogState = selectors.dialogStateSelector(ownProps.dialogId)(state) as any;
    const isOpen = dialogState.isOpen;
    const dialogId = ownProps.dialogId;
    const isNewDialog = ownProps.dialogId === 'newWorkspaceDialog';
    const isLocalWebAPI = selectors.isLocalWebAPISelector(state);
    let workspaceDir = dialogState.workspaceDir;
    let workspaceName = dialogState.workspaceName;
    if (isOpen) {
        if (!selectors.isScratchWorkspaceSelector(state)) {
            workspaceDir = workspaceDir || selectors.workspaceDirSelector(state);
            workspaceName = workspaceName || selectors.workspaceNameSelector(state);
        }
        workspaceDir = workspaceDir || selectors.lastWorkspaceDirSelector(state);
    }
    workspaceDir = isLocalWebAPI ? workspaceDir || '' : ' ';
    workspaceName = workspaceName || '';
    return {
        workspaceDir,
        workspaceName,
        dialogId,
        isNewDialog,
        isOpen,
        isLocalWebAPI,
    };
}

class SelectWorkspaceDialog extends React.Component<ISelectWorkspaceDialogProps & ISelectWorkspaceDialogOwnProps & DispatchProp<State>, ISelectWorkspaceDialogState> {

    constructor(props: ISelectWorkspaceDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {workspaceDir: '', workspaceName: ''};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onWorkspaceNameChange = this.onWorkspaceNameChange.bind(this);
        this.onWorkspaceDirChange = this.onWorkspaceDirChange.bind(this);
        this.showSelectDirectoryDialog = this.showSelectDirectoryDialog.bind(this);
    }

    componentWillReceiveProps(nextProps: ISelectWorkspaceDialogProps) {
        this.setState({workspaceDir: nextProps.workspaceDir, workspaceName: nextProps.workspaceName});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId));
    }

    private canConfirm(): boolean {
        if (!this.state.workspaceDir || !this.state.workspaceName) {
            return false;
        }
        return /^([A-Za-z_\-\s0-9.]+)$/.test(this.state.workspaceName);
    }

    private composeWorkspacePath(): string {
        let workspaceDir = this.state.workspaceDir;
        let workspaceName = this.state.workspaceName;
        if (workspaceDir === ' ') {
            return workspaceName;
        }
        return workspaceDir + '/' + workspaceName;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(this.props.dialogId, this.state));
        if (this.props.isNewDialog) {
            this.props.dispatch(actions.newWorkspace(this.composeWorkspacePath()));
        } else {
            this.props.dispatch(actions.saveWorkspaceAs(this.composeWorkspacePath()));
        }
    }

    private onWorkspaceDirChange(ev: any) {
        this.setState({workspaceDir: ev.target.value} as ISelectWorkspaceDialogState);
    }

    private onWorkspaceNameChange(ev: any) {
        this.setState({workspaceName: ev.target.value} as ISelectWorkspaceDialogState);
    }

    private showSelectDirectoryDialog() {
        const openDialogOptions = {
            title: "Select Directory",
            defaultPath: this.state.workspaceDir,
            buttonLabel: "Select",
            properties: [
                'openDirectory' as OpenDialogProperty,
            ],
            filter: [],
        };
        actions.showSingleFileOpenDialog(openDialogOptions, (dirPath: string) => {
            if (dirPath) {
                this.setState({workspaceDir: dirPath} as ISelectWorkspaceDialogState);
            }
        });
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title={this.props.isNewDialog ? "New Workspace" : "Save Workspace As"}
                confirmTitle={this.props.isNewDialog ? "New" : "Save As"}
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        let directoryChooser = null;
        if (this.props.isLocalWebAPI) {
            directoryChooser = (
                <React.Fragment>
                    <p style={{marginTop: '1em'}}>Workspace parent directory:</p>
                    <div className="pt-control-group"
                         style={{flexGrow: 1, display: 'flex', marginLeft: '1em', width: '100%'}}>
                        <input className="pt-input"
                               type="text"
                               style={{flex: 'auto'}}
                               value={this.state.workspaceDir}
                               onChange={this.onWorkspaceDirChange}/>
                        <AnchorButton className="pt-intent-primary" style={{flex: 'none'}}
                                      onClick={this.showSelectDirectoryDialog}>...</AnchorButton>
                    </div>
                </React.Fragment>
            );
        }

        return (
            <div>
                {directoryChooser}
                <p style={{marginTop: '1em'}}>Workspace name:</p>
                <input className="pt-input"
                       type="text"
                       style={{width: '100%', marginLeft: '1em'}}
                       value={this.state.workspaceName}
                       onChange={this.onWorkspaceNameChange}/>
            </div>
        );
    }
}

export default connect(mapStateToProps)(SelectWorkspaceDialog);
