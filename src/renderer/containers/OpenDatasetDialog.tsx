import * as React from 'react';
import {NumberRange} from "@blueprintjs/core";
import {DataSourceState, DialogState, State} from "../state";
import {TimeRange} from "../components/TimeRange";
import {ModalDialog} from "../components/ModalDialog";
import {formatMillisAsISODateString} from "../../common/format";
import {Dispatch, connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";


interface IOpenDatasetDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
    dataSource: DataSourceState;
    temporalCoverage: NumberRange|null;
    timeRange: NumberRange | null;
    protocolName: string|null;
}

interface IOpenDatasetDialogState extends DialogState {
    timeRange: NumberRange | null;
    protocolName: string;
}

function mapStateToProps(state: State): IOpenDatasetDialogProps {
    let dialogState = selectors.dialogStateSelector(OpenDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageMillisSelector(state),
        timeRange: selectors.selectedDataSourceTemporalCoverageMillisSelector(state),
        dataSource: selectors.selectedDataSourceSelector(state),
        protocolName: selectors.protocolNameSelector(state),
    };
}

class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static readonly DIALOG_ID = 'openDatasetDialog';

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onTimeRangeChange = this.onTimeRangeChange.bind(this);
        this.onProtocolChange = this.onProtocolChange.bind(this);
        this.state = OpenDatasetDialog.mapPropsToState(this.props);
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps) {
        this.setState(OpenDatasetDialog.mapPropsToState(nextProps));
    }

    private static mapPropsToState(props: IOpenDatasetDialogProps): IOpenDatasetDialogState {
        return {timeRange: props.timeRange, protocolName: props.protocolName};
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID, this.state));
        this.props.dispatch(actions.openDataset(this.props.dataSource.id, this.assembleArguments()));
    }

    private canConfirm(): boolean {
        return true;
    }

    private onTimeRangeChange(timeRange: NumberRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    private onProtocolChange(event) {
        const protocolName = event.target.value;
        this.setState({protocolName} as IOpenDatasetDialogState);
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }
        return (
            <ModalDialog
                isOpen={isOpen}
                title="Open Dataset"
                iconName="database"
                confirmTitle="Open"
                confirmIconName="folder-shared-open"
                confirmTooltip="Opens the dataset."
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
            <div>
                <p>You are about to open a dataset from data source <strong>{this.props.dataSource.name}</strong>.</p>

                <p style={{marginTop: '1em'}}>Time range:</p>
                <TimeRange coverage={this.props.temporalCoverage}
                           value={this.state.timeRange}
                           onChange={this.onTimeRangeChange}/>
                {/*{this.renderProtocolSelector()}*/}
            </div>
        );
    }

    private renderProtocolSelector() {
        if (!this.state.protocolName) {
            return null;
        }
        const options = [];
        for (let protocolName of this.props.dataSource.meta_info.protocols) {
            options.push(<option key={protocolName} value={protocolName}>{protocolName}</option>);
        }
        return (
            <label className="pt-label pt-inline">
                Select a protocol:
                <div className="pt-select" style={{padding: '0.2em'}}>
                    <select value={this.state.protocolName}
                            onChange={this.onProtocolChange}>
                        {options}
                    </select>
                </div>
            </label>
        );
    }

    private assembleArguments() {
        let args = {};
        if (this.state.timeRange[0] && this.state.timeRange[1]) {
            const t0 = formatMillisAsISODateString(this.state.timeRange[0]);
            const t1 = formatMillisAsISODateString(this.state.timeRange[1]);
            args = {
                time_range: `${t0}, ${t1}`,
            }
        }
        // if (this.state.protocolName != null) {
        //     args = {protocol: this.state.protocolName, ...args};
        // }
        return args;
    }
}

export default connect(mapStateToProps)(OpenDatasetDialog);

