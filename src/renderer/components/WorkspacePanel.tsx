import * as React from 'react';
import {connect} from 'react-redux';
import {State, OperationState} from "../state";

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

    render() {
        return null;
    }
}

export default connect(mapStateToProps)(WorkspacePanel);
