import * as React from 'react';
import {Checkbox} from "@blueprintjs/core";
import {DataSourceState, DialogState, State, ResourceState, VariableState} from "../state";
import {formatDateAsISODateString} from "../../common/format";
import {ModalDialog} from "../components/ModalDialog";
import {Dispatch, connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {Region, RegionValue, GLOBAL} from "../components/Region";
import {DateRangeInput, DateRange} from "@blueprintjs/datetime";
import {VarNameValueEditor} from "./editor/VarNameValueEditor";
import {FieldValue} from "../components/field/Field";

type TimeRangeValue = [string, string];
type DateRangeValue = [Date, Date];

interface IDownloadDatasetDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
    dataSource: DataSourceState|null;
    temporalCoverage: TimeRangeValue|null;
    timeRange: TimeRangeValue|null;
    region: RegionValue;
    variableNames: string[];
}

interface IDownloadDatasetDialogState extends DialogState {
    temporalCoverage: DateRangeValue|null;
    hasTimeConstraint: boolean;
    timeRange: DateRangeValue|null;
    hasRegionConstraint: boolean;
    region: RegionValue;
    hasVariablesConstraint: boolean;
    variableNames: string[];
    localDataSourceName: string;
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
            variableNames = [];
        }

        let localDataSourceName = props.dataSource && props.dataSource.name;
        if (!localDataSourceName) {
            localDataSourceName = props.dataSource && props.dataSource.id;
            if (!localDataSourceName) {
                localDataSourceName = 'unkown'
            }
        }
        localDataSourceName = 'local.' + localDataSourceName;

        return {
            temporalCoverage,
            hasTimeConstraint: !!props.timeRange,
            timeRange,
            hasRegionConstraint: !!props.region,
            region,
            hasVariablesConstraint: !!props.variableNames,
            variableNames,
            localDataSourceName,
        };
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(DownloadDatasetDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(DownloadDatasetDialog.DIALOG_ID, this.state));
        const args = this.assembleArguments();
        this.props.dispatch(actions.downloadDataset(this.props.dataSource.id, this.state.localDataSourceName, args));
    }

    private canConfirm(): boolean {
        if (!this.props.dataSource) {
            return false;
        }
        let validRegion = true;
        if (this.state.region) {
            const west = this.state.region.west.value;
            const east = this.state.region.east.value;
            const south = this.state.region.south.value;
            const north = this.state.region.north.value;
            const eps = 360. / 40000.; // 1km
            const validWest = west >= -180 && west <= 180;
            const validEast = east >= -180 && east <= 180;
            const validNorth = north >= -90 && north <= 90;
            const validSouth = south >= -90 && south <= 90;
            const validEastWest = validWest && validEast && Math.abs(west - east) >= eps;
            const validSouthNorth = validSouth && validNorth && (north - south) >= eps;
            validRegion = validEastWest && validSouthNorth;
        }

        let validVariableNames = true;
        const variableNames = this.state.variableNames;
        const dataSource = this.props.dataSource;
        const variables: any[] = dataSource.meta_info.variables;
        if (variableNames && variables) {
            const validNames = new Set(variables.map(variable => variable.name));
            validVariableNames = variableNames.every(name => validNames.has(name));
        }

        // // TODO (forman): implement full (file) name validation as name will be used as name of a JSON file
        const localDsName = this.state.localDataSourceName;
        const validDataSourceName = localDsName && localDsName.trim() !== '' && !localDsName.match("[^a-zA-Z0-9-_.]");
        return validRegion && validVariableNames && validDataSourceName;
    }

    private onTimeRangeChange(timeRange: DateRange) {
        this.setState({timeRange} as IDownloadDatasetDialogState);
    }

    private onRegionChange(region: RegionValue) {
        this.setState({region} as IDownloadDatasetDialogState);
    }

    private onDataSourceNameChange(ev: any) {
        this.setState({localDataSourceName: ev.target.value} as IDownloadDatasetDialogState);
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

    private onVariableNamesChange(unused: any, fieldValue: FieldValue<string>) {
        let variableNames = [];
        if (fieldValue && fieldValue.value) {
            variableNames = fieldValue.value.split(',').map(v => v.trim());
        }
        this.setState({variableNames} as IDownloadDatasetDialogState);
    }

    private static convertToVariableState(dsVar: any): VariableState {
        return {name: dsVar.name, units: dsVar.units || '-', dataType: 'xr.DataArray'};
    }

    private static dataSourceToResource(dataSource: DataSourceState): ResourceState {
        if (dataSource && dataSource.meta_info && dataSource.meta_info.variables && dataSource.meta_info.variables.length) {
            return {
                name: dataSource.name,
                dataType: 'xr.DataSet', // TODO
                variables: dataSource.meta_info.variables.map(v => DownloadDatasetDialog.convertToVariableState(v)),
            } as ResourceState;
        } else {
            return null;
        }
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
        if (!this.props.isOpen) {
            return null;
        }

        const temporalCoverage = this.state.temporalCoverage;
        const minDate = temporalCoverage ? temporalCoverage[0] : new Date('1980-01-01');
        const maxDate = temporalCoverage ? temporalCoverage[1] : new Date(Date.now());
        const hasTimeConstraint = this.state.hasTimeConstraint;
        const timeRange = hasTimeConstraint ? this.state.timeRange || [minDate, maxDate] : this.state.timeRange;

        const hasRegionConstraint = this.state.hasRegionConstraint;
        const region = hasRegionConstraint ? this.state.region || GLOBAL : this.state.region;

        const res = DownloadDatasetDialog.dataSourceToResource(this.props.dataSource);

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
                    <VarNameValueEditor input={null} value={this.state.variableNames.join(',')}
                                        onChange={this.onVariableNamesChange} resource={res} multi={true}/>
                </div>

                <p style={{marginTop: '1em'}}>A new <strong>local</strong>
                    data source will be created using the following name:</p>
                <input className="pt-input"
                       style={{width: '100%', marginLeft: '1em'}}
                       type="text"
                       value={this.state.localDataSourceName}
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
            args = {
                ...args,
                region: `${region.west.value},${region.south.value},${region.east.value},${region.north.value}`
            };
        }
        if (this.state.hasVariablesConstraint && this.state.variableNames.length) {
            let variableNames = this.state.variableNames;
            args = {...args, 'var': variableNames.join(',')};
        }
        return args;
    }
}

export default connect(mapStateToProps)(DownloadDatasetDialog);
