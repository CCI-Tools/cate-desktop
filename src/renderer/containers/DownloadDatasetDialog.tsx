import * as React from 'react';
import {Checkbox, Button} from "@blueprintjs/core";
import {DataSourceState, DialogState, State} from "../state";
import {formatDateAsISODateString} from "../../common/format";
import {ModalDialog} from "../components/ModalDialog";
import {Dispatch, connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {Region, RegionValue, GLOBAL} from "../components/Region";
import {DateRangeInput, DateRange} from "@blueprintjs/datetime";

type TimeRangeValue = [string, string];
type DateRangeValue = [Date, Date];

interface IDownloadDatasetDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
    dataSource: DataSourceState;
    temporalCoverage: TimeRangeValue|null;
    timeRange: TimeRangeValue|null;
    region: RegionValue;
    variableNames: string[]|null;
}

interface IDownloadDatasetDialogState extends DialogState {
    temporalCoverage: DateRangeValue|null;
    hasTimeConstraint: boolean;
    timeRange: DateRangeValue|null;
    hasRegionConstraint: boolean;
    region: RegionValue;
    hasVariablesConstraint: boolean;
    variableNames: string[]|null;
    dataSourceName: string;
}

function mapStateToProps(state: State): IDownloadDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(DownloadDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dataSource: selectors.selectedDataSourceSelector(state),
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageSelector(state),
        timeRange: (dialogState as any).timeRange,
        region: (dialogState as any).region,
        variableNames: (dialogState as any).variableNames,
    };
}

class DownloadDatasetDialog extends React.Component<IDownloadDatasetDialogProps, IDownloadDatasetDialogState> {
    static readonly DIALOG_ID = 'downloadDatasetDialog';

    constructor(props: IDownloadDatasetDialogProps) {
        super(props);
        this.state = DownloadDatasetDialog.mapPropsToState(this.props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.onHasTimeConstraintChange = this.onHasTimeConstraintChange.bind(this);
        this.onTimeRangeChange = this.onTimeRangeChange.bind(this);
        this.onHasRegionConstraintChange = this.onHasRegionConstraintChange.bind(this);
        this.onRegionChange = this.onRegionChange.bind(this);
        this.onHasVariablesConstraintChange = this.onHasVariablesConstraintChange.bind(this);
        this.onVariableNamesChange = this.onVariableNamesChange.bind(this);
        this.onDataSourceNameChange = this.onDataSourceNameChange.bind(this);
        this.onSelectVariableNames = this.onSelectVariableNames.bind(this);
    }

    componentWillReceiveProps(nextProps: IDownloadDatasetDialogProps) {
        this.setState(DownloadDatasetDialog.mapPropsToState(nextProps));
    }

    private static mapPropsToState(props: IDownloadDatasetDialogProps): IDownloadDatasetDialogState {
        let temporalCoverage = null;
        if (props.temporalCoverage) {
            temporalCoverage = [new Date(props.temporalCoverage[0]), new Date(props.temporalCoverage[1])];
        }

        let timeRange = temporalCoverage;
        if (props.timeRange) {
            timeRange = [new Date(props.timeRange[0]), new Date(props.timeRange[1])];
        }

        let region = props.region;
        if (!region) {
            region = null;
        }

        let variableNames = props.variableNames;
        if (!variableNames) {
            variableNames = null;
        }

        let dataSourceName = props.dataSource.name;
        if (!dataSourceName) {
            dataSourceName = props.dataSource.id;
        }

        return {
            temporalCoverage,
            hasTimeConstraint: !!props.timeRange,
            timeRange,
            hasRegionConstraint: !!props.region,
            region,
            hasVariablesConstraint: !!props.variableNames,
            variableNames,
            dataSourceName,
        };
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(DownloadDatasetDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(DownloadDatasetDialog.DIALOG_ID, this.state));
        // TODO (forman): implement me!
        console.log('DownloadDatasetDialog.onConfirm:', this.assembleArguments());
        // this.props.dispatch(actions.downloadDataset(this.props.dataSource.id, this.assembleArguments()));
    }

    private canConfirm(): boolean {
        // const west = this.state.region.west.value;
        // const east = this.state.region.east.value;
        // const south = this.state.region.south.value;
        // const north = this.state.region.north.value;
        // const eps = 360. / 40000.; // 1km
        // const validWest = west >= -180 && west <= 180;
        // const validEast = east >= -180 && east <= 180;
        // const validNorth = north >= -90 && north <= 90;
        // const validSouth = south >= -90 && south <= 90;
        // const validEastWest = validWest && validEast && Math.abs(west - east) >= eps;
        // const validSouthNorth = validSouth && validNorth && (north - south) >= eps;
        // const validRegion = validEastWest && validSouthNorth;
        //
        // let validVariableNames = true;
        // const variableNames = this.state.variableNames;
        // const dataSource = this.props.dataSource;
        // const variables: any[] = dataSource.meta_info.variables;
        // if (variableNames && variables) {
        //     const validNames = new Set(variables.map(variable => variable.name));
        //     validVariableNames = variableNames.every(name => validNames.has(name));
        // }
        //
        // // TODO (forman): implement full (file) name validation as name will be used as name of a JSON file
        // const validDataSourceName = this.state.dataSourceName && this.state.dataSourceName.trim() !== '';
        // return validRegion && validVariableNames && validDataSourceName;
        return true;
    }

    private onTimeRangeChange(timeRange: DateRange) {
        this.setState({timeRange} as IDownloadDatasetDialogState);
    }

    private onRegionChange(region: RegionValue) {
        this.setState({region} as IDownloadDatasetDialogState);
    }

    private onDataSourceNameChange(ev: any) {
        this.setState({dataSourceName: ev.target.value} as IDownloadDatasetDialogState);
    }

    private onHasTimeConstraintChange(ev: any) {
        this.setState({hasTimeConstraint: ev.target.checked} as IDownloadDatasetDialogState);
    }

    private onHasRegionConstraintChange(ev: any) {
        this.setState({hasRegionConstraint: ev.target.checked} as IDownloadDatasetDialogState);
    }

    private onHasVariablesConstraintChange(ev: any) {
        this.setState({hasVariablesConstraint: ev.target.checked} as IDownloadDatasetDialogState);
    }

    private onVariableNamesChange(ev: any) {
        const variableNames = DownloadDatasetDialog.parseVariableNames(ev.target.value);
        this.setState({variableNames} as IDownloadDatasetDialogState);
    }

    private onSelectVariableNames() {
        console.log("onSelectVariableNames!");
    }

    private static parseVariableNames(namesString: string) {
        return namesString && namesString.trim() !== '' ? namesString.split(',').map(name => name.trim()) : null;
    }

    render() {
        let isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        return (
            <ModalDialog
                isOpen={isOpen}
                title="Download Dataset"
                iconName="cloud-download"
                confirmTitle="Download"
                confirmIconName="folder-shared-open"
                confirmTooltip="Download and store the dataset as local data source."
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />);
    }

    private renderBody() {
        const temporalCoverage = this.state.temporalCoverage;
        const minDate = temporalCoverage ? temporalCoverage[0] : new Date('1980-01-01');
        const maxDate = temporalCoverage ? temporalCoverage[1] : new Date(Date.now());
        const hasTimeConstraint = this.state.hasTimeConstraint;
        const timeRange = hasTimeConstraint ? this.state.timeRange || [minDate, maxDate] : this.state.timeRange;

        const hasRegionConstraint = this.state.hasRegionConstraint;
        const region = hasRegionConstraint ? this.state.region || GLOBAL : this.state.region;

        return (
            <div>
                <p>You are about to download a dataset from data source <strong>{this.props.dataSource.name}</strong>.
                </p>

                <Checkbox style={{marginTop: '1em'}} checked={hasTimeConstraint} label="Time constraint"
                          onChange={this.onHasTimeConstraintChange}/>
                <div style={{marginLeft: '2em'}}>
                    <DateRangeInput
                        disabled={!hasTimeConstraint}
                        minDate={minDate}
                        maxDate={maxDate}
                        locale={'en'}
                        format="YYYY-MM-DD"
                        value={timeRange}
                        onChange={this.onTimeRangeChange}/>
                </div>

                {/*<TimeRange coverage={this.props.temporalCoverage}*/}
                {/*value={this.state.timeRange}*/}
                {/*onChange={this.onTimeRangeChange}/>*/}


                <Checkbox style={{marginTop: '1em'}} checked={hasRegionConstraint} label="Region constraint"
                          onChange={this.onHasRegionConstraintChange}/>
                <div style={{marginLeft: '2em'}}>
                    <Region value={region}
                            disabled={!hasRegionConstraint}
                            onChange={this.onRegionChange}/>
                </div>

                <Checkbox style={{marginTop: '1em'}} checked={this.state.hasVariablesConstraint}
                          label="Variables constraint" onChange={this.onHasVariablesConstraintChange}/>
                <div style={{marginLeft: '2em'}}>
                    <div className="pt-control-group">
                        <div className="pt-input-group pt-fill">
                            <span className="pt-icon pt-icon-variable"/>
                            <input type="text"
                                   className="pt-input"
                                   placeholder="Comma-separated variable names..."
                                   value={this.state.variableNames ? this.state.variableNames.join(', ') : ''}
                                   onChange={this.onVariableNamesChange}
                                   disabled={!this.state.hasVariablesConstraint}/>
                        </div>
                        <Button className="pt-button pt-intent-primary"
                                onClick={this.onSelectVariableNames}
                                disabled={!this.state.hasVariablesConstraint}>...</Button>
                    </div>
                </div>

                <p style={{marginTop: '1em'}}>A new <strong>local</strong>
                    data source will be created using the following name:</p>
                <input className="pt-input"
                       style={{width: '100%', marginLeft: '1em'}}
                       type="text"
                       value={this.state.dataSourceName}
                       onChange={this.onDataSourceNameChange}/>
            </div>
        );
    }

    private assembleArguments() {
        let args = {};
        if (this.state.hasTimeConstraint && this.state.timeRange) {
            args = {
                start_date: formatDateAsISODateString(this.state.timeRange[0]),
                end_date: formatDateAsISODateString(this.state.timeRange[1]),
            };
        }
        if (this.state.hasRegionConstraint && this.state.region) {
            let region = this.state.region;
            args = {...args, region: `${region.west},${region.south},${region.east},${region.north}`};
        }
        if (this.state.hasVariablesConstraint && this.state.variableNames) {
            let variableNames = this.state.variableNames;
            args = {...args, 'var': variableNames.join(',')};
        }
        return args;
    }
}

export default connect(mapStateToProps)(DownloadDatasetDialog);
