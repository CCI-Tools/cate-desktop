import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, OperationState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedOperationName, setSelectedOperationTags} from '../actions'
import {SplitPane} from "../containers/SplitPane";
import {Popover, Position , Menu, MenuItem} from "@blueprintjs/core";


function mapStateToProps(state: State) {
    return {
        operations: state.data.operations,
        selectedOperationName: state.control.selectedOperationName,
        selectedOperationTags: state.control.selectedOperationTags,
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

        const selectedOperationTags = new Set<string>(this.props.selectedOperationTags);
        const selectedOperation = this.props.selectedOperationName
            ? allOperations.find(op => op.name === this.props.selectedOperationName)
            : null;

        let hasTag = op => (op.tags || []).some(tagName => selectedOperationTags.has(tagName));
        const filteredOperations = selectedOperationTags.size == 0
            ? allOperations
            : allOperations.filter(hasTag);

        const operationFilterPanel = this.renderOperationFilterPanel(allOperations, selectedOperationTags);
        const operationsTable = this.renderOperationsTable(filteredOperations);
        const operationDetailsCard = this.renderOperationDetailsCard(selectedOperation);

        return (
            <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                {operationFilterPanel}
                <SplitPane direction="ver" initialSize={150}>
                    {operationsTable}
                    {operationDetailsCard}
                </SplitPane>
            </ExpansionPanel>
        );
    }
    //noinspection JSMethodCanBeStatic
    private renderOperationFilterPanel(operations: Array<OperationState>, selectedOperationTags: Set<string>) {

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
                <span className="pt-tag pt-intent-primary pt-tag-removable" style={tagStyle}>
                    {`${tagName}`}
                    <button className="pt-tag-remove pt-minimal"
                            onClick={() => this.removeTagName.bind(this)(tagName)}/>
                </span>);
        });

        let tagMenuItems = [];
        tagCounts.forEach((tagCount, tagName) => {
            if (!selectedOperationTags.has(tagName)) {
                tagMenuItems.push(
                    <MenuItem text={`${tagName} (${tagCount})`} onClick={() => this.addTagName.bind(this)(tagName)}/>);
            }
        });

        let addTagButton = null;
        if (tagMenuItems.length > 0) {
            const tagMenu = (<Menu>{tagMenuItems}</Menu>);
            addTagButton = (
                <Popover content={tagMenu} position={Position.RIGHT_BOTTOM} useSmartPositioning={true}>
                    <span className="pt-tag pt-intent-success pt-icon-small-plus" style={tagStyle}/>
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
        const tags = new Set<string>(this.props.selectedOperationTags);
        tags.add(tagName);
        this.props.dispatch(setSelectedOperationTags(Array.from(tags)));
    }

    private removeTagName(tagName: string) {
        const tags = new Set<string>(this.props.selectedOperationTags);
        tags.delete(tagName);
        this.props.dispatch(setSelectedOperationTags(Array.from(tags)));
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
            // console.log('handleOperationSelection: selectedRegions: ', selectedRegions);
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

        // console.warn("Rerendering operations panel!");

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
