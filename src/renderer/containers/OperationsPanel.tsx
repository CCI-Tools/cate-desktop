import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {
    Popover, Menu, MenuItem, InputGroup, Classes, Tag, Intent,
    PopoverInteractionKind, Button
} from "@blueprintjs/core";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {LabelWithType} from "../components/LabelWithType";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import OperationStepDialog from "./OperationStepDialog";
import {State, OperationState, WorkspaceState, OperationOutputState, OperationInputState} from "../state";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {NO_OPERATIONS_FOUND} from "../messages";


interface IOperationsPanelProps {
    dispatch?: Dispatch<State>;
    workspace: WorkspaceState;
    operations: OperationState[]|null;
    selectedOperationName: string|null;
    selectedOperation: OperationState|null;
    filteredOperations: OperationState[];
    operationFilterTags: string[];
    operationFilterExpr: string|null;
    operationsTagCounts: Map<string, number>,
    showOperationDetails: boolean;
}


function mapStateToProps(state: State): IOperationsPanelProps {
    return {
        workspace: state.data.workspace,
        operations: selectors.operationsSelector(state),
        selectedOperation: selectors.selectedOperationSelector(state),
        filteredOperations: selectors.filteredOperationsSelector(state),
        selectedOperationName: selectors.selectedOperationNameSelector(state),
        operationFilterTags: selectors.operationFilterTagsSelector(state) || selectors.EMPTY_ARRAY,
        operationFilterExpr: selectors.operationFilterExprSelector(state),
        operationsTagCounts: selectors.operationsTagCountsSelector(state),
        showOperationDetails: state.control.showOperationDetails,
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
        this.handleAddOperationStepButtonClicked = this.handleAddOperationStepButtonClicked.bind(this);
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

    private handleAddOperationStepButtonClicked() {
        this.props.dispatch(actions.showOperationStepDialog());
    }

    private static getItemKey(operation: OperationState) {
        return operation.name;
    }

    private static renderItem(operation: OperationState) {
        const name = operation.name;
        let dataType;
        if (!operation.outputs.length) {
            dataType = '';
        } else if (operation.outputs.length === 1) {
            dataType = operation.outputs[0].dataType;
        } else {
            dataType = `${operation.outputs.length} types`;
        }
        return (<LabelWithType label={name} dataType={dataType}/>);
    }

    render() {
        const operations = this.props.operations;
        let body;
        if (operations && operations.length) {
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

            const canApplyOperation = this.props.selectedOperation && this.props.workspace;
            const actionComponent = (
                <div className="pt-button-group">
                    <Button className="pt-intent-primary"
                            onClick={this.handleAddOperationStepButtonClicked}
                            disabled={!canApplyOperation}
                            iconName="play">Apply...</Button>
                    {canApplyOperation ? <OperationStepDialog isAddDialog={true}/> : null}
                </div>
            );

            body = (<div>
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
            </div>);
        } else {
            body = this.renderNoOperationsMessage();
        }
        return body;
    }

    private renderOperationsList() {
        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.filteredOperations}
                         getItemKey={OperationsPanel.getItemKey}
                         renderItem={OperationsPanel.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedOperationName}
                         onSelection={this.handleOperationSelection}/>
            </ScrollablePanelContent>
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

    private static formatPortDescriptionText(description) {
        if (!description || description === '') {
            return description;
        }
        description = description.trim();
        if (!description.endsWith('.')) {
            description += '.';
        }
        return ' - ' + description;
    }

    private static getInputDescriptionText(input: OperationInputState) {
        let description = OperationsPanel.formatPortDescriptionText(input.description);
        if (typeof (input.defaultValue) === 'undefined') {
            description += ' Mandatory value.';
        } else {
            description += ` Default value is "${input.defaultValue}".`
        }
        return description;
    }

    private static getOutputDescriptionText(output: OperationOutputState) {
        return OperationsPanel.formatPortDescriptionText(output.description);
    }

    private static getMultiplicityText(n: number, singularText: string, pluralText?: string): string {
        return n == 1 ? singularText : (pluralText || singularText + "s");
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

            if (operation.outputs && operation.outputs.length) {
                const outputElems = operation.outputs.map(output => (
                    <li key={output.name}>
                        <LabelWithType label={output.name} dataType={output.dataType} units={output.units}/>
                        {OperationsPanel.getOutputDescriptionText(output)}
                    </li>
                ));
                outputs = (
                    <p>
                        <p>
                            <strong>{OperationsPanel.getMultiplicityText(operation.outputs.length, 'Output') + ":"}</strong>
                        </p>
                        <ul>{outputElems}</ul>
                    </p>
                );
            }


            if (operation.inputs && operation.inputs.length) {
                const inputElems = operation.inputs.map(input => (
                    <li key={input.name}>
                        <LabelWithType label={input.name} dataType={input.dataType} units={input.units}/>
                        {OperationsPanel.getInputDescriptionText(input)}
                    </li>
                ));
                inputs = (
                    <p><p>
                        <strong>{OperationsPanel.getMultiplicityText(operation.outputs.length, 'Input') + ":"}</strong>
                    </p>
                        <ul>{inputElems}</ul>
                    </p>
                );
            }
        }

        return (
            <ScrollablePanelContent>
                <Card>
                    <h5>{title}</h5>
                    {description}
                    {tags}
                    {outputs}
                    {inputs}
                </Card>
            </ScrollablePanelContent>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderNoOperationsMessage() {
        return NO_OPERATIONS_FOUND;
    }

}

export default connect(mapStateToProps)(OperationsPanel);
