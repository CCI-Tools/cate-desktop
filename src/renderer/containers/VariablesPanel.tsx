import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, VariableState, ResourceState} from "../state";
import * as assert from "../../common/assert";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {Card} from "../components/Card";
import {LabelWithType} from "../components/LabelWithType";
import {Button} from "@blueprintjs/core";

interface IVariablesPanelProps {
    dispatch?: any;
    variables: VariableState[];
    selectedResource: ResourceState|null;
    selectedVariableName: string|null;
    selectedVariable: VariableState|null;
    showVariableDetails: boolean;
    showSelectedVariableLayer: boolean;
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        variables: selectors.variablesSelector(state) || [],
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariableName: selectors.selectedVariableNameSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        showVariableDetails: state.control.showVariableDetails,
        showSelectedVariableLayer: state.session.showSelectedVariableLayer
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
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedVariableName(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedVariableName(null));
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
        assert.ok(resource);
        assert.ok(variable && variable.imageLayout);
        this.props.dispatch(actions.addVariableLayer(null, resource, variable));
    }

    render() {
        const variables = this.props.variables;
        if (variables && variables.length) {
            // return (
            //     <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
            //         <ContentWithDetailsPanel showDetails={this.props.showVariableDetails}
            //                                  onShowDetailsChange={this.handleShowDetailsChanged}
            //                                  isSplitPanel={true}
            //                                  initialContentHeight={200}
            //                                  actionComponent={this.renderVariableActionRow()}>
            //             {this.renderVariablesList()}
            //             {this.renderVariableDetails()}
            //         </ContentWithDetailsPanel>
            //     </ExpansionPanel>
            // );
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
        } else {
            // return (
            //     <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
            //         <Card>
            //             <p><strong>No variables</strong></p>
            //             <p>
            //                 The currently selected resource in the workspace does not contain any variables.
            //             </p>
            //         </Card>
            //     </ExpansionPanel>
            // );
            return (
                <Card>
                    <p><strong>No variables</strong></p>
                    <p>
                        The currently selected resource in the workspace does not contain any variables.
                    </p>
                </Card>
            );
        }
    }

    private renderVariableActionRow() {
        const selectedVariable = this.props.selectedVariable;
        const isSpatialVariable = selectedVariable && selectedVariable.ndim >= 2 && selectedVariable.imageLayout;
        return (
            <div className="pt-button-group">
                <Button disabled={false}
                        iconName={this.props.showSelectedVariableLayer ? "eye-open" : "eye-off"}
                        onClick={this.handleShowSelectedVariableLayer}
                />
                <Button disabled={!isSpatialVariable}
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
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox items={this.props.variables}
                         getItemKey={VariablesPanel.getItemKey}
                         renderItem={VariablesPanel.renderItem}
                         selection={this.props.selectedVariableName}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         onSelection={this.handleSelectedVariableName}/>
            </div>
        );
    }
}

export default connect(mapStateToProps)(VariablesPanel);
