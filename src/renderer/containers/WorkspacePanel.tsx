import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {State, WorkspaceState} from "../state";
import {Tooltip, Tab, Tabs, TabList, TabPanel, Button} from "@blueprintjs/core";
import {ExpansionPanel} from "../components/ExpansionPanel";
import * as actions from '../actions'
import {ListBox} from "../components/ListBox";
import {Card} from "../components/Card";
import * as assert from "assert";

interface IWorkspacePanelProps {
    dispatch?: Dispatch<State>;
    webAPIClient: any;
    workspace: WorkspaceState;
    selectedWorkspaceResourceId: string|null;
    selectedWorkflowStepId: string|null;
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        workspace: state.data.workspace,
        selectedWorkspaceResourceId: state.control.selectedWorkspaceResourceId,
        selectedWorkflowStepId: state.control.selectedWorkflowStepId,
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

    //noinspection JSUnusedLocalSymbols
    private handleWorkspaceResourceIdSelected(oldSelection: Array<React.Key>, newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkspaceResourceId(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedWorkspaceResourceId(null));
        }
    }

    //noinspection JSUnusedLocalSymbols
    private handleWorkflowStepIdSelected(oldSelection: Array<React.Key>, newSelection: Array<React.Key>) {
        if (newSelection && newSelection.length) {
            this.props.dispatch(actions.setSelectedWorkflowStepId(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedWorkflowStepId(null));
        }
    }

    render() {
        const workspace = this.props.workspace;

        let workspaceInfo; // For debug only
        let workspacePane;
        if (workspace) {
            assert.ok(workspace.workflow);
            const steps = workspace.workflow.steps;
            assert.ok(steps);

            const selectedWorkspaceResourceId = this.props.selectedWorkspaceResourceId;
            const selectedWorkflowStepId = this.props.selectedWorkflowStepId;

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
                                <span>{`Resources (${steps.length})`}</span>
                            </Tooltip>
                        </Tab>
                        <Tab>
                            <span className="pt-icon-flows" style={{marginRight: 4}}/>
                            <Tooltip content={workflowTooltip}>
                                <span>{`Steps (${steps.length})`}</span>
                            </Tooltip>
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <ListBox numItems={steps.length}
                                 getItemKey={i => steps[i].id}
                                 renderItem={i => <span>{steps[i].id}</span>}
                                 selection={selectedWorkspaceResourceId ? [selectedWorkspaceResourceId] : null}
                                 onSelection={this.handleWorkspaceResourceIdSelected.bind(this)}/>
                        <div style={{display: 'flex'}}><span style={{flex: 'auto'}}/>
                            <Button disabled={!steps.length} iconName="label"/>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <ListBox numItems={steps.length}
                                 getItemKey={i => steps[i].id}
                                 renderItem={i => <span>{steps[i].action}</span>}
                                 selection={selectedWorkflowStepId ? [selectedWorkflowStepId] : null}
                                 onSelection={this.handleWorkflowStepIdSelected.bind(this)}/>
                        <div style={{display: 'flex'}}><span style={{flex: 'auto'}}/>
                            <Button disabled={!steps.length} style={{marginRight: '0.2em'}} iconName="duplicate"/>
                            <Button disabled={!steps.length} style={{marginRight: '0.2em'}} iconName="edit"/>
                            <Button disabled={!steps.length} iconName="delete"/>
                        </div>
                    </TabPanel>
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

        return (
            <ExpansionPanel icon="pt-icon-folder-close" text="Workspace" isExpanded={true} defaultHeight={300}>
                {workspaceInfo}
                {workspacePane}
            </ExpansionPanel>
        );
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
