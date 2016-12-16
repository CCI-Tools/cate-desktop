import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "./ExpansionPanel";
import {State, WorkspaceState, ResourceState, VariableState} from "../state";
import * as actions from "../actions";
import {ListBox, ListBoxSelectionMode} from "./ListBox";

interface IVariablesPanelProps {
    dispatch?: any;
    workspace: WorkspaceState;
    selectedResourceVariableId: string;
    selectedWorkspaceResourceId: string;
}

function mapStateToProps(state: State): IVariablesPanelProps {
    return {
        workspace: state.data.workspace,
        selectedResourceVariableId: state.control.selectedResourceVariableId,
        selectedWorkspaceResourceId: state.control.selectedWorkspaceResourceId,
    };
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

    render() {
        let variables: VariableState[] = [];
        if (this.props.workspace && this.props.selectedWorkspaceResourceId) {
            const resources: Array<ResourceState> = this.props.workspace.resources;
            if (resources) {
                const resource = resources.find(res => res.name === this.props.selectedWorkspaceResourceId);
                if (resource && resource.variables) {
                    variables = resource.variables;
                }
            }
        }
        const renderItem = (itemIndex: number) => {
            return (<span>{variables[itemIndex].name}</span>);
        };
        return (
            <ExpansionPanel icon="pt-icon-variable" text="Variables" isExpanded={true} defaultHeight={200}>
                <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                    <ListBox numItems={variables.length}
                             getItemKey={index => variables[index].name}
                             renderItem={renderItem}
                             selection={this.props.selectedResourceVariableId ? [this.props.selectedResourceVariableId] : null}
                             selectionMode={ListBoxSelectionMode.SINGLE}
                             onSelection={this.handleSelected.bind(this)}/>
                </div>
            </ExpansionPanel>
        );
    }
}
export default connect(mapStateToProps)(VariablesPanel);
