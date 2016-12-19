import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, WorkspaceState, ResourceState, VariableState} from "../state";
import * as actions from "../actions";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {Card} from "../components/Card";

interface IVariablesPanelProps {
    dispatch?: any;
    workspace: WorkspaceState;
    selectedResourceVariableId: string;
    selectedWorkspaceResourceId: string;
    showVariablesDetails: boolean;
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        workspace: state.data.workspace,
        selectedResourceVariableId: state.control.selectedResourceVariableId,
        selectedWorkspaceResourceId: state.control.selectedWorkspaceResourceId,
        showVariablesDetails : state.control.showVariablesDetails,
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
            this.props.dispatch(actions.setSelectedResourceVariableId(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedResourceVariableId(null));
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlState('showVariablesDetails', value));
    }

    private numberArrayToString(numbers: number[], defaultValue: string) {
        if (numbers)
            return "[" + numbers.join(",") + "]";
        else
            return defaultValue;
    }

    private stringArrayToString(numbers: string[], defaultValue: string) {
        if (numbers)
            return numbers.join("\n");
        else
            return defaultValue;
    }

    render() {
        let variableStates: VariableState[] = [];
        if (this.props.workspace && this.props.selectedWorkspaceResourceId) {
            const resources: Array<ResourceState> = this.props.workspace.resources;
            if (resources) {
                const selectedResource = resources.find(res => res.name === this.props.selectedWorkspaceResourceId);
                if (selectedResource && selectedResource.variables) {
                    variableStates = selectedResource.variables;
                }
            }
        }
        const renderItem = (itemIndex: number) => {
            return (<span>{variableStates[itemIndex].name}</span>);
        };
        const varListComponent = <ListBox numItems={variableStates.length}
                                          getItemKey={index => variableStates[index].name}
                                          renderItem={renderItem}
                                          selection={this.props.selectedResourceVariableId ? [this.props.selectedResourceVariableId] : null}
                                          selectionMode={ListBoxSelectionMode.SINGLE}
                                          onSelection={this.handleSelected.bind(this)}/>;

        let variablesDetailsPanel = null;
        if (variableStates && this.props.selectedResourceVariableId) {
            const selectedVariable = variableStates.find(v => v.name === this.props.selectedResourceVariableId);
            if (selectedVariable) {
                const variableItems = [];
                variableItems.push(<tr key='dataType'><td>Datatype</td><td>{selectedVariable.dataType || '-'}</td></tr>);

                variableItems.push(<tr key='ndim'><td>Num dims</td><td>{selectedVariable.ndim || '-'}</td></tr>);
                variableItems.push(<tr key='shape'><td>Shape</td><td>{this.numberArrayToString(selectedVariable.shape, '-')}</td></tr>);
                // chunk  TODO
                variableItems.push(<tr key='dimensions'><td>Dimensions</td><td>{this.stringArrayToString(selectedVariable.dimensions, '-')}</td></tr>);

                variableItems.push(<tr key='valid_min'><td>Valid min</td><td>{selectedVariable.valid_min || '-'}</td></tr>);
                variableItems.push(<tr key='valid_max'><td>Valid max</td><td>{selectedVariable.valid_max || '-'}</td></tr>);
                variableItems.push(<tr key='add_offset'><td>Add offset</td><td>{selectedVariable.add_offset || '-'}</td></tr>);
                variableItems.push(<tr key='scale_factor'><td>Scale Factor</td><td>{selectedVariable.scale_factor || '-'}</td></tr>);

                variableItems.push(<tr key='standard_name'><td>Standard Name</td><td>{selectedVariable.standard_name || '-'}</td></tr>);
                variableItems.push(<tr key='long_name'><td>Long name</td><td>{selectedVariable.long_name || '-'}</td></tr>);
                variableItems.push(<tr key='units'><td>Units</td><td>{selectedVariable.units || '-'}</td></tr>);
                variableItems.push(<tr key='comment'><td>Comment</td><td>{selectedVariable.comment || '-'}</td></tr>);

                variablesDetailsPanel = (
                    <Card>
                        <table className="pt-table pt-condensed pt-striped">
                            <tbody>{variableItems}</tbody>
                        </table>
                    </Card>
                );
            }
        }
        return (
            <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
                <ContentWithDetailsPanel showDetails={this.props.showVariablesDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged.bind(this)}
                                         isSplitPanel={true}
                                         initialContentHeight={200}>
                    {varListComponent}
                    {variablesDetailsPanel}
                </ContentWithDetailsPanel>
            </ExpansionPanel>
        );
    }
}
export default connect(mapStateToProps)(VariablesPanel);
