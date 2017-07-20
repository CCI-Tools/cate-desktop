import * as React from "react";
import {Checkbox} from "@blueprintjs/core";
import {DataSourceState, DialogState, State} from "../state";
import {ModalDialog} from "../components/ModalDialog";
import {connect, DispatchProp} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";

interface IRemoveDatasetDialogProps {
    isOpen: boolean;
    dataSource: DataSourceState|null;
}

interface IRemoveDatasetDialogState extends DialogState {
    removeFiles: boolean;
}

function mapStateToProps(state: State): IRemoveDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(RemoveDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dataSource: selectors.selectedDataSourceSelector(state),
    };
}

class RemoveDatasetDialog extends React.Component<IRemoveDatasetDialogProps & DispatchProp<State>, IRemoveDatasetDialogState> {
    static readonly DIALOG_ID = 'removeDatasetDialog';

    constructor(props: IRemoveDatasetDialogProps & DispatchProp<State>) {
        super(props);
        this.state = {removeFiles: false};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onRemoveFilesChange = this.onRemoveFilesChange.bind(this);
    }

    componentWillReceiveProps(nextProps: IRemoveDatasetDialogProps) {
        this.setState({removeFiles: false});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(RemoveDatasetDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(RemoveDatasetDialog.DIALOG_ID, this.state));
        this.props.dispatch(actions.removeLocalDataset(this.props.dataSource.id, this.state.removeFiles));
    }

    private onRemoveFilesChange(ev: any) {
        this.setState({removeFiles: ev.target.checked} as IRemoveDatasetDialogState);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen || !this.props.dataSource) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title="Remove data source"
                iconName="trash"
                confirmTitle="Remove"
                confirmIconName="delete"
                confirmTooltip="Remove the local data source."
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div>
                <p>You are about to remove the definition for the local data source
                    <strong>{this.props.dataSource.id}</strong>.
                </p>

                <Checkbox style={{marginTop: '1em'}} checked={this.state.removeFiles}
                          label="Remove data files from local disk, too"
                          onChange={this.onRemoveFilesChange}/>
            </div>
        );
    }
}
export default connect(mapStateToProps)(RemoveDatasetDialog);
