import * as React from "react";
import {connect} from "react-redux";
import {State, VariableState, ResourceState, SavedVariableLayers} from "../state";
import * as assert from "../../common/assert";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {Card} from "../components/Card";
import {LabelWithType} from "../components/LabelWithType";
import {Button, NonIdealState} from "@blueprintjs/core";
import {ScrollablePanelContent} from "../components/ScrollableContent";

interface IVariablesPanelProps {
    dispatch?: any;
    variables: VariableState[]|null;
    selectedResource: ResourceState|null;
    selectedVariableName: string|null;
    selectedVariable: VariableState|null;
    showVariableDetails: boolean;
    showSelectedVariableLayer: boolean;
    activeViewId: string;
    activeViewType: string;
    savedLayers: SavedVariableLayers;
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        variables: selectors.variablesSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariableName: selectors.selectedVariableNameSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        showVariableDetails: state.control.showVariableDetails,
        showSelectedVariableLayer: state.session.showSelectedVariableLayer,
        activeViewId: selectors.activeViewIdSelector(state),
        activeViewType: selectors.activeViewTypeSelector(state),
        savedLayers: selectors.savedLayersSelector(state),
    }
}

/**
 * The VariablesPanel list all variables of the selected workspace resource.
 *
 * @author Marco Zuehlke, Norman Fomferra
 */
class VariablesPanel extends React.Component<IVariablesPanelProps, null> {
    constructor(props: IVariablesPanelProps) {
        super(props);
        this.handleSelectedVariableName = this.handleSelectedVariableName.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleShowSelectedVariableLayer = this.handleShowSelectedVariableLayer.bind(this);
        this.handleAddVariableLayer = this.handleAddVariableLayer.bind(this);
    }

    private handleSelectedVariableName(newSelection: Array<React.Key>) {
        const resource = this.props.selectedResource;
        assert.ok(resource);
        if (newSelection && newSelection.length) {
            const selectedVariableName = newSelection[0] as string;
            const selectedVariable = (this.props.variables || []).find(v => v.name === selectedVariableName);
            assert.ok(selectedVariable);
            this.props.dispatch(actions.setSelectedVariable(resource, selectedVariable, this.props.savedLayers));
        } else {
            this.props.dispatch(actions.setSelectedVariable(resource, null, null));
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlProperty('showVariableDetails', value));
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

    render() {
        const resource = this.props.selectedResource;
        const variables = this.props.variables;
        if (variables && variables.length) {
            return (
                <ContentWithDetailsPanel showDetails={this.props.showVariableDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged}
                                         isSplitPanel={true}
                                         initialContentHeight={200}
                                         actionComponent={this.renderVariableActionRow()}>
                    {this.renderVariablesList()}
                    {this.renderVariableDetails()}
                </ContentWithDetailsPanel>
            );
        } else if (resource) {
            return (
                <NonIdealState title="No variables"
                               visual="pt-icon-variable"
                               description={`Selected resource "${resource.name}" doesn't contain any variables.`}/>
            );
        } else {
            return (
                <NonIdealState title="No variables"
                               visual="pt-icon-variable"
                               description={`Select a resource in the WORKSPACE panel first.`}/>
            );
        }
    }

    private renderVariableActionRow() {
        const selectedVariable = this.props.selectedVariable;
        const isSpatialVariable = selectedVariable && selectedVariable.ndim >= 2 && selectedVariable.imageLayout;
        const hasWorldView = this.props.activeViewType && this.props.activeViewType === 'world';
        const canAddLayer = isSpatialVariable && hasWorldView;
        return (
            <div className="pt-button-group">
                <Button disabled={false}
                        iconName={this.props.showSelectedVariableLayer ? "eye-open" : "eye-off"}
                        onClick={this.handleShowSelectedVariableLayer}
                />
                <Button disabled={!canAddLayer}
                        iconName="layer"
                        onClick={this.handleAddVariableLayer}
                />
            </div>
        );
    }

    private renderVariableDetails() {
        const selectedVariable = this.props.selectedVariable;
        if (!selectedVariable) {
            return null;
        }
        const entries = [
            VariablesPanel.renderDetailRow('Data type', selectedVariable.dataType),
            VariablesPanel.renderDetailRow('Units', selectedVariable.units),
            VariablesPanel.renderDetailRow('#Dimensions', selectedVariable.ndim),
            VariablesPanel.renderDetailRow('Dimensions', selectedVariable.dimensions && selectedVariable.dimensions.join(', ')),
            VariablesPanel.renderDetailRow('Shape', selectedVariable.shape && selectedVariable.shape.join(', ')),
            VariablesPanel.renderDetailRow('Chunks', selectedVariable.chunks && selectedVariable.chunks.join(', ')),
            VariablesPanel.renderDetailRow('Valid min.', selectedVariable.valid_min),
            VariablesPanel.renderDetailRow('Valid max.', selectedVariable.valid_max),
            VariablesPanel.renderDetailRow('Add offset', selectedVariable.add_offset),
            VariablesPanel.renderDetailRow('Scale factor', selectedVariable.scale_factor),
            VariablesPanel.renderDetailRow('Comment', selectedVariable.comment),
        ];
        return (
            <Card>
                <table className="pt-table pt-condensed pt-striped">
                    <tbody>{entries}</tbody>
                </table>
            </Card>
        );
    }

    private static renderDetailRow(label: string, value: any) {
        if (typeof(value) === 'undefined')
            return null;
        return (
            <tr key={label}>
                <td>{label}</td>
                <td>{value !== null ? value : '-'}</td>
            </tr>
        );
    }

    private static getItemKey(variable: VariableState) {
        return variable.name;
    }

    private static renderItem(variable: VariableState) {
        return <LabelWithType label={variable.name} dataType={variable.dataType}/>;
    }

    private renderVariablesList() {
        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.variables}
                         getItemKey={VariablesPanel.getItemKey}
                         renderItem={VariablesPanel.renderItem}
                         selection={this.props.selectedVariableName}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         onSelection={this.handleSelectedVariableName}/>
            </ScrollablePanelContent>
        );
    }
}

export default connect(mapStateToProps)(VariablesPanel);
