import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import {
    State,
    VariableState,
    ResourceState,
    SavedLayers,
    Placemark,
    GeographicPosition
} from '../state';
import * as assert from '../../common/assert';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { ListBox, ListBoxSelectionMode } from '../components/ListBox';
import { ContentWithDetailsPanel } from '../components/ContentWithDetailsPanel';
import { LabelWithType } from '../components/LabelWithType';
import { Position, Colors } from '@blueprintjs/core';
import { Cell, Column, Table, TruncatedFormat } from '@blueprintjs/table';
import { ScrollablePanelContent } from '../components/ScrollableContent';
import { NO_VARIABLES, NO_VARIABLES_EMPTY_RESOURCE } from '../messages';
import { CSSProperties } from 'react';
import * as Cesium from 'cesium';
import { ToolButton } from '../components/ToolButton';
import { isSpatialImageVariable, isSpatialVectorVariable } from '../state-util';
import { isDefined, isDefinedAndNotNull } from '../../common/types';

interface IVariablesPanelProps {
    variables: VariableState[];
    selectedResource: ResourceState | null;
    selectedVariableName: string | null;
    selectedVariable: VariableState | null;
    selectedVariableAttributesTableData: [string, any][];
    variableListHeight: number;
    showVariableDetails: boolean;
    showSelectedVariableLayer: boolean;
    activeViewId: string;
    activeViewType: string;
    savedLayers: SavedLayers;
    selectedPlacemark: Placemark | null;
    selectedEntity: Cesium.Entity | null;
    globeViewPosition: GeographicPosition | null;
    positionData: { [varName: string]: number } | null
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        variables: selectors.variablesSelector(state) || selectors.EMPTY_ARRAY,
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariableName: selectors.selectedVariableNameSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        selectedVariableAttributesTableData: selectors.selectedVariableAttributesTableDataSelector(state),
        variableListHeight: state.session.variableListHeight,
        showVariableDetails: state.session.showVariableDetails,
        showSelectedVariableLayer: state.session.showSelectedVariableLayer,
        activeViewId: selectors.activeViewIdSelector(state),
        activeViewType: selectors.activeViewTypeSelector(state),
        savedLayers: selectors.savedLayersSelector(state),
        selectedPlacemark: selectors.selectedPlacemarkSelector(state),
        selectedEntity: selectors.selectedEntitySelector(state),
        globeViewPosition: state.location.globeViewPosition,
        positionData: state.location.positionData,
    }
}

/**
 * The VariablesPanel list all variables of the selected workspace resource.
 *
 * @author Marco Zuehlke, Norman Fomferra
 */
class VariablesPanel extends React.Component<IVariablesPanelProps & DispatchProp<State>, null> {
    static readonly VALUE_STYLE: CSSProperties = {float: 'right', color: Colors.BLUE5};


    constructor(props: IVariablesPanelProps & DispatchProp<State>) {
        super(props);
        this.handleSelectedVariableNameChanged = this.handleSelectedVariableNameChanged.bind(this);
        this.handleListHeightChanged = this.handleListHeightChanged.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleShowSelectedVariableLayer = this.handleShowSelectedVariableLayer.bind(this);
        this.handleAddVariableLayer = this.handleAddVariableLayer.bind(this);
        this.handleAddVariableTimeSeriesPlot = this.handleAddVariableTimeSeriesPlot.bind(this);
        this.handleAddVariableHistogramPlot = this.handleAddVariableHistogramPlot.bind(this);
        this.handleShowVariableTableView = this.handleShowVariableTableView.bind(this);
    }

    private handleSelectedVariableNameChanged(newSelection: Array<React.Key>) {
        const resource = this.props.selectedResource;
        assert.ok(resource);
        if (newSelection && newSelection.length) {
            const selectedVariableName = newSelection[0] as string;
            const selectedVariable = this.props.variables.find(v => v.name === selectedVariableName);
            assert.ok(selectedVariable);
            this.props.dispatch(actions.setSelectedVariable(resource, selectedVariable, this.props.savedLayers));
        } else {
            this.props.dispatch(actions.setSelectedVariable(resource, null));
        }
    }

    private handleListHeightChanged(value: number) {
        this.props.dispatch(actions.setSessionProperty('variableListHeight', value));
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setSessionProperty('showVariableDetails', value));
    }

    private handleShowSelectedVariableLayer() {
        const showSelectedVariableLayer = this.props.showSelectedVariableLayer;
        this.props.dispatch(actions.setShowSelectedVariableLayer(!showSelectedVariableLayer));
    }

    private handleAddVariableLayer() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        const activeViewId = this.props.activeViewId;
        const savedLayers = this.props.savedLayers;
        assert.ok(resource);
        assert.ok(variable && variable.imageLayout);
        assert.ok(activeViewId);
        this.props.dispatch(actions.addVariableLayer(activeViewId, resource, variable, true, savedLayers));
    }

    private handleAddVariableTimeSeriesPlot() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        const placemark = this.props.selectedPlacemark;
        const placemarkName = placemark.properties['name'] || 'placemark';
        const placemarkPosition = placemark.geometry.coordinates;
        const opArgs = {
            ds: {source: resource.name},
            'var': {value: variable.name},
            indexers: {value: `lon=${placemarkPosition[0]}, lat=${placemarkPosition[1]}`},
            properties: {value: null},
            file: {value: null},
        };
        this.props.dispatch(actions.setWorkspaceResource('cate.ops.plot.plot', opArgs,
                                                         null, false,
                                                         `Creating time series plot for placemark ${placemarkName}`)  as any);
    }

    private handleAddVariableHistogramPlot() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        const opArgs = {
            ds: {source: resource.name},
            'var': {value: variable.name},
            indexers: {value: null},
            properties: {value: 'bins=250'},
            file: {value: null},
        };
        this.props.dispatch(actions.setWorkspaceResource('cate.ops.plot.plot_hist', opArgs,
                                                         null, false,
                                                         'Creating histogram plot') as any);
    }

    private handleShowVariableTableView() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        assert.ok(resource);
        assert.ok(variable);
        this.props.dispatch(actions.showTableView(resource.name, variable.name, this.props.activeViewId));
    }

    render() {
        const resource = this.props.selectedResource;
        const variables = this.props.variables;
        if (variables && variables.length) {
            return (
                <ContentWithDetailsPanel showDetails={this.props.showVariableDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged}
                                         isSplitPanel={true}
                                         contentHeight={this.props.variableListHeight}
                                         onContentHeightChange={this.handleListHeightChanged}
                                         actionComponent={this.renderVariableActionRow()}>
                    <VariablesListPanel
                        selectedEntity={this.props.selectedEntity}
                        globeViewPosition={this.props.globeViewPosition}
                        positionData={this.props.positionData}
                        selectedVariableName={this.props.selectedVariableName}
                        onSelectedVariableNameChanged={this.handleSelectedVariableNameChanged}
                        variables={this.props.variables}
                    />
                    <VariableDetailsPanel
                        tableData={this.props.selectedVariableAttributesTableData}
                    />
                </ContentWithDetailsPanel>
            );
        } else if (resource) {
            return NO_VARIABLES_EMPTY_RESOURCE(resource.name);
        } else {
            return NO_VARIABLES;
        }
    }

    private renderVariableActionRow() {
        const selectedVariable = this.props.selectedVariable;
        const isSpatialVariable = selectedVariable && selectedVariable.numDims >= 2 && selectedVariable.imageLayout;
        const placemark = this.props.selectedPlacemark;
        const hasWorldView = this.props.activeViewType && this.props.activeViewType === 'world';
        const canAddLayer = isSpatialVariable && hasWorldView;
        const canAddTimeSeriesPlot = isSpatialVariable && placemark;
        const canAddHistogramPlot = selectedVariable && selectedVariable.numDims > 0;
        const maxSize = 10000;
        return (
            <div className="pt-button-group">
                <ToolButton tooltipContent="Toggle image layer visibility"
                            tooltipPosition={Position.LEFT}
                            icon={this.props.showSelectedVariableLayer ? 'eye-open' : 'eye-off'}
                            onClick={this.handleShowSelectedVariableLayer}/>
                <ToolButton tooltipContent="Add a new image layer"
                            tooltipPosition={Position.LEFT}
                            disabled={!canAddLayer}
                            icon="layer"
                            onClick={this.handleAddVariableLayer}
                />
                <ToolButton tooltipContent="Create a time series plot from selected placemark"
                            tooltipPosition={Position.LEFT}
                            disabled={!canAddTimeSeriesPlot}
                            icon="timeline-line-chart"
                            onClick={this.handleAddVariableTimeSeriesPlot}
                />
                <ToolButton tooltipContent="Create a histogram plot"
                            tooltipPosition={Position.LEFT}
                            disabled={!canAddHistogramPlot}
                            icon="timeline-bar-chart"
                            onClick={this.handleAddVariableHistogramPlot}
                />
                <ToolButton tooltipContent={`Show data in table (only first ${maxSize} values)`}
                            tooltipPosition={Position.LEFT}
                            icon="th"
                            onClick={this.handleShowVariableTableView}
                />
            </div>
        );
    }


}

export default connect(mapStateToProps)(VariablesPanel);


interface VariablesListPanelProps {
    variables: VariableState[];
    selectedVariableName: string | null;
    onSelectedVariableNameChanged: (selectedVariableName: Array<React.Key>) => void;
    selectedEntity: Cesium.Entity | null;
    globeViewPosition: GeographicPosition | null;
    positionData: { [varName: string]: number } | null
}

class VariablesListPanel extends React.PureComponent<VariablesListPanelProps> {
    private getItemKey = (variable: VariableState) => {
        return variable.name;
    };

    private getItemValue = (variable: VariableState) => {

        let value;

        if (isSpatialVectorVariable(variable)) {
            const selectedEntity = this.props.selectedEntity;
            if (selectedEntity && selectedEntity.properties) {
                const property = selectedEntity.properties[variable.name];
                if (isDefinedAndNotNull(property)) {
                    value = property.getValue();
                }
            }
        } else if (isSpatialImageVariable(variable)) {
            const positionData = this.props.positionData;
            if (positionData) {
                value = positionData[variable.name];
            }
        }

        return isDefined(value) ? value : variable.value;
    };

    private renderItem = (variable: VariableState) => {

        const label = (
            <LabelWithType
                label={variable.name}
                dataType={variable.dataType}
                tooltipText={variable.attributes && variable.attributes.long_name}
            />
        );

        const value = this.getItemValue(variable);
        if (!isDefined(value)) {
            return label;
        }

        return (
            <div>
                {label}
                <span style={VariablesPanel.VALUE_STYLE}>{value}</span>
            </div>
        );
    };

    private handleVariableNameSelection = (selectedVariableName: Array<React.Key>) => {
        this.props.onSelectedVariableNameChanged(selectedVariableName);
    };

    render() {
        // We compute a new key here to force updates of the list box items either when the selected entity
        // changes or new position data may be available.
        let key = 'vlb';
        const selectedEntityId = this.props.selectedEntity && this.props.selectedEntity.id;
        if (selectedEntityId) {
            key += `_${selectedEntityId}`;
        }
        const geoPos = this.props.globeViewPosition;
        if (geoPos) {
            key += `_${geoPos.longitude},${geoPos.latitude}`;
        }
        return (
            <ScrollablePanelContent>
                <ListBox key={key}
                         items={this.props.variables}
                         getItemKey={this.getItemKey}
                         renderItem={this.renderItem}
                         selection={this.props.selectedVariableName}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         onSelection={this.handleVariableNameSelection}/>
            </ScrollablePanelContent>
        );
    }
}

interface VariableDetailsPanelProps {
    tableData: [string, any][] | null;
}

class VariableDetailsPanel extends React.PureComponent<VariableDetailsPanelProps> {
    static readonly DIV_STYLE: CSSProperties = {paddingTop: 4, width: '100%'};

    private renderAttributeName = (index: number): any => {
        return <Cell>{this.props.tableData[index][0]}</Cell>;
    };

    private renderAttributeValue = (index: number): any => {
        return <Cell><TruncatedFormat>{this.props.tableData[index][1]}</TruncatedFormat></Cell>;
    };

    render() {
        const tableData = this.props.tableData;
        if (!tableData || !tableData.length) {
            return null;
        }
        return (
            <div style={VariableDetailsPanel.DIV_STYLE}>
                <Table numRows={tableData.length} enableRowHeader={false}>
                    <Column name="Name" cellRenderer={this.renderAttributeName}/>
                    <Column name="Value" cellRenderer={this.renderAttributeValue}/>
                </Table>
            </div>
        );
    }
}
