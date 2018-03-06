import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {State, VariableState, ResourceState, SavedLayers, Placemark} from "../state";
import * as assert from "../../common/assert";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {LabelWithType} from "../components/LabelWithType";
import {AnchorButton, Tooltip, Position, Colors} from "@blueprintjs/core";
import {Cell, Column, Table, TruncatedFormat} from "@blueprintjs/table";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {NO_VARIABLES, NO_VARIABLES_EMPTY_RESOURCE} from "../messages";
import {CSSProperties} from "react";
import * as Cesium from "cesium";

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
    }
}

/**
 * The VariablesPanel list all variables of the selected workspace resource.
 *
 * @author Marco Zuehlke, Norman Fomferra
 */
class VariablesPanel extends React.Component<IVariablesPanelProps & DispatchProp<State>, null> {
    static readonly DIV_STYLE: CSSProperties = {paddingTop: 4, width: '100%'};
    static readonly VALUE_STYLE = {float: "right", color: Colors.BLUE5};


    constructor(props: IVariablesPanelProps & DispatchProp<State>) {
        super(props);
        this.handleSelectedVariableName = this.handleSelectedVariableName.bind(this);
        this.handleListHeightChanged = this.handleListHeightChanged.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleShowSelectedVariableLayer = this.handleShowSelectedVariableLayer.bind(this);
        this.handleAddVariableLayer = this.handleAddVariableLayer.bind(this);
        this.handleAddVariableTimeSeriesPlot = this.handleAddVariableTimeSeriesPlot.bind(this);
        this.handleAddVariableHistogramPlot = this.handleAddVariableHistogramPlot.bind(this);
        this.handleShowVariableTableView = this.handleShowVariableTableView.bind(this);
        this.renderAttributeName = this.renderAttributeName.bind(this);
        this.renderAttributeValue = this.renderAttributeValue.bind(this);
    }

    private handleSelectedVariableName(newSelection: Array<React.Key>) {
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
                                                         `Creating time series plot for placemark ${placemarkName}`));
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
                                                         "Creating histogram plot"));
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
                    {this.renderVariablesList()}
                    {this.renderVariableDetails()}
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
        const size = selectedVariable && selectedVariable.shape && selectedVariable.shape.reduce((a, b) => a * b, 1);
        const maxSize = 10000;
        const canShowTableView = selectedVariable && size < maxSize;
        return (
            <div className="pt-button-group">
                <Tooltip content="Toggle image layer visibility" position={Position.LEFT}>
                    <AnchorButton disabled={false}
                                  iconName={this.props.showSelectedVariableLayer ? "eye-open" : "eye-off"}
                                  onClick={this.handleShowSelectedVariableLayer}
                    />
                </Tooltip>
                <Tooltip content="Add a new image layer" position={Position.LEFT}>
                    <AnchorButton disabled={!canAddLayer}
                                  iconName="layer"
                                  onClick={this.handleAddVariableLayer}
                    />
                </Tooltip>
                <Tooltip content="Create a time series plot from selected placemark" position={Position.LEFT}>
                    <AnchorButton disabled={!canAddTimeSeriesPlot}
                                  iconName="timeline-line-chart"
                                  onClick={this.handleAddVariableTimeSeriesPlot}
                    />
                </Tooltip>
                <Tooltip content="Create a histogram plot" position={Position.LEFT}>
                    <AnchorButton disabled={!canAddHistogramPlot}
                                  iconName="timeline-bar-chart"
                                  onClick={this.handleAddVariableHistogramPlot}
                    />
                </Tooltip>
                <Tooltip content={`Show data in table (for sizes < ${maxSize})`} position={Position.LEFT}>
                    <AnchorButton disabled={!canShowTableView}
                                  iconName="pt-icon-th"
                                  onClick={this.handleShowVariableTableView}
                    />
                </Tooltip>
            </div>
        );
    }

    private renderAttributeName(index: number): any {
        return <Cell>{this.props.selectedVariableAttributesTableData[index][0]}</Cell>;
    }

    private renderAttributeValue(index: number): any {
        return <Cell><TruncatedFormat>{this.props.selectedVariableAttributesTableData[index][1]}</TruncatedFormat></Cell>;
    }

    private renderVariableDetails() {
        const tableData = this.props.selectedVariableAttributesTableData;
        if (!tableData || !tableData.length) {
            return null;
        }
        return (
            <div style={VariablesPanel.DIV_STYLE}>
                <Table numRows={tableData.length} isRowHeaderShown={false}>
                    <Column name="Name" renderCell={this.renderAttributeName}/>
                    <Column name="Value" renderCell={this.renderAttributeValue}/>
                </Table>
            </div>
        );
    }

    private static getItemKey(variable: VariableState) {
        return variable.name;
    }

    private static renderItem(variable: VariableState) {
        return <LabelWithType label={variable.name} dataType={variable.dataType}/>;
    }

    private renderVariablesList() {
        const selectedEntity = this.props.selectedEntity;
        let renderItemFunc = VariablesPanel.renderItem;
        if (selectedEntity) {
            renderItemFunc = (variable: VariableState) => {
                const varNameRender = VariablesPanel.renderItem(variable);
                const property = selectedEntity.properties[variable.name];
                if (property) {
                    return <div>{varNameRender}<span style={VariablesPanel.VALUE_STYLE}>{property.getValue()}</span></div>;
                }
                return varNameRender;
            }
        }
        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.variables}
                         getItemKey={VariablesPanel.getItemKey}
                         renderItem={renderItemFunc}
                         selection={this.props.selectedVariableName}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         onSelection={this.handleSelectedVariableName}/>
            </ScrollablePanelContent>
        );
    }
}

export default connect(mapStateToProps)(VariablesPanel);
