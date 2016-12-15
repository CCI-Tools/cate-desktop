import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, OperationState, WorkspaceState} from "../state";
import {setSelectedOperationName, setOperationFilterTags, setOperationFilterExpr} from '../actions'
import {
    Popover, Position, Menu, MenuItem, InputGroup, Classes, Tag, Intent,
    PopoverInteractionKind, Tooltip, Button
} from "@blueprintjs/core";
import FormEvent = React.FormEvent;
import {ListBox, ListBoxSelectionMode} from "./ListBox";
import {Card} from "./Card";
import {OperationAPI} from "../webapi/apis/OperationAPI";
import * as actions from "../actions";
import {ContentWithDetailsPanel} from "./ContentWithDetailsPanel";
import {EditOpStepDialog, IEditOpStepDialogState} from "./EditOpStepDialog";

interface IOperationsPanelProps {
    dispatch?: Dispatch<State>;
    webAPIClient: any;
    workspace: WorkspaceState;
    operations: Array<OperationState>;
    selectedOperationName: string|null;
    operationFilterTags: Array<string>|null;
    operationFilterExpr: string|null;
    showOperationDetails: boolean;
    editOpStepDialogState: IEditOpStepDialogState;
}


function mapStateToProps(state: State) : IOperationsPanelProps {
    const dialogId = EditOpStepDialog.getDialogId(state.control.selectedOperationName, true);
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        workspace: state.data.workspace,
        operations: state.data.operations,
        selectedOperationName: state.control.selectedOperationName,
        operationFilterTags: state.control.operationFilterTags,
        operationFilterExpr: state.control.operationFilterExpr,
        showOperationDetails: state.control.showOperationDetails,
        editOpStepDialogState: ((dialogId && state.control.dialogs[dialogId]) || {}) as IEditOpStepDialogState
    };
}

/**
 * The OperationsPanel is used to select and browse available operations.
 *
 * @author Norman Fomferra
 */
class OperationsPanel extends React.Component<IOperationsPanelProps, any> {

    componentDidMount() {
        if (!this.props.operations) {
            this.updateOperations();
        }
    }

    private updateOperations() {
        // TODO: show in the UI that we are in the process of getting operations
        this.getOperationAPI().getOperations().then(operations => {
            this.props.dispatch(actions.updateOperations(operations));
        }).catch(error => {
            // TODO: handle error
            console.error(error);
        });
    }

    private getOperationAPI(): OperationAPI {
        return new OperationAPI(this.props.webAPIClient);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlState('showOperationDetails', value));
    }

    private handleAddOpStepButtonClicked() {
        // Open "addOpStep_X" dialog
        const dialogId = EditOpStepDialog.getDialogId(this.props.selectedOperationName, true);
        this.props.dispatch(actions.setDialogState(dialogId, {isOpen: true}));
    }

    private handleAddOpStepDialogClosed(actionId: string, dialogState: IEditOpStepDialogState) {
        // Close "addOpStep_X" dialog and save state
        const dialogId = EditOpStepDialog.getDialogId(this.props.selectedOperationName, true);
        this.props.dispatch(actions.setDialogState(dialogId, dialogState));

        // Perform the action
        if (actionId) {
            /*
            const resName = 'ds_' + (DataSourcesPanel.resourceId++);
            const opName = 'open_dataset';
            const opArgs = {
                ds_name: this.props.selectedDataSourceId,
                start_date: `${dialogState.timeRange[0]}`,
                end_date: `${dialogState.timeRange[1]}`,
                sync: true
            };
            this.props.dispatch(actions.setWorkspaceResource(resName, opName, opArgs));
            */
        }
    }

    render() {
        const allOperations = this.props.operations || [];
        const operationFilterTags = new Set<string>(this.props.operationFilterTags);
        const operationFilterExpr = this.props.operationFilterExpr;
        const selectedOperation = this.props.selectedOperationName
            ? allOperations.find(op => op.name === this.props.selectedOperationName)
            : null;

        let nameMatches = op => !operationFilterExpr || op.name.includes(operationFilterExpr);
        let hasTag = op => !operationFilterTags.size || (op.tags || []).some(tagName => operationFilterTags.has(tagName));
        const filteredOperations = !operationFilterExpr && !operationFilterTags.size
            ? allOperations
            : allOperations.filter(op => nameMatches(op) && hasTag(op));


        const resultsTag = (
            <Tag className={Classes.MINIMAL}>
                {filteredOperations.length}
            </Tag>
        );
        const operationFilterExprInput = (<InputGroup
            disabled={false}
            leftIconName="filter"
            onChange={this.handleOperationFilterExprChange.bind(this)}
            placeholder="Find operation"
            rightElement={resultsTag}
            value={operationFilterExpr}
        />);

        if (allOperations.length > 0) {
            const selectedOperationName = this.props.selectedOperationName;

            const operationTagFilterPanel = this.renderOperationTagFilterPanel(allOperations, operationFilterTags);
            const operationsList = this.renderOperationsList(filteredOperations, selectedOperationName);
            const operationDetailsCard = this.renderOperationDetailsCard(selectedOperation);

            let addOpStepDialog = null;
            if (this.props.editOpStepDialogState.isOpen) {
                addOpStepDialog = (
                    <EditOpStepDialog
                        operation={selectedOperation}
                        isAddOpStepDialog={true}
                        {...this.props.editOpStepDialogState}
                        onClose={this.handleAddOpStepDialogClosed.bind(this)}/>
                );
            }

            const actionComponent = (
                <div>
                    <Button className="pt-intent-primary"
                            onClick={this.handleAddOpStepButtonClicked.bind(this)}
                            disabled={!this.props.selectedOperationName || !this.props.workspace}
                            iconName="add">Add...</Button>
                    {addOpStepDialog}
                </div>
            );

            return (
                <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                    {operationFilterExprInput}
                    {operationTagFilterPanel}
                    <ContentWithDetailsPanel showDetails={this.props.showOperationDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged.bind(this)}
                                             isSplitPanel={true}
                                             initialContentHeight={200}
                                             actionComponent={actionComponent}>
                        {operationsList}
                        {operationDetailsCard}
                    </ContentWithDetailsPanel>
                </ExpansionPanel>
            );
        } else {
            const noOperationsMessage = this.renderNoOperationsMessage();

            return (
                <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                    {noOperationsMessage}
                </ExpansionPanel>
            );
        }
    }

    private renderOperationsList(operations: Array<OperationState>, selectedOperationName: string) {
        const renderItem = (itemIndex: number) => {
            const operation: OperationState = operations[itemIndex];

            const name = operation.name;

            let dataType;
            if (!operation.outputs.length) {
                dataType = '';
            } else if (operation.outputs.length === 1) {
                dataType = operation.outputs[0].dataType;
            } else {
                dataType = `${operation.outputs.length} types`;
            }

            return <span>{name} <span style={{color: 'rgba(0,255,0,0.8)', fontSize: '0.8em'}}>{dataType}</span></span>
        };

        const handleOperationSelection = (oldSelection: Array<React.Key>, newSelection: Array<React.Key>) => {
            if (newSelection.length > 0) {
                this.props.dispatch(setSelectedOperationName(newSelection[0] as string));
            } else {
                this.props.dispatch(setSelectedOperationName(null));
            }
        };

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={operations.length}
                         getItemKey={index => operations[index].name}
                         renderItem={renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={selectedOperationName ? [selectedOperationName] : []}
                         onSelection={handleOperationSelection.bind(this)}/>
            </div>
        );
    }

    private handleOperationFilterExprChange(event) {
        this.props.dispatch(setOperationFilterExpr(event.target.value));
    }

    //noinspection JSMethodCanBeStatic
    private renderOperationTagFilterPanel(operations: Array<OperationState>, selectedOperationTags: Set<string>) {

        // Note: since our list of operations remains constant, we should compute tagCounts beforehand
        let tagCounts = new Map<string, number>();
        operations.forEach((op: OperationState) => (op.tags || []).forEach((tag: string) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }));

        const tagContainerStyle = {padding: '0.2em'};
        const tagStyle = {marginRight: '0.2em'};

        let selectedTagItems = [];
        selectedOperationTags.forEach(tagName => {
            selectedTagItems.push(
                <Tag intent={Intent.PRIMARY}
                     style={tagStyle}
                     onRemove={() => this.removeTagName.bind(this)(tagName)}>
                    {`${tagName}`}
                </Tag>);
        });

        let tagMenuItems = [];
        tagCounts.forEach((tagCount, tagName) => {
            if (!selectedOperationTags.has(tagName)) {
                tagMenuItems.push(
                    <MenuItem key={tagName} text={`${tagName} (${tagCount})`}
                              onClick={() => this.addTagName.bind(this)(tagName)}/>);
            }
        });

        let addTagButton = null;
        if (tagMenuItems.length) {
            const tagMenu = (<Menu>{tagMenuItems}</Menu>);
            addTagButton = (
                <Tooltip content="Filter by tags">
                    <Popover
                        content={tagMenu}
                        position={Position.RIGHT_BOTTOM}
                        interactionKind={PopoverInteractionKind.CLICK}
                        useSmartPositioning={true}>
                        <Tag intent={Intent.SUCCESS} className="pt-icon-small-plus" style={tagStyle}/>
                    </Popover>
                </Tooltip>
            );
        }

        return (
            <div style={tagContainerStyle}>
                {addTagButton}{selectedTagItems}
            </div>
        );
    }

    private addTagName(tagName: string) {
        const tags = new Set<string>(this.props.operationFilterTags);
        tags.add(tagName);
        this.props.dispatch(setOperationFilterTags(Array.from(tags)));
    }

    private removeTagName(tagName: string) {
        const tags = new Set<string>(this.props.operationFilterTags);
        tags.delete(tagName);
        this.props.dispatch(setOperationFilterTags(Array.from(tags)));
    }

    //noinspection JSMethodCanBeStatic
    private renderOperationDetailsCard(operation: OperationState) {
        let title = "No selection";
        let description = null;
        let tags = null;
        let inputs = null;
        let outputs = null;
        if (operation) {
            title = operation.name;

            if (operation.description) {
                description = (<p><i>{operation.description}</i></p>);
            }

            if (operation.tags) {
                tags = (<p><b>Tags:</b> {operation.tags.join(', ')}</p>);
            }

            if (operation.outputs) {
                if (operation.outputs.length == 1) {
                    const output = operation.outputs[0];
                    outputs = (<p><b>Returns:</b> {`: (${output.dataType}) `}{output.description}</p>);
                } else {
                    const outputElems = operation.outputs.map(output => (
                        <li key={output.name}><i>{output.name}</i>{`: (${output.dataType}) `}{output.description}
                        </li>));
                    outputs = (
                        <div><p><b>Outputs:</b></p>
                            <ul>{outputElems}</ul>
                        </div>
                    );
                }
            }

            if (operation.inputs) {
                const inputElems = operation.inputs.map(input =>
                    <li key={input.name}><i>{input.name}</i>{`: (${input.dataType}) `}{input.description}</li>);
                inputs = (
                    <div><p><b>Parameter(s):</b></p>
                        <ul>{inputElems}</ul>
                    </div>
                );
            }
        }

        return (
            <Card>
                <h5>{title}</h5>
                {description}
                {tags}
                {outputs}
                {inputs}
            </Card>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderNoOperationsMessage() {
        return (
            <Card>
                <p><strong>No data operations found!</strong></p>
                <p>
                    This is very likely a configuration error,
                    please check the logs of the Cate WebAPI service.
                </p>
            </Card>);
    }

}

export default connect(mapStateToProps)(OperationsPanel);
