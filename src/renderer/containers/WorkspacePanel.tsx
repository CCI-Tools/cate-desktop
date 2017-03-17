import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {State, WorkspaceState, WorkflowStepState, ResourceState} from "../state";
import {Tooltip, Tab, Tabs, TabList, TabPanel, Button} from "@blueprintjs/core";
import {ExpansionPanel} from "../components/ExpansionPanel";
import * as actions from '../actions'
import * as selectors from '../selectors'
import * as assert from "../../common/assert";
import {ListBox} from "../components/ListBox";
import {Card} from "../components/Card";
import {LabelWithType} from "../components/LabelWithType";
import ResourceRenameDialog from "./ResourceRenameDialog";

interface IWorkspacePanelProps {
    dispatch?: Dispatch<State>;
    workspace: WorkspaceState;
    selectedResource: ResourceState|null;
    selectedResourceId: string|null;
    selectedWorkflowStep: WorkflowStepState|null;
    selectedWorkflowStepId: string|null;
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        workspace: selectors.workspaceSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
        selectedResourceId: selectors.selectedResourceIdSelector(state),
        selectedWorkflowStep: selectors.selectedWorkflowStepSelector(state),
        selectedWorkflowStepId: selectors.selectedWorkflowStepIdSelector(state),
    };
}

/**
 * The WorkspacePanel lets user browse the currently opened workspace.
 * It comprises the workspace files, and the workflow which is subdivided into
 * workspace resources and workspace steps (operations).
 *
 * @author Norman Fomferra
 */
class WorkspacePanel extends React.PureComponent<IWorkspacePanelProps, any> {

    constructor(props, context) {
        super(props, context);
        this.handleWorkspaceResourceIdSelected = this.handleWorkspaceResourceIdSelected.bind(this);
        this.handleWorkflowStepIdSelected = this.handleWorkflowStepIdSelected.bind(this);
        this.handleResourceRenameButtonClicked = this.handleResourceRenameButtonClicked.bind(this);
        this.renderStepItem = this.renderStepItem.bind(this);
    }

    private handleWorkspaceResourceIdSelected(newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkspaceResourceId(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedWorkspaceResourceId(null));
        }
    }

    private handleWorkflowStepIdSelected(newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkflowStepId(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedWorkflowStepId(null));
        }
    }

    private handleResourceRenameButtonClicked() {
        this.props.dispatch(actions.showDialog('resourceRenameDialog'));
    }

    private static getResourceItemKey(resource: ResourceState) {
        return resource.name;
    }

    private static renderResourceItem(resource: ResourceState) {
        return (<LabelWithType label={resource.name}
                               dataType={resource.dataType}/>);
    }

    private static getStepItemKey(step: WorkflowStepState) {
        return step.id;
    }

    private renderStepItem(step: WorkflowStepState) {
        return ( <span>{this.getStepLabel(step)}</span>);
    }

    render() {
        const workspace = this.props.workspace;

        let workspaceInfo; // For debug only
        let workspacePane;
        if (workspace) {
            assert.ok(workspace.workflow);
            const steps = workspace.workflow.steps;
            assert.ok(steps);
            const resources = workspace.resources;
            assert.ok(resources);

            const resourcesTooltip = "Workspace resources that result from workflow steps";
            const workflowTooltip = "Workflow steps that generate workspace resources";

            // const resourcesMoreMenu = <span className="pt-icon-standard pt-icon-edit"/>;
            // const operationsMoreMenu = <span className="pt-icon-standard pt-icon-more"/>;

            workspaceInfo = <span>Path: {workspace.baseDir}</span>;
            workspacePane = (
                <Tabs>
                    <TabList>
                        <Tab>
                            <span className="pt-icon-database" style={{marginRight: 4}}/>
                            <Tooltip content={resourcesTooltip}>
                                <span>{`Resources (${resources.length})`}</span>
                            </Tooltip>
                        </Tab>
                        <Tab>
                            <span className="pt-icon-flows" style={{marginRight: 4}}/>
                            <Tooltip content={workflowTooltip}>
                                <span>{`Steps (${steps.length})`}</span>
                            </Tooltip>
                        </Tab>
                    </TabList>
                    {this.renderResourcesPanel()}
                    {this.renderStepsPanel()}
                </Tabs>
            );
        } else {
            workspaceInfo = null;
            workspacePane = (
                <Card>
                    <p>No workspace available.</p>
                </Card>
            );
        }

        // return (
        //     <ExpansionPanel icon="pt-icon-folder-close" text="Workspace" isExpanded={true} defaultHeight={300}>
        //         {workspaceInfo}
        //         {workspacePane}
        //     </ExpansionPanel>
        // );
        return (
            <div style={{width: "100%", height: "100%", overflow: 'auto'}}>
                {workspaceInfo}
                {workspacePane}
            </div>
        );
    }

    private renderResourcesPanel() {
        const resources = this.props.workspace.resources;
        const selectedResource = this.props.selectedResource;
        return (
            <TabPanel>
                <ListBox items={resources}
                         getItemKey={WorkspacePanel.getResourceItemKey}
                         renderItem={WorkspacePanel.renderResourceItem}
                         selection={this.props.selectedResourceId}
                         onSelection={this.handleWorkspaceResourceIdSelected}/>
                <div style={{display: 'flex'}}><span style={{flex: 'auto'}}/>
                    <Button disabled={!selectedResource} iconName="label" onClick={this.handleResourceRenameButtonClicked}/>
                </div>
                <ResourceRenameDialog/>
            </TabPanel>
        );
    }

    private renderStepsPanel() {
        const workflowSteps = this.props.workspace.workflow.steps;
        const selectedWorkflowStep = this.props.selectedWorkflowStep;
        return (
            <TabPanel>
                <ListBox items={workflowSteps}
                         getItemKey={WorkspacePanel.getStepItemKey}
                         renderItem={this.renderStepItem}
                         selection={this.props.selectedWorkflowStepId}
                         onSelection={this.handleWorkflowStepIdSelected}/>
                <div style={{display: 'flex'}}><span style={{flex: 'auto'}}/>
                    <Button disabled={!selectedWorkflowStep} style={{marginRight: '0.2em'}} iconName="duplicate"/>
                    <Button disabled={!selectedWorkflowStep} style={{marginRight: '0.2em'}} iconName="edit"/>
                    <Button disabled={!selectedWorkflowStep} iconName="delete"/>
                </div>
            </TabPanel>
        );
    }

    //noinspection JSMethodCanBeStatic
    private getStepLabel(step: WorkflowStepState) {
        if (step["op"]) {
            return step["op"];
        } else {
            return "?";
        }
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
