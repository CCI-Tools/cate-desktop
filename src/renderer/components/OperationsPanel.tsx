import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, OperationState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedOperationIndex} from '../actions'


interface IOperationsPanelProps {
    operations: Array<OperationState>;
    selectedOperationIndex: number;
}


/**
 * The OperationsPanel is used to select and browse available operations.
 *
 * @author Norman Fomferra
 */
@connect(
    (state: State) => {
        return {
            operations: state.data.operations,
            selectedOperationIndex: state.control.selectedOperationIndex,
        };
    })
export class OperationsPanel extends React.Component<any, any> {

    render() {
        const operations = this.props.operations;
        if (!operations || !operations.length) {
            return <p>No operations available</p>;
        }

        let selectedOperationIndex = this.props.selectedOperationIndex;

        let operation: OperationState;
        if (selectedOperationIndex >= 0) {
            operation = operations[selectedOperationIndex];
        } else {
            selectedOperationIndex = null;
        }

        const renderNameCell = (rowIndex: number) => {
            const operation: OperationState = operations[rowIndex];
            return <Cell><b>{operation.name}()</b></Cell>
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
                tags = operation.tags.join(', ');
            }
            return <Cell>{tags}</Cell>
        };
        const handleSelection = (selectedRegions: IRegion[]) => {
            let selectedRows: Array<[number, number]> = [];
            for (let selectedRegion of selectedRegions) {
                selectedRows.push(selectedRegion.rows);
            }
            if (selectedRows.length > 0) {
                this.props.dispatch(setSelectedOperationIndex(selectedRows[0][0]));
            } else {
                this.props.dispatch(setSelectedOperationIndex(-1));
            }
        };
        const table = (
            <Table numRows={operations.length}
                   selectionModes={SelectionModes.ROWS_AND_CELLS}
                   isRowHeaderShown={false}
                   isColumnResizable={true}
                   isRowResizable={false}
                   onSelection={handleSelection.bind(this)}>
                <Column name="Name" renderCell={renderNameCell}/>
                <Column name="Type" renderCell={renderTypeCell}/>
                <Column name="Tags" renderCell={renderTagsCell}/>
            </Table>
        );

        return (
            <ExpansionPanel icon="pt-icon-database" text="Operations" isExpanded={true} height="20em">
                {table}
            </ExpansionPanel>
        );
    }
}

