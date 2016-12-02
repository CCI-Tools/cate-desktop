import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State} from "../state";
import {Table, Column, Cell, SelectionModes} from "@blueprintjs/table";
import {setSelectedDataStoreIndex, updateDataSources} from '../actions'
import {DatasetAPI} from '../webapi';

/**
 * The DatasetsPanel is used to select data stores, browse and select their data sources and to view the details of a
 * data source.
 *
 * @author Norman Fomferra
 */
@connect(
    (state: State) => {
        return {
            webAPIClient: state.data.appConfig.webAPIClient,
            dataStores: state.data.dataStores,
            selectedDataStoreIndex: state.control.selectedDataStoreIndex,
        };
    })
export class DatasetsPanel extends React.Component<any, any> {

    render() {
        const dataStores = this.props.dataStores;
        if (!dataStores || !dataStores.length) {
            return <p>No data stores available</p>;
        }

        let selectedDataStoreIndex = this.props.selectedDataStoreIndex;

        let dataSources;
        if (selectedDataStoreIndex >= 0) {
            dataSources = dataStores[selectedDataStoreIndex].dataSources;
        } else {
            selectedDataStoreIndex = null;
        }

        const options = [];
        for (let i = 0; i < dataStores.length; i++) {
            const dataStore = dataStores[i];
            options.push(<option key={i} value={i}>{dataStore.name}</option>);
        }

        let table = null;
        if (dataSources) {
            const renderCell = (rowIndex: number) => {
                return <Cell>{dataSources[rowIndex].name}</Cell>
            };
            table = (
                <Table numRows={dataSources.length}
                       selectionModes={SelectionModes.ROWS_AND_CELLS}
                       isRowHeaderShown={false}
                       isColumnResizable={false}
                       isRowResizable={false}>
                    <Column name="Datasets" renderCell={renderCell}/>
                </Table>
            );
        }

        const selectHandler = event => {
            const selectedDataStoreIndex = parseInt(event.target.value);
            // console.log('selectHandler', selectedIndex);
            this.props.dispatch(setSelectedDataStoreIndex(selectedDataStoreIndex));
            const dataStore = this.props.dataStores[selectedDataStoreIndex];
            const dataSources = dataStore.dataSources;
            if (!dataSources) {
                const datasetAPI = new DatasetAPI(this.props.webAPIClient);
                datasetAPI.getDataSources(dataStore.id).then(dataSources => {
                    this.props.dispatch(updateDataSources(selectedDataStoreIndex, dataSources));
                }).catch(error => {
                    // ???
                });
            }
        };

        return (
            <ExpansionPanel icon="pt-icon-database" text="Datasets" isExpanded={true} defaultHeight="20em">
                <label className="pt-label pt-inline">
                    Data store:
                    <div className="pt-select" style={{float:'right'}}>
                        <select value={selectedDataStoreIndex || ''} onChange={selectHandler.bind(this)}>
                            {options}
                        </select>
                    </div>
                </label>
                {table}
            </ExpansionPanel>
        );
    }
}

