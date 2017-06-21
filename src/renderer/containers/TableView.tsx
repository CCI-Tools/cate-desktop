import * as React from 'react';
import {State, TableViewDataState, ResourceState} from "../state";
import {connect, Dispatch} from "react-redux";
import {ViewState} from "../components/ViewState";
import {Spinner} from "@blueprintjs/core";
import {Cell, Column, Table} from "@blueprintjs/table";
import * as assert from "../../common/assert";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {LOADING_TABLE_DATA_FAILED, NO_TABLE_DATA} from "../messages";

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
class TableView extends React.PureComponent<ITableViewProps & ITableViewOwnProps & ITableViewDispatch, null> {
    static readonly TABLE_CONTAINER_STYLE = {width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column'};
    static readonly LOADING_CONTAINER_STYLE = {width: '100%', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' as any};
    static readonly ACTION_ITEM_STYLE = {padding: '0.2em'};
    static readonly ACTION_GROUP_STYLE = {display: 'flex'};

    constructor(props: ITableViewProps, context: any) {
        super(props, context);
    }

    componentWillMount(): void {
        const viewData = this.props.viewData;
        if (!viewData.dataRows && !viewData.isLoading && !viewData.error) {
            this.props.dispatch(actions.loadTableViewData(this.props.viewId, viewData.resName, viewData.varName));
        }
    }

    render() {
        console.log("render, render!");
        return (
            <div style={TableView.TABLE_CONTAINER_STYLE}>
                {this.renderDataTable()}
            </div>
        );
    }

    renderDataTable() {
        const viewData = this.props.viewData;
        assert.ok(viewData);

        if (viewData.isLoading) {
            return (
                <div style={TableView.LOADING_CONTAINER_STYLE}>
                    <Spinner className="pt-large"/>
                    <p>Loading table data...</p>
                </div>
            );
        }

        if (viewData.error) {
            return LOADING_TABLE_DATA_FAILED(viewData.error);
        }

        const dataRows = viewData.dataRows;
        if (!dataRows || !dataRows.length) {
            return NO_TABLE_DATA;
        }

        const firstRow = dataRows[0];
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>', firstRow);
        const columnNames = Object.getOwnPropertyNames(firstRow).filter(name => name !== '');
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>', columnNames);

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
}

export default connect(mapStateToProps)(TableView);

