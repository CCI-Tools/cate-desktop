import * as React from 'react';
import {connect} from 'react-redux';
import {State} from "../state";
import {Classes, Tree, ITreeNode, Tooltip} from "@blueprintjs/core";
import {ExpansionPanel} from "./ExpansionPanel";

export interface ITreeExampleState {
    nodes: ITreeNode[];
}

function mapStateToProps(state: State) {
    return {
        workspace: state.data.workspace,
        selectedWorkflowStepId: state.control.selectedWorkflowStepId,
        selectedWorkflowResourceId: state.control.selectedWorkflowResourceId,
    };
}

/**
 * The WorkspacePanel lets user browse the currently opened workspace.
 * It comprises the workspace files, and the workflow which is subdivided into
 * workspace resources and workspace steps (operations).
 *
 * @author Norman Fomferra
 */
class WorkspacePanel extends React.Component<any, any> {
     constructor(props) {
        super();

        const resourcesTooltip = "Workspace resources that result from workflow steps";
        const stepsTooltip = "Workflow steps that generate resources";

        const resourcesMoreMenu = <span className="pt-icon-standard pt-icon-edit"/>;
        const operationsMoreMenu = <span className="pt-icon-standard pt-icon-more"/>;

        this.state = {
            nodes: [
                {
                    id: 'resources',
                    hasCaret: true,
                    isExpanded: true,
                    iconName: "database",
                    label: <Tooltip content={resourcesTooltip}>Resources</Tooltip>,
                    childNodes: [
                        {label: "Resource #1", secondaryLabel: resourcesMoreMenu,},
                        {label: "Resource #2", secondaryLabel: resourcesMoreMenu,},
                        {label: "Resource #3", secondaryLabel: resourcesMoreMenu,},
                        {label: "Resource #4", secondaryLabel: resourcesMoreMenu,},
                    ],
                },
                {
                    id: 'steps',
                    hasCaret: false,
                    isExpanded: true,
                    iconName: "function",
                    label: <Tooltip content={stepsTooltip}>Workflow Steps</Tooltip>,
                    childNodes: [
                        {label: "Operation Step #1", secondaryLabel: operationsMoreMenu,},
                        {label: "Operation Step #2", secondaryLabel: operationsMoreMenu,},
                        {label: "Operation Step #3", secondaryLabel: operationsMoreMenu,},
                        {label: "Operation Step #4", secondaryLabel: operationsMoreMenu,},
                    ],
                },
            ],
        } as any as ITreeExampleState;
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Override @PureRender because nodes are not a primitive type and therefore aren't included in
     * shallow prop comparison
     */
    public shouldComponentUpdate() {
        return true;
    }

    private handleNodeClick = (nodeData: ITreeNode, _nodePath: number[], e: React.MouseEvent<HTMLElement>) => {
        const originallySelected = nodeData.isSelected;
        if (!e.shiftKey) {
            this.forEachNode(this.state.nodes, (n) => n.isSelected = false);
        }
        nodeData.isSelected = originallySelected == null ? true : !originallySelected;
        this.setState(this.state);
    };

    private handleNodeCollapse = (nodeData: ITreeNode) => {
        nodeData.isExpanded = false;
        this.setState(this.state);
    };

    private handleNodeExpand = (nodeData: ITreeNode) => {
        nodeData.isExpanded = true;
        this.setState(this.state);
    };

    private forEachNode(nodes: ITreeNode[], callback: (node: ITreeNode) => void) {
        if (nodes == null) {
            return;
        }

        for (const node of nodes) {
            callback(node);
            this.forEachNode(node.childNodes, callback);
        }
    }

    render() {
        return (
            <ExpansionPanel icon="pt-icon-folder-close" text="Workspace" isExpanded={true} defaultHeight={300}>
                <Tree
                    contents={this.state.nodes}
                    onNodeClick={this.handleNodeClick}
                    onNodeCollapse={this.handleNodeCollapse}
                    onNodeExpand={this.handleNodeExpand}
                    className={Classes.ELEVATION_1}
                />
            </ExpansionPanel>
        );
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
