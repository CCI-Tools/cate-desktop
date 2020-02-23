import * as React from 'react';
import { CSSProperties } from 'react';
import { connect, DispatchProp } from 'react-redux';
import {
    OperationInputState,
    OperationIOBaseState,
    OperationState,
    ResourceState,
    State,
    WorkflowPortState,
    WorkflowStepState,
    WorkspaceState
} from "../state";
import { Icon, Menu, MenuItem, Popover, Position, Tab, Tabs, Tooltip, Intent } from "@blueprintjs/core";
import { Cell, Column, Table, TruncatedFormat, TruncatedPopoverMode } from "@blueprintjs/table";
import { ListBox } from "../components/ListBox";
import { LabelWithType } from "../components/LabelWithType";
import WorkflowStepPropertiesDialog from "./WorkflowStepPropertiesDialog";
import OperationStepDialog from "./OperationStepDialog";
import { ContentWithDetailsPanel } from "../components/ContentWithDetailsPanel";
import * as assert from "../../common/assert";
import * as actions from '../actions'
import * as selectors from '../selectors'
import { ScrollablePanelContent } from "../components/ScrollableContent";
import { NO_WORKFLOW_STEPS, NO_WORKSPACE, NO_WORKSPACE_RESOURCES } from "../messages";
import { findOperation, isDataFrameResource, isFigureResource } from "../state-util";
import { isBoolean, isDefined, isString, isUndefined, isUndefinedOrNull } from "../../common/types";
import { ToolButton } from "../components/ToolButton";
import { EDIT_OPERATION_STEP_DIALOG_ID } from "./operation-step-dialog-ids";

interface IWorkspacePanelProps {
    workspace: WorkspaceState;
    resourcesMap: { [name: string]: ResourceState };
    resourceListHeight: number;
    showResourceDetails: boolean;
    selectedResource: ResourceState | null;
    selectedResourceAttributes: string[][];
    selectedResourceName: string | null;
    selectedResourceWorkflowStep: WorkflowStepState | null;
    workflowStepListHeight: number;
    showWorkflowStepDetails: boolean;
    selectedWorkflowStep: WorkflowStepState | null;
    selectedWorkflowStepId: string | null;
    selectedWorkflowStepOp: OperationState | null;
    selectedWorkflowStepResource: ResourceState | null;
    activeViewId: string | null;
    workspacePanelMode: 'resources' | 'steps';
    operations: OperationState[];
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        workspace: selectors.workspaceSelector(state),
        resourcesMap: selectors.resourceMapSelector(state),
        resourceListHeight: selectors.resourceListHeightSelector(state),
        showResourceDetails: selectors.showResourceDetailsSelector(state),
        selectedResource: selectors.selectedResourceSelector(state),
        selectedResourceAttributes: selectors.selectedResourceAttributesSelector(state),
        selectedResourceName: selectors.selectedResourceNameSelector(state),
        selectedResourceWorkflowStep: selectors.selectedResourceWorkflowStepSelector(state),
        workflowStepListHeight: selectors.workflowStepListHeightSelector(state),
        showWorkflowStepDetails: selectors.showWorkflowStepDetailsSelector(state),
        selectedWorkflowStep: selectors.selectedWorkflowStepSelector(state),
        selectedWorkflowStepId: selectors.selectedWorkflowStepIdSelector(state),
        selectedWorkflowStepOp: selectors.selectedWorkflowStepOpSelector(state),
        selectedWorkflowStepResource: selectors.selectedWorkflowStepResourceSelector(state),
        activeViewId: selectors.activeViewIdSelector(state),
        workspacePanelMode: state.session.workspacePanelMode,
        operations: selectors.operationsSelector(state),
    };
}

/**
 * The WorkspacePanel lets user browse the currently opened workspace.
 * It comprises the workspace files, and the workflow which is subdivided into
 * workspace resources and workspace steps (operations).
 *
 * @author Norman Fomferra
 */
class WorkspacePanel extends React.PureComponent<IWorkspacePanelProps & DispatchProp<State>, any> {

    private static readonly STATE_TAG_STYLE: CSSProperties = {margin: 2};
    private static readonly FLEX_ROW_STYLE: CSSProperties = {display: "flex", alignItems: "center"};
    private static readonly SPACER_STYLE: CSSProperties = {flex: 1};

    constructor(props: IWorkspacePanelProps & DispatchProp<State>) {
        super(props);
        this.handleResourceListHeightChanged = this.handleResourceListHeightChanged.bind(this);
        this.handleShowResourceDetailsChanged = this.handleShowResourceDetailsChanged.bind(this);
        this.handleResourceNameSelected = this.handleResourceNameSelected.bind(this);
        this.handleStepListHeightChanged = this.handleStepListHeightChanged.bind(this);
        this.handleShowWorkflowStepDetailsChanged = this.handleShowWorkflowStepDetailsChanged.bind(this);
        this.handleWorkflowStepIdSelected = this.handleWorkflowStepIdSelected.bind(this);
        this.handleShowFigureButtonClicked = this.handleShowFigureButtonClicked.bind(this);
        this.handleWorkflowStepPropertiesButtonClicked = this.handleWorkflowStepPropertiesButtonClicked.bind(this);
        this.handleOpenWorkspaceDirectoryClicked = this.handleOpenWorkspaceDirectoryClicked.bind(this);
        this.handleEditOperationStepButtonClicked = this.handleEditOperationStepButtonClicked.bind(this);
        this.renderStepItem = this.renderStepItem.bind(this);
        this.renderResourceAttrName = this.renderResourceAttrName.bind(this);
        this.renderResourceAttrValue = this.renderResourceAttrValue.bind(this);
        this.renderOperationStepInputName = this.renderOperationStepInputName.bind(this);
        this.renderOperationStepInputValue = this.renderOperationStepInputValue.bind(this);
        this.renderOperationStepOutputName = this.renderOperationStepOutputName.bind(this);
        this.renderOperationStepOutputValue = this.renderOperationStepOutputValue.bind(this);
        this.handleWorkspacePanelModeChanged = this.handleWorkspacePanelModeChanged.bind(this);
        this.handleRemoveOperationStepButtonClicked = this.handleRemoveOperationStepButtonClicked.bind(this);
        this.handleCleanWorkflowButtonClicked = this.handleCleanWorkflowButtonClicked.bind(this);
        this.handleShowResourceTableView = this.handleShowResourceTableView.bind(this);
        this.handleCopyWorkflowAsPythonScript = this.handleCopyWorkflowAsPythonScript.bind(this);
        this.handleCopyWorkflowAsShellScript = this.handleCopyWorkflowAsShellScript.bind(this);
        this.handleCopyWorkflowAsJSON = this.handleCopyWorkflowAsJSON.bind(this);
    }

    private handleResourceNameSelected(newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkspaceResourceName(newSelection[0] as string) as any);
        } else {
            this.props.dispatch(actions.setSelectedWorkspaceResourceName(null) as any);
        }
    }

    private handleWorkflowStepIdSelected(newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkflowStepId(newSelection[0] as string) as any);
        } else {
            this.props.dispatch(actions.setSelectedWorkflowStepId(null) as any);
        }
    }

    private handleResourceListHeightChanged(value: number) {
        this.props.dispatch(actions.setSessionProperty('resourceListHeight', value));
    }

    private handleShowResourceDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setSessionProperty('showResourceDetails', value));
    }

    private handleStepListHeightChanged(value: number) {
        this.props.dispatch(actions.setSessionProperty('workflowStepListHeight', value));
    }

    private handleShowWorkflowStepDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setSessionProperty('showWorkflowStepDetails', value));
    }

    private handleShowFigureButtonClicked() {
        this.props.dispatch(actions.showFigureView(this.getEffectiveResource(), this.props.activeViewId));
    }

    private handleShowResourceTableView() {
        this.props.dispatch(actions.showTableView(this.getEffectiveResource().name, null, this.props.activeViewId));
    }

    private handleWorkflowStepPropertiesButtonClicked() {
        this.props.dispatch(actions.showDialog('workflowStepPropertiesDialog'));
    }

    private handleOpenWorkspaceDirectoryClicked() {
        actions.openItem(this.props.workspace.baseDir);
    }

    private handleCopyWorkflowAsPythonScript() {
        const text = convertSteps(this.props.operations, this.props.workspace.workflow.steps, 'python');
        actions.copyTextToClipboard(text);
    }

    private handleCopyWorkflowAsShellScript() {
        const text = convertSteps(this.props.operations, this.props.workspace.workflow.steps, 'shell');
        actions.copyTextToClipboard(text);
    }

    private handleCopyWorkflowAsJSON() {
        actions.copyTextToClipboard(JSON.stringify(this.props.workspace.workflow, null, 4));
    }

    private handleEditOperationStepButtonClicked() {
        this.props.dispatch(actions.showOperationStepDialog('editOperationStepDialog'));
    }

    private handleRemoveOperationStepButtonClicked() {
        const resName = this.getEffectiveResourceName();
        if (resName) {
            this.props.dispatch(actions.deleteResourceInteractive(resName) as any);
        }
    }

    private handleCleanWorkflowButtonClicked() {
        this.props.dispatch(actions.cleanWorkspaceInteractive() as any);
    }

    private handleWorkspacePanelModeChanged(workspacePanelMode: string) {
        this.props.dispatch(actions.updateSessionState({workspacePanelMode}) as any);
    }

    private getEffectiveWorkflowStep() {
        return this.props.workspacePanelMode === 'steps'
               ? this.props.selectedWorkflowStep : this.props.selectedResourceWorkflowStep;
    }

    private getEffectiveResource() {
        return this.props.workspacePanelMode === 'resources'
               ? this.props.selectedResource : this.props.selectedWorkflowStepResource;
    }

    private getEffectiveResourceName() {
        let resource = this.getEffectiveResource();
        let workflowStep = this.getEffectiveWorkflowStep();
        return resource ? resource.name : workflowStep ? workflowStep.id : null;
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
                              : workspace.baseDir.split(/[\\/]/).pop();
        const workspaceLabel = (
            <Tooltip content={workspace.baseDir} position={Position.RIGHT}>
                <strong>{workspaceName}</strong>
            </Tooltip>
        );
        let workspaceState = null;
        if (workspace.isModified) {
            workspaceState = (
                <span key={0} style={WorkspacePanel.STATE_TAG_STYLE}
                      className="bp3-tag bp3-intent-warning bp3-minimal">Modified</span>
            );
        } else if (!workspace.isSaved) {
            workspaceState = (
                <span key={1} style={WorkspacePanel.STATE_TAG_STYLE}
                      className="bp3-tag bp3-intent-success bp3-minimal">Not saved</span>
            );
        }
        const openItemButton = (
            <ToolButton tooltipContent="Show workspace directory in file system"
                        tooltipPosition={Position.LEFT}
                        onClick={this.handleOpenWorkspaceDirectoryClicked}
                        icon="folder-open"
            />
        );
        const copyItemButton = (
            <Popover position={Position.LEFT}>
                <ToolButton disabled={!steps.length}
                            icon="clipboard"/>
                <Menu>
                    <MenuItem onClick={this.handleCopyWorkflowAsPythonScript} text="Copy workflow as Python Script"/>
                    <MenuItem onClick={this.handleCopyWorkflowAsShellScript} text="Copy workflow as Shell Script"/>
                    <MenuItem onClick={this.handleCopyWorkflowAsJSON} text="Copy workflow as JSON"/>
                </Menu>
            </Popover>
        );

        //const resourcesTooltip = "Workspace resources that result from workflow steps";
        //const workflowTooltip = "Workflow steps that generate workspace resources";
        return (
            <ScrollablePanelContent>
                <div style={WorkspacePanel.FLEX_ROW_STYLE}>
                    {workspaceLabel}
                    <span style={WorkspacePanel.SPACER_STYLE}/>
                    {workspaceState}
                    <div className="pt-button-group">
                        {openItemButton}
                        {copyItemButton}
                    </div>
                </div>
                <Tabs id="workflow"
                      renderActiveTabPanelOnly={true}
                      selectedTabId={this.props.workspacePanelMode}
                      onChange={this.handleWorkspacePanelModeChanged}>
                    <Tab id="steps" title={`Workflow (${steps.length})`} panel={this.renderWorkflowStepsPanel()}/>
                    <Tab id="resources" title={`Resources (${resources.length})`} panel={this.renderResourcesPanel()}/>
                </Tabs>
            </ScrollablePanelContent>
        );
    }

    private renderWorkspaceActions() {
        const resource = this.getEffectiveResource();
        const workflowStep = this.getEffectiveWorkflowStep();
        const canShowFigure = isFigureResource(resource);
        const isOperationStepSelected = workflowStep && workflowStep.op;
        const hasSteps = this.props.workspace && this.props.workspace.workflow.steps.length;
        const canShowTableView = isDataFrameResource(resource);
        return (
            <div className="pt-button-group">
                <ToolButton tooltipContent="Show figure"
                            tooltipPosition={Position.LEFT}
                            disabled={!canShowFigure}
                            icon="eye-open"
                            onClick={this.handleShowFigureButtonClicked}/>
                <ToolButton tooltipContent="Show data in table"
                            tooltipPosition={Position.LEFT}
                            disabled={!canShowTableView}
                            icon="th"
                            onClick={this.handleShowResourceTableView}
                />
                <ToolButton tooltipContent="Resource/step properties"
                            tooltipPosition={Position.LEFT}
                            disabled={!resource}
                            icon="label"
                            onClick={this.handleWorkflowStepPropertiesButtonClicked}/>
                <ToolButton tooltipContent="Edit workflow step"
                            tooltipPosition={Position.LEFT}
                            intent={Intent.PRIMARY}
                            disabled={!workflowStep}
                            icon="edit"
                            onClick={this.handleEditOperationStepButtonClicked}/>
                <ToolButton tooltipContent="Remove workflow step and its resource"
                            tooltipPosition={Position.LEFT}
                            disabled={!workflowStep}
                            icon="remove"
                            onClick={this.handleRemoveOperationStepButtonClicked}/>
                <ToolButton tooltipContent="Clean workspace, remove all steps and resources"
                            tooltipPosition={Position.LEFT}
                            disabled={!hasSteps}
                            icon="delete"
                            onClick={this.handleCleanWorkflowButtonClicked}/>
                {workflowStep ? <WorkflowStepPropertiesDialog selectedWorkflowStep={workflowStep}/> : null}
                {isOperationStepSelected
                 ? <OperationStepDialog id={EDIT_OPERATION_STEP_DIALOG_ID} operationStep={workflowStep}/>
                 : null}
            </div>
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
                                     contentHeight={this.props.resourceListHeight}
                                     onContentHeightChange={this.handleResourceListHeightChanged}
                                     actionComponent={this.renderWorkspaceActions()}>
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
                         onSelection={this.handleResourceNameSelected}
                         onItemDoubleClick={this.handleEditOperationStepButtonClicked}/>
            </ScrollablePanelContent>
        );
    }

    private renderResourceDetails() {
        const selectedResourceAttributes = this.props.selectedResourceAttributes;
        if (!selectedResourceAttributes || !selectedResourceAttributes.length) {
            return null;
        }

        return (
            <ScrollablePanelContent>
                <span>Attributes:</span>
                <Table numRows={selectedResourceAttributes.length} enableRowHeader={false}>
                    <Column name="Name" cellRenderer={this.renderResourceAttrName}/>
                    <Column name="Value" cellRenderer={this.renderResourceAttrValue}/>
                </Table>
            </ScrollablePanelContent>
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
                                     contentHeight={this.props.workflowStepListHeight}
                                     onContentHeightChange={this.handleStepListHeightChanged}
                                     actionComponent={this.renderWorkspaceActions()}>
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
                         onSelection={this.handleWorkflowStepIdSelected}
                         onItemDoubleClick={this.handleEditOperationStepButtonClicked}/>
            </ScrollablePanelContent>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderWorkflowStepDetails() {

        const selectedWorkflowStepOp = this.props.selectedWorkflowStepOp;
        if (!selectedWorkflowStepOp) {
            return null;
        }

        let stepInputPanel = WorkspacePanel.renderWorkflowStepPorts(
            selectedWorkflowStepOp.inputs,
            "Step inputs:", "No step inputs.",
            this.renderOperationStepInputName,
            this.renderOperationStepInputValue
        );

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
                    <Table numRows={ports.length} enableRowHeader={false}>
                        <Column name="Name" cellRenderer={renderName}/>
                        <Column name="Value" cellRenderer={renderValue}/>
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
        return <Cell><TruncatedFormat>{this.props.selectedResourceAttributes[row][0]}</TruncatedFormat></Cell>
    }

    renderResourceAttrValue(row: number): any {
        return (
            <Cell>
                <TruncatedFormat
                    showPopover={TruncatedPopoverMode.WHEN_TRUNCATED}
                    detectTruncation={true}
                >
                    {`${this.props.selectedResourceAttributes[row][1]}`}
                </TruncatedFormat>
            </Cell>
        );
    }

    renderOperationStepInputName(row: number) {
        const inputProps = this.props.selectedWorkflowStepOp.inputs[row];
        const inputPort = this.props.selectedWorkflowStep.inputs[inputProps.name];
        return WorkspacePanel.renderWorkflowPortName(inputProps, inputPort);
    }

    renderOperationStepInputValue(row: number): any {
        const inputProps = this.props.selectedWorkflowStepOp.inputs[row];
        const inputPort = this.props.selectedWorkflowStep.inputs[inputProps.name];
        return WorkspacePanel.renderWorkflowPortValue(inputProps, inputPort);
    }

    renderOperationStepOutputName(row: number) {
        const outputProps = this.props.selectedWorkflowStepOp.outputs[row];
        const outputPort = this.props.selectedWorkflowStep.outputs[outputProps.name];
        return WorkspacePanel.renderWorkflowPortName(outputProps, outputPort);
    }

    renderOperationStepOutputValue(row: number): any {
        const outputProps = this.props.selectedWorkflowStepOp.outputs[row];
        const outputPort = this.props.selectedWorkflowStep.outputs[outputProps.name];
        return WorkspacePanel.renderWorkflowPortValue(outputProps, outputPort);
    }

    //noinspection JSUnusedLocalSymbols
    static renderWorkflowPortName(portProps: OperationIOBaseState, port: WorkflowPortState) {
        return (
            <Cell><TruncatedFormat showPopover={TruncatedPopoverMode.ALWAYS}>{portProps.name}</TruncatedFormat></Cell>);
    }

    static renderWorkflowPortValue(portProps: OperationIOBaseState, port: WorkflowPortState) {
        let cellValue;
        if (port) {
            let units;
            if (portProps.units) {
                units = (<span className="pt-text-muted">{` (${portProps.units})`}</span>);
            }
            const source = isString(port) ? port : port.source;
            if (source) {
                cellValue = (<span>&#8599; <em>{source}</em></span>);
            } else {
                let value = port.value;
                const maxTextLen = 128;
                if (isString(value) && value.length > maxTextLen) {
                    // Note we do this for performance reasons. BlueprintJS renders very slowly
                    // e.g. for large Geometry WKT values.
                    value = value.substr(0, maxTextLen) + '...';
                }
                cellValue = (<span>{value}{units}</span>);
            }
        } else {
            let defaultValue = (portProps as OperationInputState).defaultValue;
            if (isDefined(defaultValue)) {
                cellValue = (<span>{`${defaultValue}`} <span className="pt-text-muted">(default value)</span></span>);
            } else {
                cellValue = (<span className="pt-text-muted">Not given.</span>);
            }
        }
        return (<Cell>{cellValue}</Cell>);
    }

    //noinspection JSMethodCanBeStatic
    private getWorkflowStepLabel(step: WorkflowStepState) {

        const items = [];

        if (step && step.op) {
            let opName = step.op;
            const index = opName.lastIndexOf('.');
            if (index > 0) {
                opName = opName.slice(index + 1);
            }
            items.push(<code key={0}>{opName}()</code>);
        } else {
            items.push(<code key={0}>?()</code>);
        }

        const resource = this.props.resourcesMap[step.id];
        if (resource) {
            items.push(<span key={1}> &rarr; </span>);
            items.push(<LabelWithType key={2} label={resource.name}
                                      dataType={resource.dataType}/>);
        }

        if (step && step.persistent) {
            items.push(<span key={3}> </span>);
            items.push(<Icon key={4} icon="database"/>);
        }

        return <span>{items}</span>;
    }
}

export default connect(mapStateToProps)(WorkspacePanel);


function convertSteps(operations: OperationState[], steps: WorkflowStepState[], target: 'python' | 'shell'): string {
    // TODO (forman): move this to backend, as this is best done in Python
    let lines = [];
    if (target === 'python') {
        lines.push('import cate.ops');
    } else {
        lines.push('cate ws new');
    }
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const op = findOperation(operations, step.op);
        if (op && op.inputs) {
            if (target === 'python') {
                lines.push('');
                lines.push(`# Step ${i + 1}`);
            }
            const args = [];
            for (let input of op.inputs) {
                const inputPort = step.inputs[input.name];
                if (!inputPort) {
                    // No value provided, which should be ok (default value applies)
                    continue;
                }
                const source = isString(inputPort) ? inputPort : inputPort.source;
                if (inputPort && source) {
                    if (target === 'python') {
                        args.push(`${input.name}=${source}`);
                    } else {
                        args.push(`${input.name}=@${source}`);
                    }
                } else if (inputPort) {
                    let value = inputPort.value;
                    if (isUndefined(value)) {
                        value = null;
                    }
                    let defaultValue = input.defaultValue;
                    if (isUndefined(defaultValue)) {
                        defaultValue = null;
                    }
                    if (value !== defaultValue) {
                        if (isUndefinedOrNull(value)) {
                            args.push(`${input.name}=None`);
                        } else if (isString(value)) {
                            args.push(`${input.name}="${value}"`);
                        } else if (isBoolean(value)) {
                            args.push(`${input.name}=${value ? 'True' : 'False'}`);
                        } else if (isBoolean(value)) {
                            args.push(`${input.name}=${value}`);
                        }
                    }
                }
            }
            let resName = step.id;
            const opName = op.name;
            if (target === 'python') {
                lines.push(`${resName} = cate.ops.${opName}(${args.join(', ')})`);
            } else {
                lines.push(`cate res set ${resName} ${opName} ${args.join(' ')}`);
            }
        }
    }
    if (target === 'shell') {
        lines.push('cate ws exit');
    }
    lines.push('');
    return lines.join('\n');
}
