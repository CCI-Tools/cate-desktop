import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {
    State, WorkspaceState, WorkflowStepState, ResourceState, WorkflowPortState, OperationState,
    OperationIOBaseState
} from "../state";
import {AnchorButton, Button, Tabs2, Tab2, Tooltip, Position} from "@blueprintjs/core";
import {Table, Column, Cell} from "@blueprintjs/table";
import {ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import ResourceRenameDialog from "./ResourceRenameDialog";
import OperationStepDialog from "./OperationStepDialog";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import * as assert from "../../common/assert";
import * as actions from '../actions'
import * as selectors from '../selectors'
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {NO_WORKSPACE, NO_WORKSPACE_RESOURCES, NO_WORKFLOW_STEPS} from "../messages";
import {isFigureResource} from "../state-util";
import {ViewState} from "../components/ViewState";

interface IWorkspacePanelProps {
    dispatch?: Dispatch<State>;
    workspace: WorkspaceState;
    showResourceDetails: boolean;
    selectedResource: ResourceState | null;
    selectedResourceName: string | null;
    showWorkflowStepDetails: boolean;
    selectedWorkflowStep: WorkflowStepState | null;
    selectedWorkflowStepId: string | null;
    selectedWorkflowStepOp: OperationState | null;
    activeViewId: string | null;
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        workspace: selectors.workspaceSelector(state),
        showResourceDetails: selectors.showResourceDetailsSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
        selectedResourceName: selectors.selectedResourceNameSelector(state),
        showWorkflowStepDetails: selectors.showWorkflowStepDetailsSelector(state),
        selectedWorkflowStep: selectors.selectedWorkflowStepSelector(state),
        selectedWorkflowStepId: selectors.selectedWorkflowStepIdSelector(state),
        selectedWorkflowStepOp: selectors.selectedWorkflowStepOpSelector(state),
        activeViewId: selectors.activeViewIdSelector(state),
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

    private static readonly STATE_TAG_STYLE = {margin: 2};
    private static readonly FLEX_ROW_STYLE = {display: "flex", alignItems: "center"};
    private static readonly SPACER_STYLE = {flex: 1};

    constructor(props, context) {
        super(props, context);
        this.handleShowResourceDetailsChanged = this.handleShowResourceDetailsChanged.bind(this);
        this.handleResourceNameSelected = this.handleResourceNameSelected.bind(this);
        this.handleShowWorkflowStepDetailsChanged = this.handleShowWorkflowStepDetailsChanged.bind(this);
        this.handleWorkflowStepIdSelected = this.handleWorkflowStepIdSelected.bind(this);
        this.handleShowFigureButtonClicked = this.handleShowFigureButtonClicked.bind(this);
        this.handleResourceRenameButtonClicked = this.handleResourceRenameButtonClicked.bind(this);
        this.handleOpenWorkspaceDirectoryClicked = this.handleOpenWorkspaceDirectoryClicked.bind(this);
        this.handleEditOperationStepButtonClicked = this.handleEditOperationStepButtonClicked.bind(this);
        this.renderStepItem = this.renderStepItem.bind(this);
        this.renderResourceAttrName = this.renderResourceAttrName.bind(this);
        this.renderResourceAttrValue = this.renderResourceAttrValue.bind(this);
        this.renderOperationStepInputName = this.renderOperationStepInputName.bind(this);
        this.renderOperationStepInputValue = this.renderOperationStepInputValue.bind(this);
        this.renderOperationStepOutputName = this.renderOperationStepOutputName.bind(this);
        this.renderOperationStepOutputValue = this.renderOperationStepOutputValue.bind(this);
    }

    private handleResourceNameSelected(newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkspaceResourceName(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedWorkspaceResourceName(null));
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

    private handleShowFigureButtonClicked() {
        this.props.dispatch(actions.showFigureView(this.props.selectedResource, this.props.activeViewId));
    }

    private handleResourceRenameButtonClicked() {
        this.props.dispatch(actions.showDialog('resourceRenameDialog'));
    }

    private handleOpenWorkspaceDirectoryClicked() {
        actions.openItem(this.props.workspace.baseDir);
    }

    private handleEditOperationStepButtonClicked() {
        this.props.dispatch(actions.showOperationStepDialog('editOperationStepDialog'));
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
        return (<span>{this.getWorkflowStepLabel(step)}</span>);
    }

    render() {
        const workspace = this.props.workspace;
        if (!workspace) {
            return NO_WORKSPACE;
        }

        assert.ok(workspace.workflow);
        const steps = workspace.workflow.steps;
        assert.ok(steps);
        const resources = workspace.resources;
        assert.ok(resources);

        const workspaceName = (workspace.isScratch || !workspace.baseDir)
            ? '<unnamed>'
            : workspace.baseDir.split(/[\\\/]/).pop();
        const workspaceLabel = (
            <Tooltip content={workspace.baseDir} position={Position.RIGHT}>
                <strong>{workspaceName}</strong>
            </Tooltip>
        );
        let workspaceState = null;
        if (workspace.isModified) {
            workspaceState = <span key={0} style={WorkspacePanel.STATE_TAG_STYLE} className="pt-tag pt-intent-warning pt-minimal">Modified</span>;
        } else if (!workspace.isSaved) {
            workspaceState = <span key={1} style={WorkspacePanel.STATE_TAG_STYLE} className="pt-tag pt-intent-success pt-minimal">Not saved</span>;
        }
        const openItemButton = (
            <Tooltip content="Open workspace directory">
                <Button onClick={this.handleOpenWorkspaceDirectoryClicked} iconName="folder-open"/>
            </Tooltip>
        );

        //const resourcesTooltip = "Workspace resources that result from workflow steps";
        //const workflowTooltip = "Workflow steps that generate workspace resources";
        return (
            <ScrollablePanelContent>
                <div style={WorkspacePanel.FLEX_ROW_STYLE}>
                    {workspaceLabel}
                    <span style={WorkspacePanel.SPACER_STYLE}/>
                    {workspaceState}
                    {openItemButton}
                </div>
                <Tabs2 id="workflow" renderActiveTabPanelOnly={true}>
                    <Tab2 id="resources" title={`Resources (${resources.length})`} panel={this.renderResourcesPanel()}/>
                    <Tab2 id="steps" title={`Steps (${steps.length})`} panel={this.renderWorkflowStepsPanel()}/>
                </Tabs2>
            </ScrollablePanelContent>
        );
    }

    private renderResourcesPanel() {
        const resources = this.props.workspace.resources;
        if (!resources || !resources.length) {
            return NO_WORKSPACE_RESOURCES;
        }
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
            <ScrollablePanelContent>
                <ListBox items={resources}
                         getItemKey={WorkspacePanel.getResourceItemKey}
                         renderItem={WorkspacePanel.renderResourceItem}
                         selection={this.props.selectedResourceName}
                         onSelection={this.handleResourceNameSelected}/>
            </ScrollablePanelContent>
        );
    }

    private renderResourceDetails() {
        const selectedResource = this.props.selectedResource;
        if (!selectedResource) {
            return null;
        }

        const attributes = selectedResource.attrs;
        if (!attributes || !attributes.length) {
            return null;
        }

        return (
            <ScrollablePanelContent>
                <span>Attributes:</span>
                <Table numRows={attributes.length} isRowHeaderShown={false}>
                    <Column name="Name" renderCell={this.renderResourceAttrName}/>
                    <Column name="Value" renderCell={this.renderResourceAttrValue}/>
                </Table>
            </ScrollablePanelContent>
        );
    }

    private renderResourcesActions() {
        const isResourceSelected = this.props.selectedResource;
        const isFigureSelected = isFigureResource(this.props.selectedResource);
        return (
            <div className="pt-button-group">
                <Tooltip content="Show figure">
                    <AnchorButton
                        disabled={!isFigureSelected}
                        iconName="eye-open"
                        onClick={this.handleShowFigureButtonClicked}/>
                </Tooltip>
                <Tooltip content="Rename resource">
                    <AnchorButton
                        disabled={!isResourceSelected}
                        iconName="label"
                        onClick={this.handleResourceRenameButtonClicked}/>
                </Tooltip>
                <ResourceRenameDialog/>
            </div>
        );
    }

    private renderWorkflowStepsPanel() {
        const workflowSteps = this.props.workspace.workflow.steps;
        if (!workflowSteps || !workflowSteps.length) {
            return NO_WORKFLOW_STEPS;
        }
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

    private renderWorkflowStepsList() {
        const workflowSteps = this.props.workspace.workflow.steps;
        return (
            <ScrollablePanelContent>
                <ListBox items={workflowSteps}
                         getItemKey={WorkspacePanel.getStepItemKey}
                         renderItem={this.renderStepItem}
                         selection={this.props.selectedWorkflowStepId}
                         onSelection={this.handleWorkflowStepIdSelected}/>
            </ScrollablePanelContent>
        );
    }

    private renderWorkflowStepActions() {
        const workflowStep = this.props.selectedWorkflowStep;
        const isStepSelected = !!workflowStep;
        const isOperationStepSelected = workflowStep && workflowStep.op;
        const NOT_IMPLEMENTED_YET = true;
        return (
            <div className="pt-button-group">
                <Tooltip content="Copy step">
                    <AnchorButton
                        disabled={NOT_IMPLEMENTED_YET || !isOperationStepSelected}
                        iconName="duplicate"/>
                </Tooltip>
                <Tooltip content="Edit workflow step">
                    <AnchorButton
                        disabled={!isOperationStepSelected}
                        iconName="edit"
                        onClick={this.handleEditOperationStepButtonClicked}/>
                </Tooltip>
                <Tooltip content="Remove workflow step from workspace">
                    <AnchorButton
                        disabled={NOT_IMPLEMENTED_YET || !isStepSelected}
                        iconName="delete"/>
                </Tooltip>

                {isOperationStepSelected ?
                    <OperationStepDialog id="editOperationStepDialog" operationStep={workflowStep}/> : null}
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderWorkflowStepDetails() {

        const selectedWorkflowStepOp = this.props.selectedWorkflowStepOp;
        if (!selectedWorkflowStepOp) {
            return null;
        }

        let stepInputPanel = WorkspacePanel.renderWorkflowStepPorts(selectedWorkflowStepOp.inputs,
            "Step inputs:", "No step inputs.",
            this.renderOperationStepInputName,
            this.renderOperationStepInputValue);

        let stepOutputPanel = null;
        // let stepOutputPanel = WorkspacePanel.renderWorkflowStepPorts(selectedWorkflowStepOp.outputs,
        //     "Step outputs:", "No step outputs.",
        //     this.renderOperationStepOutputName,
        //     this.renderOperationStepOutputValue);

        return (
            <ScrollablePanelContent>
                {stepInputPanel}
                {stepOutputPanel}
            </ScrollablePanelContent>
        );
    }

    static renderWorkflowStepPorts(ports: OperationIOBaseState[], itemsTitle: string, noItemsTitle: string, renderName, renderValue) {
        if (ports && ports.length) {
            return (
                <div>
                    <p>{itemsTitle}</p>
                    <Table numRows={ports.length} isRowHeaderShown={false}>
                        <Column name="Name" renderCell={renderName}/>
                        <Column name="Value" renderCell={renderValue}/>
                    </Table>
                </div>
            );
        } else {
            return (
                <div>
                    <p>{noItemsTitle}</p>
                </div>
            );
        }
    }

    renderResourceAttrName(row: number) {
        return <Cell>{this.props.selectedResource.attrs[row][0]}</Cell>;
    }

    renderResourceAttrValue(row: number): any {
        return <Cell>{`${this.props.selectedResource.attrs[row][1]}`}</Cell>;
    }

    renderOperationStepInputName(row: number) {
        return WorkspacePanel.renderWorkflowPortName(this.props.selectedWorkflowStepOp.inputs[row]);
    }

    renderOperationStepInputValue(row: number): any {
        const name = this.props.selectedWorkflowStepOp.inputs[row].name;
        return WorkspacePanel.renderWorkflowPortValue(this.props.selectedWorkflowStep.input[name]);
    }

    renderOperationStepOutputName(row: number) {
        return WorkspacePanel.renderWorkflowPortName(this.props.selectedWorkflowStepOp.outputs[row]);
    }

    renderOperationStepOutputValue(row: number): any {
        const name = this.props.selectedWorkflowStepOp.outputs[row].name;
        return WorkspacePanel.renderWorkflowPortValue(this.props.selectedWorkflowStep.output[name]);
    }

    static renderWorkflowPortName(port: OperationIOBaseState) {
        return <Cell>{port.name}</Cell>;
    }

    static renderWorkflowPortValue(port: WorkflowPortState) {
        let cellValue;
        if (port.source) {
            cellValue = <span>&#8599; <em>{port.source}</em></span>;
        } else {
            cellValue = <span>{`${port.value}`}</span>;
        }
        return <Cell>{cellValue}</Cell>;
    }

    //noinspection JSMethodCanBeStatic
    private getWorkflowStepLabel(step: WorkflowStepState) {
        if (step.op) {
            return <span>{step.op} &rarr; {step.id}</span>;
        } else {
            return <span>? &rarr; {step.id}</span>;
        }
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
