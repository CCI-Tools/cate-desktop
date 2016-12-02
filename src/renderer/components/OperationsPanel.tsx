import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, OperationState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedOperationIndex} from '../actions'
import {SplitPane} from "../containers/SplitPane";


function mapStateToProps(state: State) {
    return {
        operations: state.data.operations,
        selectedOperationIndex: state.control.selectedOperationIndex,
    };
}


/**
 * The OperationsPanel is used to select and browse available operations.
 *
 * @author Norman Fomferra
 */
class OperationsPanel extends React.Component<any, any> {

    render() {
        const operations = this.props.operations;
        if (!operations || !operations.length) {
            return <p>No operations found.</p>;
        }

        let selectedOperationIndex: number = this.props.selectedOperationIndex;

        let operation: OperationState;
        if (selectedOperationIndex >= 0) {
            operation = operations[selectedOperationIndex];
        } else {
            operation = null;
        }

        const operationsTable = this.renderOperationsTable(operations);
        const operationDetailsCard = this.renderOperationDetailsCard(operation);

        return (
            <ExpansionPanel icon="pt-icon-function" text="Operations" isExpanded={true} defaultHeight={300}>
                <SplitPane direction="ver" initialSize={150}>
                    {operationsTable}
                    {operationDetailsCard}
                </SplitPane>
            </ExpansionPanel>
        );
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
                        <li><i>{output.name}</i>{`: (${output.dataType}) `}{output.description}</li>));
                    outputs = (
                        <div><p><b>Outputs:</b></p>
                            <ul>{outputElems}</ul>
                        </div>
                    );
                }
            }

            if (operation.inputs) {
                const inputElems = operation.inputs.map(input =>
                    <li><i>{input.name}</i>{`: (${input.dataType}) `}{input.description}</li>);
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
            let selectedOperationIndex;
            if (selectedRegions && selectedRegions.length > 0 && selectedRegions[0].rows) {
                selectedOperationIndex = selectedRegions[0].rows[0];
            } else {
                selectedOperationIndex = -1;
            }
            if (this.props.selectedOperationIndex !== selectedOperationIndex) {
                this.props.dispatch(setSelectedOperationIndex(selectedOperationIndex));
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
