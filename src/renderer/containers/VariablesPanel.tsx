import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, WorkspaceState, ResourceState, VariableState} from "../state";
import * as actions from "../actions";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {Card} from "../components/Card";
import {LabelWithType} from "../components/LabelWithType";

interface IVariablesPanelProps {
    dispatch?: any;
    workspace: WorkspaceState;
    selectedVariableName: string;
    selectedWorkspaceResourceId: string;
    showVariableDetails: boolean;
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        workspace: state.data.workspace,
        selectedVariableName: state.control.selectedVariableName,
        selectedWorkspaceResourceId: state.control.selectedWorkspaceResourceId,
        showVariableDetails: state.control.showVariableDetails,
    }
}

/**
 * The VariablesPanel list all variables of the selected workspace resource.
 *
 * @author Marco Zuehlke
 */
class VariablesPanel extends React.Component<IVariablesPanelProps, null> {
    constructor(props: IVariablesPanelProps) {
        super(props);
    }

    private handleSelected(oldSelection: Array<React.Key>, newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedVariableName(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedVariableName(null));
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlState('showVariableDetails', value));
    }

    render() {
        let variables: VariableState[] = [];
        if (this.props.workspace && this.props.selectedWorkspaceResourceId) {
            const resources: Array<ResourceState> = this.props.workspace.resources;
            if (resources) {
                const selectedResource = resources.find(res => res.name === this.props.selectedWorkspaceResourceId);
                if (selectedResource && selectedResource.variables) {
                    variables = selectedResource.variables;
                }
            }
        }
        const renderItem = (itemIndex: number) => {
            const variable = variables[itemIndex];
            return <LabelWithType label={variable.name} dataType={variable.dataType}/>;
        };
        const varListComponent = <ListBox numItems={variables.length}
                                          getItemKey={index => variables[index].name}
                                          renderItem={renderItem}
                                          selection={this.props.selectedVariableName ? [this.props.selectedVariableName] : null}
                                          selectionMode={ListBoxSelectionMode.SINGLE}
                                          onSelection={this.handleSelected.bind(this)}/>;

        let detailPanel = null;
        if (variables && this.props.selectedVariableName) {
            const selectedVariable = variables.find(v => v.name === this.props.selectedVariableName);
            if (selectedVariable) {
                const entries = [
                    <tr key='dataType'>
                        <td>Data type</td>
                        <td>{selectedVariable.dataType || '-'}</td>
                    </tr>,
                    <tr key='units'>
                        <td>Units</td>
                        <td>{selectedVariable.units || '-'}</td>
                    </tr>,
                    <tr key='ndim'>
                        <td>#Dimensions</td>
                        <td>{selectedVariable.ndim || '-'}</td>
                    </tr>,
                    <tr key='shape'>
                        <td>Shape</td>
                        <td>{selectedVariable.shape ? selectedVariable.shape.join(', ') : '-'}</td>
                    </tr>,
                    <tr key='dimensions'>
                        <td>Dimensions</td>
                        <td>{selectedVariable.dimensions ? selectedVariable.dimensions.join(', ') : '-'}</td>
                    </tr>,
                    <tr key='valid_min'>
                        <td>Valid min.</td>
                        <td>{selectedVariable.valid_min || '-'}</td>
                    </tr>,
                    <tr key='valid_max'>
                        <td>Valid max.</td>
                        <td>{selectedVariable.valid_max || '-'}</td>
                    </tr>,
                    <tr key='add_offset'>
                        <td>Add offset</td>
                        <td>{selectedVariable.add_offset || '-'}</td>
                    </tr>,
                    <tr key='scale_factor'>
                        <td>Scale factor</td>
                        <td>{selectedVariable.scale_factor || '-'}</td>
                    </tr>,
                    <tr key='comment'>
                        <td>Comment</td>
                        <td>{selectedVariable.comment || '-'}</td>
                    </tr>,
                ];
                detailPanel = (
                    <Card>
                        <table className="pt-table pt-condensed pt-striped">
                            <tbody>{entries}</tbody>
                        </table>
                    </Card>
                );
            }
        }
        if (variables.length) {
            return (
                <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
                    <ContentWithDetailsPanel showDetails={this.props.showVariableDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged.bind(this)}
                                             isSplitPanel={true}
                                             initialContentHeight={200}>
                        {varListComponent}
                        {detailPanel}
                    </ContentWithDetailsPanel>
                </ExpansionPanel>
            );
        } else {
            return (
                <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
                    <Card>
                        <p><strong>No variables</strong></p>
                        <p>
                            The currently selected resource in the workspace does not contain any variables.
                        </p>
                    </Card>
                </ExpansionPanel>
            );
        }
    }
}
export default connect(mapStateToProps)(VariablesPanel);
