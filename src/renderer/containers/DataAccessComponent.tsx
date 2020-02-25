import * as React from 'react';
import { Checkbox, Collapse, InputGroup, Label, Tooltip } from '@blueprintjs/core';
import { DataSourceState, ResourceState, VariableState } from '../state';
import { formatDateAsISODateString } from '../../common/format';
import * as types from '../../common/cate-types';
import { GLOBAL, Region, RegionValue } from '../components/Region';
import { VarNameValueEditor } from './editor/VarNameValueEditor';
import { TextFieldValue } from '../components/field/TextField';
import { DateRangeField, DateRangeFieldValue, validateDateRange } from '../components/field/DateRangeField';

type TimeRangeValue = [string, string];

export interface IDataAccessComponentOptions {

    hasTimeConstraint: boolean;
    dateRange: DateRangeFieldValue | null;

    hasRegionConstraint: boolean;
    region: RegionValue | null;

    hasVariablesConstraint: boolean;
    variableNames: TextFieldValue | null;

    isMakeLocalSelected?: boolean;
    makeLocalDataSourceId?: string;
    makeLocalDataSourceTitle?: string;

    openDatasetResourceName: string;
}

export interface IDataAccessComponentProps {
    options: IDataAccessComponentOptions;
    onChange: (options: IDataAccessComponentOptions) => any;
    dataSource: DataSourceState | null;
    isLocalDataSource: boolean;
    temporalCoverage: TimeRangeValue | null;
}


/**
 * A components that yields IDataAccessComponentOptions as value.
 *
 * @author Norman Fomferra
 */
export class DataAccessComponent extends React.Component<IDataAccessComponentProps, null> {
    static readonly VAR_NAMES_INPUT = {name: 'varNames', dataType: 'string', description: null, nullable: true};
    static readonly OPTION_CHECK_STYLE = {marginTop: '1em'};
    static readonly OPTION_DIV_STYLE = {marginLeft: '2em'};

    constructor(props: IDataAccessComponentProps) {
        super(props);
        this.onHasTimeConstraintChange = this.onHasTimeConstraintChange.bind(this);
        this.onDateRangeChange = this.onDateRangeChange.bind(this);
        this.onHasRegionConstraintChange = this.onHasRegionConstraintChange.bind(this);
        this.onRegionChange = this.onRegionChange.bind(this);
        this.onHasVariablesConstraintChange = this.onHasVariablesConstraintChange.bind(this);
        this.onVariableNamesChange = this.onVariableNamesChange.bind(this);
        this.onMakeLocalSelectedChange = this.onMakeLocalSelectedChange.bind(this);
        this.onMakeLocalDataSourceIdChange = this.onMakeLocalDataSourceIdChange.bind(this);
        this.onOpenDatasetResourceNameChange = this.onOpenDatasetResourceNameChange.bind(this);
    }

    private onDateRangeChange(dateRange: DateRangeFieldValue) {
        this.props.onChange({...this.props.options, dateRange});
    }

    private onRegionChange(region: RegionValue) {
        this.props.onChange({...this.props.options, region});
    }

    private onHasTimeConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasTimeConstraint: ev.target.checked});
    }

    private onHasRegionConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasRegionConstraint: ev.target.checked});
    }

    private onHasVariablesConstraintChange(ev: any) {
        this.props.onChange({...this.props.options, hasVariablesConstraint: ev.target.checked});
    }

    //noinspection JSUnusedLocalSymbols
    private onVariableNamesChange(unused: any, variableNames: TextFieldValue) {
        this.props.onChange({...this.props.options, variableNames});
    }

    private onMakeLocalSelectedChange(ev: any) {
        this.props.onChange({...this.props.options, isMakeLocalSelected: ev.target.checked});
    }

    private onMakeLocalDataSourceIdChange(ev: any) {
        this.props.onChange({...this.props.options, makeLocalDataSourceId: ev.target.value});
    }

    private onOpenDatasetResourceNameChange(ev: any) {
        this.props.onChange({...this.props.options, openDatasetResourceName: ev.target.value});
    }

    private static dataSourceVarToVariable(dsVar: any): VariableState {
        return {name: dsVar.name, units: dsVar.units || '-', dataType: types.DATA_ARRAY_TYPE};
    }

    private static dataSourceToResource(dataSource: DataSourceState): ResourceState {
        if (dataSource && dataSource.meta_info && dataSource.meta_info.variables && dataSource.meta_info.variables.length) {
            return {
                name: dataSource.id,
                dataType: types.DATASET_TYPE,
                variables: dataSource.meta_info.variables.map(v => DataAccessComponent.dataSourceVarToVariable(v)),
            } as ResourceState;
        } else {
            return null;
        }
    }

    render() {
        if (!this.props.dataSource) {
            return null;
        }
        const temporalCoverage = this.props.temporalCoverage;
        const minDate = temporalCoverage && temporalCoverage[0] ? new Date(temporalCoverage[0]) : new Date('1980-01-01');
        const maxDate = temporalCoverage && temporalCoverage[1] ? new Date(temporalCoverage[1]) : new Date(Date.now());
        let temporalCoverageText;
        if (temporalCoverage) {
            temporalCoverageText = <div>Data availability: {temporalCoverage.join(', ')}</div>;
        }

        const options = this.props.options;
        const hasTimeConstraint = options.hasTimeConstraint;
        const dateRange = hasTimeConstraint ? options.dateRange : null;

        const hasRegionConstraint = options.hasRegionConstraint;
        const region = hasRegionConstraint ? options.region || GLOBAL : options.region;

        const hasVariablesConstraint = options.hasVariablesConstraint;
        const isLocalDataSource = this.props.isLocalDataSource;
        const isRemoteDataSource = !isLocalDataSource;
        const isMakeLocalSelected = isRemoteDataSource && options.isMakeLocalSelected;

        const res = DataAccessComponent.dataSourceToResource(this.props.dataSource);

        let headerText;
        let localDataSourceCheck;
        let localDataSourcePanel;
        // let openDatasetResourceNamePanel = (
        //     <div style={DataAccessComponent.OPTION_DIV_STYLE}>
        //         <Label>
        //             Unique name for the new dataset resource
        //             <span className="bp3-text-muted"> (required)</span>
        //             <input className="bp3-input"
        //                    style={{width: '100%'}}
        //                    type="text"
        //                    value={options.openDatasetResourceName}
        //                    onChange={this.onOpenDatasetResourceNameChange}/>
        //         </Label>
        //     </div>
        // );
        const dataSourceNameElement = <strong>{this.props.dataSource.id}</strong>;
        if (isLocalDataSource) {
            headerText = (<p>Local data source:<br/>{dataSourceNameElement}</p>);
        } else {
            headerText = (<p>Remote data source:<br/>{dataSourceNameElement}</p>);
            localDataSourceCheck = (
                <Tooltip
                    content="If unchecked, remote data will be accessed using an available protocol, e.g. OPeNDAP.">
                    <Checkbox
                        style={DataAccessComponent.OPTION_CHECK_STYLE}
                        checked={isMakeLocalSelected}
                        label="Download and make local data source (allocates space on disk)"
                        onChange={this.onMakeLocalSelectedChange}
                    />
                </Tooltip>
            );
            localDataSourcePanel = (
                <Collapse isOpen={isMakeLocalSelected}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <Label>
                            Unique identifier for the new local data source
                            <span className="bp3-text-muted"> (optional)</span>
                            <InputGroup
                                style={{width: '100%'}}
                                type="text"
                                value={options.makeLocalDataSourceId}
                                onChange={this.onMakeLocalDataSourceIdChange}
                            />
                        </Label>
                    </div>
                </Collapse>
            );
            /*
             openDatasetResourceNamePanel = (
             <Collapse isOpen={isOpenDatasetSelected}>
             {openDatasetResourceNamePanel}
             </Collapse>
             );
             */
        }

        return (
            <div>
                {headerText}

                <Checkbox
                    style={DataAccessComponent.OPTION_CHECK_STYLE}
                    disabled={!temporalCoverage}
                    checked={hasTimeConstraint}
                    label="Time constraint"
                    onChange={this.onHasTimeConstraintChange}
                />
                <Collapse isOpen={hasTimeConstraint}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <DateRangeField
                            nullable={true}
                            min={minDate}
                            max={maxDate}
                            value={dateRange}
                            onChange={this.onDateRangeChange}
                        />
                        {temporalCoverageText}
                    </div>
                </Collapse>

                <Checkbox style={DataAccessComponent.OPTION_CHECK_STYLE}
                          checked={hasRegionConstraint}
                          label="Region constraint"
                          onChange={this.onHasRegionConstraintChange}/>
                <Collapse isOpen={hasRegionConstraint}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <Region value={region}
                                disabled={!hasRegionConstraint}
                                onChange={this.onRegionChange}/>
                    </div>
                </Collapse>

                <Checkbox style={DataAccessComponent.OPTION_CHECK_STYLE}
                          checked={hasVariablesConstraint}
                          label="Variables constraint"
                          onChange={this.onHasVariablesConstraintChange}/>
                <Collapse isOpen={hasVariablesConstraint}>
                    <div style={DataAccessComponent.OPTION_DIV_STYLE}>
                        <VarNameValueEditor input={DataAccessComponent.VAR_NAMES_INPUT}
                                            value={options.variableNames}
                                            onChange={this.onVariableNamesChange}
                                            resource={res}
                                            multi={true}/>
                    </div>
                </Collapse>

                {localDataSourceCheck}
                {localDataSourcePanel}
                {/*{openDatasetResourceNamePanel}*/}

            </div>
        );
    }

    static validateOptions(isLocalDataSource: boolean, options: IDataAccessComponentOptions): boolean {
        if (!options) {
            return false;
        }

        let validTimeConstraint = true;
        if (options.hasTimeConstraint && options.dateRange) {
            validTimeConstraint = !options.dateRange.error;
        }

        let validRegion = true;
        if (options.hasRegionConstraint && options.region) {
            const west = options.region.west.value;
            const east = options.region.east.value;
            const south = options.region.south.value;
            const north = options.region.north.value;
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
        if (options.hasVariablesConstraint && options.variableNames) {
            validVariableNames = !options.variableNames.error;
        }

        let validDataSourceId = true;
        if (!isLocalDataSource && options.isMakeLocalSelected) {
            const makeLocalDataSourceId = options.makeLocalDataSourceId;
            if (makeLocalDataSourceId && !/[^\\/:*?"<>|\r\n]+$/im.test(makeLocalDataSourceId)) {
                validDataSourceId = false;
            }
        }

        return validTimeConstraint && validRegion && validVariableNames && validDataSourceId;
    }

    static optionsToErrors(options: IDataAccessComponentOptions) {
        const inputErrors = {};
        if (options.hasTimeConstraint && options.dateRange && options.dateRange.error) {
            inputErrors['Time constraint'] = options.dateRange.error
        }
        if (options.hasVariablesConstraint && options.variableNames && options.variableNames.error) {
            inputErrors['Variables constraint'] = options.variableNames.error
        }
        return inputErrors;
    }


    static optionsToOperationArguments(options: IDataAccessComponentOptions) {
        let args = {};
        if (options.hasTimeConstraint && options.dateRange && options.dateRange.value) {
            const t0 = formatDateAsISODateString(options.dateRange.value[0]);
            const t1 = formatDateAsISODateString(options.dateRange.value[1]);
            args = {
                time_range: `${t0},${t1}`,
            };
        }
        if (options.hasRegionConstraint && options.region) {
            const region = options.region;
            args = {
                ...args,
                region: `${region.west.value},${region.south.value},${region.east.value},${region.north.value}`
            };
        }
        if (options.hasVariablesConstraint && options.variableNames) {
            const variableNames = options.variableNames.value;
            args = {
                ...args,
                var_names: variableNames
            };
        }
        if (options.isMakeLocalSelected) {
            args = {
                ...args,
                force_local: true
            };
            if (options.makeLocalDataSourceId) {
                args = {
                    ...args,
                    local_ds_id: options.makeLocalDataSourceId
                };
            }
        }
        return args;
    }

    static defaultOptions(isLocalDataSource: boolean, temporalCoverage: TimeRangeValue): IDataAccessComponentOptions {
        let minDate = null;
        let maxDate = null;
        if (temporalCoverage && temporalCoverage[0]) {
            try {
                minDate = new Date(temporalCoverage[0]);
            } catch (e) {
                // ok
            }
        }
        if (temporalCoverage && temporalCoverage[1]) {
            try {
                maxDate = new Date(temporalCoverage[1]);
            } catch (e) {
                // ok
            }
        }

        return {
            hasTimeConstraint: false,
            dateRange: {value: [minDate, maxDate]},

            hasRegionConstraint: false,
            region: null,

            hasVariablesConstraint: false,
            variableNames: null,

            isMakeLocalSelected: !isLocalDataSource,
            makeLocalDataSourceId: '',

            openDatasetResourceName: '',
        };
    }

    // static adjustLocalDataSourceName(options: IDataAccessComponentOptions, dataSource: DataSourceState): IDataAccessComponentOptions {
    //     if (!options.makeLocalDataSourceId || options.makeLocalDataSourceId === '') {
    //         let dataSourceId = dataSource && dataSource.id;
    //         if (!dataSourceId) {
    //             dataSourceId = 'unnamed';
    //         }
    //         return {...options, makeLocalDataSourceId: 'local.' + dataSourceId};
    //     }
    //     return options;
    // }

    static ensureDateRangeIsValidated(options: IDataAccessComponentOptions, temporalCoverage: TimeRangeValue): IDataAccessComponentOptions {
        if (options.hasTimeConstraint && options.dateRange && temporalCoverage) {
            try {
                const minDate = temporalCoverage[0] ? new Date(temporalCoverage[0]) : new Date('1980-01-01');
                const maxDate = temporalCoverage[1] ? new Date(temporalCoverage[1]) : new Date(Date.now());

                // re-validate, because min, max may have changed
                validateDateRange(options.dateRange.value, true, minDate, maxDate);
                return {...options, dateRange: {...options.dateRange, error: null}};
            } catch (e) {
                return {...options, dateRange: {...options.dateRange, error: e}};
            }
        }
        return options;
    }
}


