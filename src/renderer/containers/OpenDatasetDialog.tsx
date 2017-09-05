import * as React from 'react';
import {DataSourceState, DialogState, State, DataStoreState} from "../state";
import {ModalDialog} from "../components/ModalDialog";
import {connect, DispatchProp} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {IDataAccessComponentOptions, DataAccessComponent} from "./DataAccessComponent";

type TimeRangeValue = [string, string];

interface IOpenDatasetDialogProps {
    isOpen: boolean;
    dataStore: DataStoreState | null;
    dataSource: DataSourceState | null;
    temporalCoverage: TimeRangeValue | null;
    options: IDataAccessComponentOptions;
}

interface IOpenDatasetDialogState extends DialogState {
    options: IDataAccessComponentOptions;
}

function mapStateToProps(state: State): IOpenDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(OpenDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dataStore: selectors.selectedDataStoreSelector(state),
        dataSource: selectors.selectedDataSourceSelector(state),
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageSelector(state),
        options: (dialogState as any).options as IDataAccessComponentOptions,
    };
}

class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps & DispatchProp<State>, IOpenDatasetDialogState> {
    static readonly DIALOG_ID = 'openDatasetDialog';

    static readonly VAR_NAMES_INPUT = {name: 'varNames', dataType: 'string', description: null, nullable: true};

    constructor(props: IOpenDatasetDialogProps & DispatchProp<State>) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onOptionsChange = this.onOptionsChange.bind(this);
        this.state = OpenDatasetDialog.mapPropsToState(props);
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps): void {
        this.setState(OpenDatasetDialog.mapPropsToState(nextProps));
    }

    static mapPropsToState(nextProps: IOpenDatasetDialogProps): IOpenDatasetDialogState {
        const options = nextProps.options || DataAccessComponent.defaultOptions(true, nextProps.temporalCoverage);
        return {options};
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID));
    }

    private canConfirm(): boolean {
        return DataAccessComponent.validateOptions(true, this.state.options);
    }

    private onConfirm() {
        const options = this.state.options;
        // clear hasVariablesConstraint, variableNames
        // keep time and geo constraint
        const dialogState = {options:
            {...options,
                hasVariablesConstraint: false,
                variableNames: null,
            }
        };
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID, dialogState));
        this.props.dispatch(actions.openDataset(
            this.props.dataSource.id,
            DataAccessComponent.optionsToOperationArguments(this.state.options)
        ));
        // Save modified state
        this.setState(dialogState);
    }

    private onOptionsChange(options: IDataAccessComponentOptions) {
        // console.log(options);
        this.setState({options});
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title={"Open Local Dataset"}
                iconName="database"
                confirmTitle="Open Local"
                confirmIconName="folder-shared-open"
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
                isLocalDataSource={true}
                temporalCoverage={this.props.temporalCoverage}/>
        );
    }

}

export default connect(mapStateToProps)(OpenDatasetDialog);

