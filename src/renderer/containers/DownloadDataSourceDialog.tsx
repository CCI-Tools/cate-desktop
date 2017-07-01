import * as React from 'react';
import {DataSourceState, DialogState, State} from "../state";
import {ModalDialog} from "../components/ModalDialog";
import {Dispatch, connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {IDataAccessComponentOptions, DataAccessComponent} from "./DataAccessComponent";

type TimeRangeValue = [string, string];

interface IDownloadDataSourceDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
    dataSource: DataSourceState|null;
    temporalCoverage: TimeRangeValue|null;
    options: IDataAccessComponentOptions;
}

interface IDownloadDataSourceDialogState extends DialogState {
    options: IDataAccessComponentOptions;
}

function mapStateToProps(state: State): IDownloadDataSourceDialogProps {
    const dialogState = selectors.dialogStateSelector(DownloadDataSourceDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        options: (dialogState as any).options as IDataAccessComponentOptions,
        dataSource: selectors.selectedDataSourceSelector(state),
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageSelector(state),
    };
}

class DownloadDataSourceDialog extends React.Component<IDownloadDataSourceDialogProps, IDownloadDataSourceDialogState> {
    static readonly DIALOG_ID = 'downloadDataSourceDialog';

    constructor(props: IDownloadDataSourceDialogProps) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onOptionsChange = this.onOptionsChange.bind(this);
        this.state = DownloadDataSourceDialog.mapPropsToState(props);
    }

    componentWillReceiveProps(nextProps: IDownloadDataSourceDialogProps): void {
        this.setState(DownloadDataSourceDialog.mapPropsToState(nextProps));
    }

    static mapPropsToState(nextProps: IDownloadDataSourceDialogProps): IDownloadDataSourceDialogState {
        const options = nextProps.options || DataAccessComponent.defaultOptions(false, nextProps.dataSource, nextProps.temporalCoverage);
        return {options};
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(DownloadDataSourceDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(DownloadDataSourceDialog.DIALOG_ID, this.state));
        const options = this.state.options;
        const opArguments = DataAccessComponent.optionsToOperationArguments(options);
        if (options.isMakeLocalSelected) {
            this.props.dispatch(actions.downloadDataset(
                this.props.dataSource.id,
                options.makeLocalDataSourceName,
                opArguments,
                options.isOpenDatasetSelected));
        } else if (options.isOpenDatasetSelected) {
            this.props.dispatch(actions.openDataset(
                this.props.dataSource.id,
                opArguments
            ));
        }
    }

    private canConfirm(): boolean {
        return DataAccessComponent.validateOptions(false, this.state.options);
    }

    private onOptionsChange(options: IDataAccessComponentOptions) {
        // console.log(options);
        this.setState({options} as IDownloadDataSourceDialogState);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        const makeLocalSelected = this.state.options.isMakeLocalSelected;
        const openDatasetSelected = this.state.options.isOpenDatasetSelected;
        let confirmTitle;
        let confirmTooltip;
        if (makeLocalSelected && openDatasetSelected) {
            confirmTitle = "Download & Open Local";
            confirmTooltip="Download and store the dataset as local data source, then open it.";
        } else if (makeLocalSelected) {
            confirmTitle = "Download";
            confirmTooltip="Download and store the dataset as local data source.";
        } else if (openDatasetSelected) {
            confirmTitle = "Open Remote";
            confirmTooltip="Open remote data source (using OPeNDAP protocol, use constraints!).";
        } else {
            confirmTitle = "Download";
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title="Download Data Source"
                iconName="cloud-download"
                confirmTitle={confirmTitle}
                confirmIconName="cloud-download"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <DataAccessComponent
                options={this.state.options}
                onChange={this.onOptionsChange}
                dataSource={this.props.dataSource}
                isLocalDataSource={false}
                temporalCoverage={this.props.temporalCoverage}/>
        );
    }

}

export default connect(mapStateToProps)(DownloadDataSourceDialog);
