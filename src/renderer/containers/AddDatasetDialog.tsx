import * as React from "react";
import {AnchorButton} from "@blueprintjs/core";
import {DialogState, State} from "../state";
import {ModalDialog} from "../components/ModalDialog";
import {connect, Dispatch} from "react-redux";
import * as actions from "../actions";
import {OpenDialogProperty} from "../actions";
import * as selectors from "../selectors";

interface IAddDatasetDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
}

interface IAddDatasetDialogState extends DialogState {
    dataSourceName: string;
    filePathPattern: string;
}

function mapStateToProps(state: State): IAddDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(AddDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
    };
}

class AddDatasetDialog extends React.Component<IAddDatasetDialogProps, IAddDatasetDialogState> {
    static readonly DIALOG_ID = 'addDatasetDialog';

    constructor(props: IAddDatasetDialogProps) {
        super(props);
        this.state = {dataSourceName: '', filePathPattern: ''};
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onDataSourceNameChange = this.onDataSourceNameChange.bind(this);
        this.onFilePathPatternChange = this.onFilePathPatternChange.bind(this);
        this.showSelectDirectoryDialog = this.showSelectDirectoryDialog.bind(this);
    }

    componentWillReceiveProps(nextProps: IAddDatasetDialogProps) {
        this.setState({dataSourceName: '', filePathPattern: ''});
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(AddDatasetDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        return !!this.state.dataSourceName && !!this.state.filePathPattern;
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(AddDatasetDialog.DIALOG_ID, this.state));
        this.props.dispatch(actions.addLocalDataset(this.state.dataSourceName, this.state.filePathPattern));
    }

    private onDataSourceNameChange(ev: any) {
        this.setState({dataSourceName: ev.target.value} as IAddDatasetDialogState);
    }

    private onFilePathPatternChange(ev: any) {
        this.setState({filePathPattern: ev.target.value} as IAddDatasetDialogState);
    }

    private showSelectDirectoryDialog() {
        const openDialogOptions = {
            title: "Select Directory",
            defaultPath: this.state.filePathPattern,
            buttonLabel: "Select",
            properties: [
                'openDirectory' as OpenDialogProperty,
            ],
            filter: [],
        };
        actions.showSingleFileOpenDialog(openDialogOptions, (dirPath: string) => {
            if (dirPath) {
                this.setState({filePathPattern: dirPath + '/*.nc'} as IAddDatasetDialogState);
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
                title="Add local data source"
                iconName="add"
                confirmTitle="Add"
                confirmIconName="add"
                confirmTooltip="Add local data source."
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
        return (
            <div>
                <p>Define a new local data source using a file pattern.</p>

                <p style={{marginTop: '1em'}}>Name:</p>
                <input className="pt-input"
                       type="text"
                       style={{width: '100%', marginLeft: '1em'}}
                       value={this.state.dataSourceName}
                       onChange={this.onDataSourceNameChange}/>
                <p style={{marginTop: '1em'}}>Path pattern<span className="pt-text-muted"> (can contain wildcards like "*" or "?")</span>:
                </p>
                <div className="pt-control-group"
                     style={{flexGrow: 1, display: 'flex', marginLeft: '1em', width: '100%'}}>
                    <input className="pt-input"
                           type="text"
                           style={{flex: 'auto'}}
                           value={this.state.filePathPattern}
                           onChange={this.onFilePathPatternChange}/>
                    <AnchorButton className="pt-intent-primary" style={{flex: 'none'}}
                                  onClick={this.showSelectDirectoryDialog}>...</AnchorButton>
                </div>
            </div>
        );
    }
}
export default connect(mapStateToProps)(AddDatasetDialog);
