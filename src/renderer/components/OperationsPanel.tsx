import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, OperationState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedOperationName, setOperationFilterTags, setOperationFilterExpr} from '../actions'
import {SplitPane} from "../containers/SplitPane";
import {Popover, Position, Menu, MenuItem, InputGroup, Classes, Tag, Intent} from "@blueprintjs/core";
import FormEvent = React.FormEvent;


function mapStateToProps(state: State) {
    return {
        operations: state.data.operations,
        selectedOperationName: state.control.selectedOperationName,
        operationFilterTags: state.control.operationFilterTags,
        operationFilterExpr: state.control.operationFilterExpr,
    };
}


/**
 * The OperationsPanel is used to select and browse available operations.
 *
 * @author Norman Fomferra
 */
class OperationsPanel extends React.Component<any, any> {

    render() {
        const allOperations = this.props.operations;
        if (!allOperations || !allOperations.length) {
            return <p>No operations found.</p>;
        }

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

        const operationTagFilterPanel = this.renderOperationTagFilterPanel(allOperations, operationFilterTags);
        const operationsTable = this.renderOperationsTable(filteredOperations);
        const operationDetailsCard = this.renderOperationDetailsCard(selectedOperation);

        return (
            <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                {operationFilterExprInput}
                {operationTagFilterPanel}
                <SplitPane direction="ver" initialSize={150}>
                    {operationsTable}
                    {operationDetailsCard}
                </SplitPane>
            </ExpansionPanel>
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
                    <MenuItem key={tagName} text={`${tagName} (${tagCount})`} onClick={() => this.addTagName.bind(this)(tagName)}/>);
            }
        });

        let addTagButton = null;
        if (tagMenuItems.length > 0) {
            const tagMenu = (<Menu>{tagMenuItems}</Menu>);
            addTagButton = (
                <Popover content={tagMenu} position={Position.RIGHT_BOTTOM} useSmartPositioning={true}>
                    <Tag  intent={Intent.SUCCESS}  className="pt-icon-small-plus" style={tagStyle}/>
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
                        <li key={output.name}><i>{output.name}</i>{`: (${output.dataType}) `}{output.description}</li>));
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
            <div style={{padding: 6, overflowY: 'auto', flex: 'auto', maxHeight: '100%'}}>
                <div className="pt-card pt-elevation-2">
                    <h5>{title}</h5>
                    {description}
                    {tags}
                    {outputs}
                    {inputs}
                </div>
            </div>);
    }


    private renderOperationsTable(operations: Array<OperationState>) {
        const renderNameCell = (rowIndex: number) => {
            const operation: OperationState = operations[rowIndex];
            return <Cell>{operation.name}</Cell>
        };

        const renderTypeCell = (rowIndex: number) => {
            const operation: OperationState = operations[rowIndex];
            let dataType;
            if (!operation.outputs.length) {
                dataType = '';
            } else if (operation.outputs.length === 1) {
                dataType = operation.outputs[0].dataType;
            } else {
                dataType = `${operation.outputs.length} types`;
            }
            return <Cell>{dataType}</Cell>
        };

        const renderTagsCell = (rowIndex: number) => {
            const operation: OperationState = operations[rowIndex];
            let tags;
            if (!operation.tags) {
                tags = '';
            } else {
                tags = operation.tags.join();
            }
            return <Cell>{tags}</Cell>
        };

        const handleOperationSelection = (selectedRegions: IRegion[]) => {
            let selectedOperationName;
            if (selectedRegions && selectedRegions.length > 0 && selectedRegions[0].rows) {
                const index = selectedRegions[0].rows[0];
                selectedOperationName = operations[index].name;
            } else {
                selectedOperationName = null;
            }
            if (this.props.selectedOperationName !== selectedOperationName) {
                this.props.dispatch(setSelectedOperationName(selectedOperationName));
            }
        };

        return (
            <Table numRows={operations.length}
                   allowMultipleSelection={false}
                   selectionModes={SelectionModes.ROWS_AND_CELLS}
                   isRowHeaderShown={false}
                   isColumnResizable={true}
                   isRowResizable={false}
                   onSelection={handleOperationSelection.bind(this)}>
                <Column name="Name" renderCell={renderNameCell}/>
                <Column name="Type" renderCell={renderTypeCell}/>
                <Column name="Tags" renderCell={renderTagsCell}/>
            </Table>
        );
    }
}

export default connect(mapStateToProps)(OperationsPanel);
