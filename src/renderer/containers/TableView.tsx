import * as React from 'react';
import {State, TableViewDataState, ResourceState} from "../state";
import {connect, Dispatch} from "react-redux";
import {ViewState} from "../components/ViewState";
import {Button, Spinner} from "@blueprintjs/core";
import {Cell, Column, Table} from "@blueprintjs/table";
import {Select} from "../components/Select";
import * as assert from "../../common/assert";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {NO_TABLE_DATA} from "../messages";


interface ITableViewOwnProps {
    view: ViewState<TableViewDataState>;
}

interface ITableViewProps {
    viewId: string;
    viewData: TableViewDataState,
    resources: ResourceState[];
    resNames: string[];
}

function mapStateToProps(state: State, ownProps: ITableViewOwnProps): ITableViewProps {
    return {
        viewId: ownProps.view.id,
        viewData: ownProps.view.data,
        resources: selectors.resourcesSelector(state),
        resNames: selectors.resourceNamesSelector(state),
    };
}

interface ITableViewDispatch {
    dispatch: Dispatch<State>;
}

/**
 * This component displays a 2D map with a number of layers.
 */
class TableView extends React.Component<ITableViewProps & ITableViewDispatch, null> {
    static readonly CONTAINER_STYLE = {width: '100%', maxWidth: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column'};
    static readonly ACTION_ITEM_STYLE = {padding: '0.2em'};
    static readonly ACTION_GROUP_STYLE = {display: 'flex'};

    constructor(props: ITableViewProps, context: any) {
        super(props, context);
        this.onResourceNameChange = this.onResourceNameChange.bind(this);
        this.onVariableNameChange = this.onVariableNameChange.bind(this);
        this.onLoadTableViewData = this.onLoadTableViewData.bind(this);
    }

    onResourceNameChange(resName: string | null) {
        this.props.dispatch(actions.updateTableViewData(this.props.viewId, resName, this.props.viewData.varName, null));
    }

    onVariableNameChange(varName: string | null) {
        this.props.dispatch(actions.updateTableViewData(this.props.viewId, this.props.viewData.resName, varName, null));
    }

    onLoadTableViewData() {
        this.props.dispatch(actions.loadTableViewData(this.props.viewId, this.props.viewData.resName, this.props.viewData.varName));
    }

    render() {
        return (
            <div style={TableView.CONTAINER_STYLE}>
                <div style={TableView.ACTION_GROUP_STYLE}>
                    {this.renderResourceSelector()}
                    {this.renderVariableSelector()}
                    {this.renderLoadDataAction()}
                </div>
                {this.renderDataTable()}
            </div>
        );
    }

    renderDataTable() {
        const viewData = this.props.viewData;
        assert.ok(viewData);

        if (viewData.isLoading) {
            return (
                <div style={TableView.CONTAINER_STYLE}>
                    <Spinner className="pt-large"/>
                    <p>Loading table data...</p>
                </div>
            );
        }

        const dataRows = viewData.dataRows;
        if (!dataRows || !dataRows.length) {
            return NO_TABLE_DATA;
        }

        const firstRow = dataRows[0];
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>', firstRow);
        const columnNames = Object.getOwnPropertyNames(firstRow).filter(name => name !== '');

        const getData = (row: number, col: number) => {
            return dataRows[row][columnNames[col]];
        };

        const children = [];
        for (let i in columnNames) {
            const renderCell = (row: number, col: number) => {
                return (<Cell>{getData(row, col)}</Cell>);
            };
            children.push(<Column key={i} name={columnNames[i]} renderCell={renderCell}/>);
        }

        return (<Table numRows={dataRows.length}
                       isRowHeaderShown={true}
                       getCellClipboardData={getData}
                       children={children as any}/>);
    }

    renderResourceSelector() {
        return (<Select values={this.props.resNames}
                        value={this.props.viewData.resName}
                        onChange={this.onResourceNameChange}
                        nullable={true}
                        nullLabel="Select Resource..."
                        style={TableView.ACTION_ITEM_STYLE}/>);
    }

    renderVariableSelector() {
        const resource = this.props.resources.find(r => r.name === this.props.viewData.resName);
        const variables = resource && resource.variables;
        const varNames = variables ? variables.map(v => v.name) : selectors.EMPTY_ARRAY;
        return (<Select values={varNames}
                        value={this.props.viewData.varName}
                        onChange={this.onVariableNameChange}
                        nullable={true}
                        nullLabel="<Show All Variables>"
                        style={TableView.ACTION_ITEM_STYLE}/>);
    }

    renderLoadDataAction() {
        const hasData = !!(this.props.viewData.dataRows);
        return (<div style={TableView.ACTION_ITEM_STYLE}>
            <Button iconName="download"
                    onClick={this.onLoadTableViewData}
                    disabled={hasData}>Load Data</Button>
        </div>);
    }
}

export default connect(mapStateToProps)(TableView);

