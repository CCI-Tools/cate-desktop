import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {State, WorkspaceState, WorkflowStepState, ResourceState} from "../state";
import {TabPanel, Button, Tabs2, Tab2, NonIdealState} from "@blueprintjs/core";
import * as actions from '../actions'
import * as selectors from '../selectors'
import * as assert from "../../common/assert";
import {ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import ResourceRenameDialog from "./ResourceRenameDialog";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {Table, Cell} from "@blueprintjs/table";
import {Column} from "../../../app/node_modules/@blueprintjs/table/src/column";

interface IWorkspacePanelProps {
    dispatch?: Dispatch<State>;
    workspace: WorkspaceState;
    showResourceDetails: boolean;
    selectedResource: ResourceState|null;
    selectedResourceId: string|null;
    showWorkflowStepDetails: boolean;
    selectedWorkflowStep: WorkflowStepState|null;
    selectedWorkflowStepId: string|null;
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        workspace: selectors.workspaceSelector(state),
        showResourceDetails: selectors.showResourceDetailsSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
        selectedResourceId: selectors.selectedResourceIdSelector(state),
        showWorkflowStepDetails: selectors.showWorkflowStepDetailsSelector(state),
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
        this.handleShowResourceDetailsChanged = this.handleShowResourceDetailsChanged.bind(this);
        this.handleResourceIdSelected = this.handleResourceIdSelected.bind(this);
        this.handleShowWorkflowStepDetailsChanged = this.handleShowWorkflowStepDetailsChanged.bind(this);
        this.handleWorkflowStepIdSelected = this.handleWorkflowStepIdSelected.bind(this);
        this.handleResourceRenameButtonClicked = this.handleResourceRenameButtonClicked.bind(this);
        this.renderStepItem = this.renderStepItem.bind(this);
        this.renderResourceAttrName = this.renderResourceAttrName.bind(this);
        this.renderResourceAttrValue = this.renderResourceAttrValue.bind(this);
    }

    private handleResourceIdSelected(newSelection: Array<React.Key>) {
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

    private handleShowResourceDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlProperty('showResourceDetails', value));
    }

    private handleShowWorkflowStepDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlProperty('showWorkflowStepDetails', value));
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
        return ( <span>{this.getWorkflowStepLabel(step)}</span>);
    }

    render() {
        const workspace = this.props.workspace;
        if (!workspace) {
            return (
                <NonIdealState title="No workspace available"
                               description={<span>Try <strong>File / New</strong> or <strong>File / Open</strong> from the main menu.</span>}
                               visual="folder"/>
            );
        }

        assert.ok(workspace.workflow);
        const steps = workspace.workflow.steps;
        assert.ok(steps);
        const resources = workspace.resources;
        assert.ok(resources);

        //const resourcesTooltip = "Workspace resources that result from workflow steps";
        //const workflowTooltip = "Workflow steps that generate workspace resources";

        return (
            <div style={{width: "100%", height: "100%", overflow: 'auto'}}>
                <span>Path: <code>{workspace.baseDir}</code></span>
                <Tabs2 id="workflow">
                    <Tab2 id="resources" title={`Resources (${resources.length})`} panel={this.renderResourcesPanel()}/>
                    <Tab2 id="steps" title={`Steps (${steps.length})`} panel={this.renderWorkflowStepsPanel()}/>
                </Tabs2>
            </div>
        );
    }

    private renderResourcesPanel() {
        return (
            <ContentWithDetailsPanel showDetails={this.props.showResourceDetails}
                                     onShowDetailsChange={this.handleShowResourceDetailsChanged}
                                     isSplitPanel={true}
                                     initialContentHeight={100}
                                     actionComponent={this.renderResourcesActions()}>
                {this.renderResourcesList()}
                {this.renderResourceDetails()}
            </ContentWithDetailsPanel>
        );
    }

    private renderResourcesList() {
        const resources = this.props.workspace.resources;
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox items={resources}
                         getItemKey={WorkspacePanel.getResourceItemKey}
                         renderItem={WorkspacePanel.renderResourceItem}
                         selection={this.props.selectedResourceId}
                         onSelection={this.handleResourceIdSelected}/>

            </div>
        );
    }

    renderResourceAttrName(row: number) {
        return <Cell>{this.props.selectedResource.attrs[row][0]}</Cell>;
    }

    renderResourceAttrValue(row: number): any {
        return <Cell>{`${this.props.selectedResource.attrs[row][1]}`}</Cell>;
    }

    private renderResourceDetails() {
        if (!this.props.showResourceDetails) {
            return null;
        }

        const selectedResource = this.props.selectedResource;
        if (!selectedResource) {
            return null;
        }

        const attributes = selectedResource.attrs;
        if (!attributes || !attributes.length) {
            return null;
        }

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <span>Attributes:</span>
                <Table numRows={attributes.length}>
                    <Column name="Name" renderCell={this.renderResourceAttrName}/>
                    <Column name="Value" renderCell={this.renderResourceAttrValue}/>
                </Table>
            </div>
        );
    }

    private renderResourcesActions() {
        const selectedResource = this.props.selectedResource;
        return (
            <div className="pt-button-group">
                <Button disabled={!selectedResource} iconName="label"
                        onClick={this.handleResourceRenameButtonClicked}/>
                <ResourceRenameDialog/>
            </div>
        );
    }

    private renderWorkflowStepsPanel() {
        return (
            <ContentWithDetailsPanel showDetails={this.props.showWorkflowStepDetails}
                                     onShowDetailsChange={this.handleShowWorkflowStepDetailsChanged}
                                     isSplitPanel={true}
                                     initialContentHeight={100}
                                     actionComponent={this.renderWorkflowStepActions()}>
                {this.renderWorkflowStepsList()}
                {this.renderWorkflowStepDetails()}
            </ContentWithDetailsPanel>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderWorkflowStepDetails() {
        // TODO (forman): implement me!
        return <div></div>;
    }

    private renderWorkflowStepsList() {
        const workflowSteps = this.props.workspace.workflow.steps;
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox items={workflowSteps}
                         getItemKey={WorkspacePanel.getStepItemKey}
                         renderItem={this.renderStepItem}
                         selection={this.props.selectedWorkflowStepId}
                         onSelection={this.handleWorkflowStepIdSelected}/>
            </div>
        );
    }

    private renderWorkflowStepActions() {
        const selectedWorkflowStep = this.props.selectedWorkflowStep;
        return (
            <div className="pt-button-group">
                <Button disabled={!selectedWorkflowStep} iconName="duplicate"/>
                <Button disabled={!selectedWorkflowStep} iconName="edit"/>
                <Button disabled={!selectedWorkflowStep} iconName="delete"/>
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    private getWorkflowStepLabel(step: WorkflowStepState) {
        if (step["op"]) {
            return step["op"];
        } else {
            return "?";
        }
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
