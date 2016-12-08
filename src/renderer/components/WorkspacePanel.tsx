import * as React from 'react';
import {connect} from 'react-redux';
import {State, WorkspaceState} from "../state";
import {Tooltip, Tab, Tabs, TabList, TabPanel} from "@blueprintjs/core";
import {ExpansionPanel} from "./ExpansionPanel";
import {WorkspaceAPI} from "../webapi/apis/WorkspaceAPI";
import * as actions from '../actions'
import {ListBox} from "./ListBox";

interface IWorkspacePanelProps {
    dispatch?: (action: {type: string, payload: any}) => void;
    webAPIClient: any;
    openLastWorkspace?: boolean,
    lastWorkspacePath?: string|null,
    workspace: WorkspaceState;
    selectedWorkflowStepId: string|null;
    selectedWorkflowResourceId: string|null;
}

function mapStateToProps(state: State): IWorkspacePanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        openLastWorkspace: state.session.openLastWorkspace,
        lastWorkspacePath: state.session.lastWorkspacePath,
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
class WorkspacePanel extends React.PureComponent<IWorkspacePanelProps, any> {

    constructor(props) {
        super();
    }

    private getWorkspaceAPI(): WorkspaceAPI {
        return new WorkspaceAPI(this.props.webAPIClient);
    }

    componentDidMount(): void {
        if (!this.props.workspace) {
            if (this.props.openLastWorkspace && this.props.lastWorkspacePath) {
                this.openWorkspace(this.props.lastWorkspacePath);
            } else {
                this.newWorkspace();
            }
        }
    }

    private newWorkspace() {
        // TODO: show in the UI that we are in the process of getting a new workspace
        this.getWorkspaceAPI().newWorkspace(null).then(workspace => {
            this.props.dispatch(actions.setCurrentWorkspace(workspace));
        }).catch(error => {
            // TODO: handle error
            console.error(error);
        });
    }

    private openWorkspace(workspacePath: string) {
        // TODO: show in the UI that we are in the process of opening a workspace
        this.getWorkspaceAPI().openWorkspace(workspacePath).then(workspace => {
            this.props.dispatch(actions.setCurrentWorkspace(workspace));
        }).catch(error => {
            // TODO: handle error
            console.error(error);
            this.newWorkspace();
        });
    }

    render() {
        const resourcesTooltip = "Workspace resources that result from workflow steps";
        const workflowTooltip = "Workflow steps that generate resources";

        const resourcesMoreMenu = <span className="pt-icon-standard pt-icon-edit"/>;
        const operationsMoreMenu = <span className="pt-icon-standard pt-icon-more"/>;

        const resources = [
            "Resource #1",
            "Resource #2",
            "Resource #3",
            "Resource #4",
        ];
        const steps = [
            "Operation Step #1",
            "Operation Step #2",
            "Operation Step #3",
            "Operation Step #4",
        ];

        return (
            <ExpansionPanel icon="pt-icon-folder-close" text="Workspace" isExpanded={true} defaultHeight={300}>
                <Tabs>
                    <TabList>
                        <Tab>
                            <Tooltip content={resourcesTooltip}>
                                <span className="pt-icon-database" style={{marginRight: 4}}/>
                            </Tooltip>
                            <span>Resources</span>
                        </Tab>
                        <Tab>
                            <Tooltip content={workflowTooltip}>
                                <span className="pt-icon-database" style={{marginRight: 4}}/>
                            </Tooltip>
                            <span>Workflow</span>
                        </Tab>
                    </TabList>
                    <TabPanel>
                        <ListBox numItems={resources.length} renderItem={i => <span>{resources[i]}</span>}/>
                    </TabPanel>
                    <TabPanel>
                        <ListBox numItems={steps.length} renderItem={i => <span>{steps[i]}</span>}/>
                    </TabPanel>
                </Tabs>
            </ExpansionPanel>
        );
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
