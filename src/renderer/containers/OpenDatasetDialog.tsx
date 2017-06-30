import * as React from 'react';
import {Checkbox} from "@blueprintjs/core";
import {DataSourceState, DialogState, State, ResourceState, VariableState, DataStoreState} from "../state";
import {formatDateAsISODateString} from "../../common/format";
import {ModalDialog} from "../components/ModalDialog";
import {Dispatch, connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import * as types from "../../common/cate-types";
import {Region, RegionValue, GLOBAL} from "../components/Region";
import {DateRangeInput, DateRange} from "@blueprintjs/datetime";
import {VarNameValueEditor} from "./editor/VarNameValueEditor";
import {FieldValue} from "../components/field/Field";

type TimeRangeValue = [string, string];
type DateRangeValue = [Date, Date];

interface IOpenDatasetDialogProps {
    dispatch?: Dispatch<State>;
    isOpen: boolean;
    dataStore: DataStoreState | null;
    dataSource: DataSourceState | null;
    temporalCoverage: TimeRangeValue | null;
    timeRange: TimeRangeValue | null;
    region: RegionValue;
    variableNames: FieldValue<string>;
}

interface IOpenDatasetDialogState extends DialogState {
    temporalCoverage: DateRangeValue | null;
    hasTimeConstraint: boolean;
    timeRange: DateRangeValue | null;
    hasRegionConstraint: boolean;
    region: RegionValue;
    hasVariablesConstraint: boolean;
    variableNames: FieldValue<string>;
}

function mapStateToProps(state: State): IOpenDatasetDialogProps {
    const dialogState = selectors.dialogStateSelector(OpenDatasetDialog.DIALOG_ID)(state);
    return {
        isOpen: dialogState.isOpen,
        dataStore: selectors.selectedDataStoreSelector(state),
        dataSource: selectors.selectedDataSourceSelector(state),
        temporalCoverage: selectors.selectedDataSourceTemporalCoverageSelector(state),
        timeRange: (dialogState as any).timeRange,
        region: (dialogState as any).region,
        variableNames: (dialogState as any).variableNames,
    };
}

// TODO mz OpenDatasetDialog and DownloadDatasetDialog are very similar !
class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static readonly DIALOG_ID = 'openDatasetDialog';

    static readonly VAR_NAMES_INPUT = {name: 'varNames', dataType: 'string', description: null, nullable: true};

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.state = OpenDatasetDialog.mapPropsToState(this.props);
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
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps) {
        this.setState(OpenDatasetDialog.mapPropsToState(nextProps));
    }

    private static mapPropsToState(props: IOpenDatasetDialogProps): IOpenDatasetDialogState {
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

        return {
            temporalCoverage,
            hasTimeConstraint: !!props.timeRange,
            timeRange,
            hasRegionConstraint: !!props.region,
            region,
            hasVariablesConstraint: !!props.variableNames,
            variableNames,
        };
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(OpenDatasetDialog.DIALOG_ID, this.state));
        this.props.dispatch(actions.openDataset(this.props.dataSource.id, this.assembleArguments()));
    }

    private canConfirm(): boolean {
        if (!this.props.dataSource) {
            return false;
        }

        let validRegion = true;
        if (this.state.hasRegionConstraint && this.state.region) {
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
        if (this.state.hasVariablesConstraint && this.state.variableNames && this.state.variableNames.value) {
            const variableNames = this.state.variableNames.value.trim();
            const dataSource = this.props.dataSource;
            const variables: any[] = dataSource.meta_info && dataSource.meta_info.variables;
            if (variableNames && variables) {
                const validNames = new Set(variables.map(variable => variable.name));
                validVariableNames = variableNames.split(',').every(name => validNames.has(name.trim()));
            }
        }

        return validRegion && validVariableNames;
    }

    private onTimeRangeChange(timeRange: DateRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    private onRegionChange(region: RegionValue) {
        this.setState({region} as IOpenDatasetDialogState);
    }

    private onHasTimeConstraintChange(ev: any) {
        this.setState({hasTimeConstraint: ev.target.checked} as IOpenDatasetDialogState);
    }

    private onHasRegionConstraintChange(ev: any) {
        this.setState({hasRegionConstraint: ev.target.checked} as IOpenDatasetDialogState);
    }

    private onHasVariablesConstraintChange(ev: any) {
        this.setState({hasVariablesConstraint: ev.target.checked} as IOpenDatasetDialogState);
    }

    //noinspection JSUnusedLocalSymbols
    private onVariableNamesChange(unused: any, variableNames: FieldValue<string>) {
        this.setState({variableNames} as IOpenDatasetDialogState);
    }

    private static convertToVariableState(dsVar: any): VariableState {
        return {name: dsVar.name, units: dsVar.units, dataType: 'xr.DataArray'};
    }

    private static dataSourceToResource(dataSource: DataSourceState): ResourceState {
        if (dataSource && dataSource.meta_info && dataSource.meta_info.variables && dataSource.meta_info.variables.length) {
            return {
                name: dataSource.name,
                dataType: types.DATASET_TYPE,
                variables: dataSource.meta_info.variables.map(v => OpenDatasetDialog.convertToVariableState(v)),
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

        const isNonLocalStore = this.props.dataStore && this.props.dataStore.id !== 'local';

        return (
            <ModalDialog
                isOpen={isOpen}
                title={isNonLocalStore ? "Open Remote Dataset (via OPeNDAP)" : "Open Local Dataset"}
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

        const isNonLocalStore = this.props.dataStore && this.props.dataStore.id !== 'local';

        const temporalCoverage = this.state.temporalCoverage;
        const minDate = temporalCoverage ? temporalCoverage[0] : new Date('1980-01-01');
        const maxDate = temporalCoverage ? temporalCoverage[1] : new Date(Date.now());
        const hasTimeConstraint = this.state.hasTimeConstraint;
        const timeRange = hasTimeConstraint ? this.state.timeRange || [minDate, maxDate] : this.state.timeRange;

        const hasRegionConstraint = this.state.hasRegionConstraint;
        const region = hasRegionConstraint ? this.state.region || GLOBAL : this.state.region;

        const res = OpenDatasetDialog.dataSourceToResource(this.props.dataSource);

        let remoteMsg = null;
        if (isNonLocalStore) {
            // className="pt-callout pt-intent-warning pt-icon-warning-sign"
            remoteMsg = (
                <div className="pt-form-helper-text" style={{marginTop: '1em'}}>
                    Note that this is a remote data source that will be be opened using the <em>OPeNDAP protocol</em>.
                    Opening it without sufficient constraints may cause large amounts of data to be downloaded and
                    memory to be allocated, which in turn may also take considerable time, depending on current
                    network conditions.
                </div>
            );
        }

        return (
            <div className="pt-form-group">
                <p>You are about to open a dataset from data source <strong>{this.props.dataSource.name}</strong>.</p>

                <Checkbox style={{marginTop: '1em'}} disabled={!temporalCoverage} checked={hasTimeConstraint}
                          label="Time constraint"
                          onChange={this.onHasTimeConstraintChange}/>
                <div style={{marginLeft: '2em'}}>
                    <DateRangeInput
                        disabled={!hasTimeConstraint}
                        minDate={minDate}
                        maxDate={maxDate}
                        locale={'en'}
                        format="YYYY-MM-DD"
                        value={timeRange || [null, null]}
                        onChange={this.onTimeRangeChange}/>
                </div>

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
                    <VarNameValueEditor input={OpenDatasetDialog.VAR_NAMES_INPUT}
                                        value={this.state.variableNames}
                                        onChange={this.onVariableNamesChange}
                                        resource={res}
                                        multi={true}/>
                </div>

                {remoteMsg}
            </div>
        );
    }

    private assembleArguments() {
        let args = {};
        if (this.state.hasTimeConstraint && this.state.timeRange) {
            const t0 = formatDateAsISODateString(this.state.timeRange[0]);
            const t1 = formatDateAsISODateString(this.state.timeRange[1]);
            args = {
                time_range: `${t0}, ${t1}`,
            };
        }
        if (this.state.hasRegionConstraint && this.state.region) {
            let region = this.state.region;
            args = {
                ...args,
                region: `${region.west.value},${region.south.value},${region.east.value},${region.north.value}`
            };
        }
        if (this.state.hasVariablesConstraint && this.state.variableNames) {
            let variableNames = this.state.variableNames.value;
            args = {...args, 'var_names': variableNames};
        }
        return args;
    }
}

export default connect(mapStateToProps)(OpenDatasetDialog);

