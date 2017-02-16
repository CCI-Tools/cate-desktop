import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {
    Popover, Menu, MenuItem, InputGroup, Classes, Tag, Intent,
    PopoverInteractionKind, Button
} from "@blueprintjs/core";
import {ExpansionPanel} from '../components/ExpansionPanel';
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {LabelWithType} from "../components/LabelWithType";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import {EditOpStepDialog, IEditOpStepDialogState} from "./EditOpStepDialog";
import {State, OperationState, WorkspaceState} from "../state";
import * as actions from "../actions";
import * as selectors from "../selectors";


interface IOperationsPanelProps {
    dispatch?: Dispatch<State>;
    workspace: WorkspaceState;
    operations: OperationState[]|null;
    selectedOperationName: string|null;
    selectedOperation: OperationState|null;
    filteredOperations: OperationState[];
    operationFilterTags: string[]|null;
    operationFilterExpr: string|null;
    operationsTagCounts: Map<string, number>,
    showOperationDetails: boolean;
    editOpStepDialogState: IEditOpStepDialogState;
    newResourceName: string;
}


function mapStateToProps(state: State): IOperationsPanelProps {
    const dialogId = EditOpStepDialog.getDialogId(state.control.selectedOperationName, true);
    return {
        workspace: state.data.workspace,
        operations: selectors.operationsSelector(state),
        selectedOperation: selectors.selectedOperationSelector(state),
        filteredOperations: selectors.filteredOperationsSelector(state),
        selectedOperationName: selectors.selectedOperationNameSelector(state),
        operationFilterTags: selectors.operationFilterTagsSelector(state) || [],
        operationFilterExpr: selectors.operationFilterExprSelector(state),
        operationsTagCounts: selectors.operationsTagCountsSelector(state),
        showOperationDetails: state.control.showOperationDetails,
        editOpStepDialogState: ((dialogId && state.control.dialogs[dialogId]) || {}) as IEditOpStepDialogState,
        // TODO (forman): Handle case where action is called twice without completing the first.
        //                In this case the same resource name will be generated :(
        newResourceName: selectors.newResourceNameSelector(state)
    };
}

/**
 * The OperationsPanel is used to select and browse available operations.
 *
 * @author Norman Fomferra
 */
class OperationsPanel extends React.Component<IOperationsPanelProps, any> {

    constructor(props: IOperationsPanelProps, context: any) {
        super(props, context);
        this.handleOperationSelection = this.handleOperationSelection.bind(this);
        this.handleOperationFilterExprChange = this.handleOperationFilterExprChange.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleAddOpStepButtonClicked = this.handleAddOpStepButtonClicked.bind(this);
        this.handleAddOpStepDialogClosed = this.handleAddOpStepDialogClosed.bind(this);
        this.getItemKey = this.getItemKey.bind(this);
        this.renderItem = this.renderItem.bind(this);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlProperty('showOperationDetails', value));
    }

    private handleOperationSelection(newSelection: Array<React.Key>) {
        if (newSelection.length > 0) {
            this.props.dispatch(actions.setSelectedOperationName(newSelection[0] as string));
        } else {
            this.props.dispatch(actions.setSelectedOperationName(null));
        }
    }

    private handleOperationFilterExprChange(event) {
        this.props.dispatch(actions.setOperationFilterExpr(event.target.value));
    }

    private handleAddOpStepButtonClicked() {
        // Open "addOpStep_X" dialog
        const dialogId = EditOpStepDialog.getDialogId(this.props.selectedOperationName, true);
        this.props.dispatch(actions.setDialogState(dialogId, {isOpen: true}));
    }

    private handleAddOpStepDialogClosed(actionId: string, dialogState: IEditOpStepDialogState) {
        const selectedOperation = this.props.selectedOperation;

        // Close "addOpStep_X" dialog and save state
        const dialogId = EditOpStepDialog.getDialogId(this.props.selectedOperationName, true);
        this.props.dispatch(actions.setDialogState(dialogId, dialogState));

        // Perform the action
        if (actionId) {
            const resName = this.props.newResourceName;
            const opName = selectedOperation.name;
            const opArgs = {};
            selectedOperation.inputs.forEach((input, index) => {
                const inputAssignment = dialogState.inputAssignments[index];
                let opArg;
                if (inputAssignment.isValueUsed) {
                    opArg = {value: inputAssignment.constantValue};
                } else {
                    opArg = {source: inputAssignment.resourceName};
                }
                opArgs[input.name] = opArg;
            });
            // console.log("OperationsPanel: handleAddOpStepDialogClosed", opName, opArgs);
            this.props.dispatch(actions.setWorkspaceResource(resName, opName, opArgs, `Applying operation "${opName}"`));
        }
    }

    private getItemKey(itemIndex: number) {
        return this.props.filteredOperations[itemIndex].name;
    }

    private renderItem(itemIndex: number) {
        const operation = this.props.filteredOperations[itemIndex];
        const name = operation.name;
        let dataType;
        if (!operation.outputs.length) {
            dataType = '';
        } else if (operation.outputs.length === 1) {
            dataType = operation.outputs[0].dataType;
        } else {
            dataType = `${operation.outputs.length} types`;
        }
        return <LabelWithType label={name} dataType={dataType}/>
    }

    render() {
        const operations = this.props.operations;
        if (operations && operations.length) {
            const selectedOperation = this.props.selectedOperation;
            const operationFilterExpr = this.props.operationFilterExpr;
            const operationTagFilterPanel = this.renderOperationTagFilterPanel();
            const operationsList = this.renderOperationsList();
            const operationDetailsCard = this.renderOperationDetailsCard();

            const resultsTag = (
                <Tag className={Classes.MINIMAL}>
                    {this.props.filteredOperations.length}
                </Tag>
            );

            const operationFilterExprInput = (<InputGroup
                disabled={false}
                leftIconName="filter"
                onChange={this.handleOperationFilterExprChange}
                placeholder="Find operation"
                rightElement={resultsTag}
                value={operationFilterExpr}
            />);

            let addOpStepDialog = null;
            if (this.props.editOpStepDialogState.isOpen) {
                addOpStepDialog = (
                    <EditOpStepDialog
                        workspace={this.props.workspace}
                        operation={selectedOperation}
                        isAddOpStepDialog={true}
                        {...this.props.editOpStepDialogState}
                        onClose={this.handleAddOpStepDialogClosed}/>
                );
            }

            const actionComponent = (
                <div>
                    <Button className="pt-intent-primary"
                            onClick={this.handleAddOpStepButtonClicked}
                            disabled={!this.props.selectedOperationName || !this.props.workspace}
                            iconName="play">Apply...</Button>
                    {addOpStepDialog}
                </div>
            );

            return (
                <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                    {operationFilterExprInput}
                    {operationTagFilterPanel}
                    <ContentWithDetailsPanel showDetails={this.props.showOperationDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged}
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

    private renderOperationsList() {
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={this.props.filteredOperations.length}
                         getItemKey={this.getItemKey}
                         renderItem={this.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedOperationName}
                         onSelection={this.handleOperationSelection}/>
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderOperationTagFilterPanel() {
        const selectedOperationTags = new Set(this.props.operationFilterTags);
        const tagCounts = this.props.operationsTagCounts;

        const tagContainerStyle = {padding: '0.2em'};
        const tagStyle = {marginRight: '0.2em'};

        let selectedTagItems = [];
        selectedOperationTags.forEach(tagName => {
            selectedTagItems.push(
                <Tag intent={Intent.PRIMARY}
                     style={tagStyle}
                     onRemove={() => this.removeTagName(tagName)}>
                    {`${tagName}`}
                </Tag>);
        });

        let tagMenuItems = [];
        tagCounts.forEach((tagCount, tagName) => {
            if (!selectedOperationTags.has(tagName)) {
                tagMenuItems.push(
                    <MenuItem key={tagName} text={`${tagName} (${tagCount})`}
                              onClick={() => this.addTagName(tagName)}/>);
            }
        });

        let addTagButton = null;
        if (tagMenuItems.length) {
            const tagMenu = (<Menu>{tagMenuItems}</Menu>);
            addTagButton = (
                <Popover
                    content={tagMenu}
                    interactionKind={PopoverInteractionKind.CLICK}>
                    <Tag intent={Intent.SUCCESS} className="pt-icon-small-plus" style={tagStyle}/>
                </Popover>
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
        this.props.dispatch(actions.setOperationFilterTags(Array.from(tags)));
    }

    private removeTagName(tagName: string) {
        const tags = new Set<string>(this.props.operationFilterTags);
        tags.delete(tagName);
        this.props.dispatch(actions.setOperationFilterTags(Array.from(tags)));
    }

    private renderOperationDetailsCard() {
        const operation = this.props.selectedOperation;
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
                        <li key={output.name}>
                            <i>{output.name}</i>{`: (${output.dataType}) `}
                            {output.description}
                        </li>
                    ));
                    outputs = (
                        <div><p><b>Outputs:</b></p>
                            <ul>{outputElems}</ul>
                        </div>
                    );
                }
            }

            if (operation.inputs) {
                const inputElems = operation.inputs.map(input => (
                    <li key={input.name}>
                        <i>{input.name}</i>
                        {`: (${input.dataType}) `}
                        {input.description}
                        {input.defaultValue !== 'undefined' ? ` Default value is "${input.defaultValue}".` : null}
                    </li>
                ));
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
