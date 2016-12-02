import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, DataSourceState, DataStoreState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedDataStoreIndex, updateDataSources, setSelectedDataSourceIndex} from '../actions'
import {DatasetAPI} from '../webapi';
import {SplitPane} from "../containers/SplitPane";


function mapStateToProps(state: State) {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        dataStores: state.data.dataStores,
        selectedDataStoreIndex: state.control.selectedDataStoreIndex,
        selectedDataSourceIndex: state.control.selectedDataSourceIndex,
    };
}


/**
 * The DatasetsPanel is used to select data stores, browse and select their data sources and to view the details of a
 * data source.
 *
 * @author Norman Fomferra
 */
class DatasetsPanel extends React.Component<any, any> {

    render() {
        const dataStores = this.props.dataStores;
        if (!dataStores || !dataStores.length) {
            return <p>No data stores found.</p>;
        }

        let selectedDataStoreIndex = this.props.selectedDataStoreIndex;
        let selectedDataSourceIndex = this.props.selectedDataSourceIndex;

        let dataSources;
        if (selectedDataStoreIndex >= 0) {
            dataSources = dataStores[selectedDataStoreIndex].dataSources;
        } else {
            selectedDataStoreIndex = null;
        }

        let selectedDataSource;
        if (dataSources && selectedDataSourceIndex >= 0) {
            selectedDataSource = dataSources[selectedDataSourceIndex];
        }

        const dataStoreSelector = this.renderDataStoreSelector(dataStores, selectedDataStoreIndex);
        const dataSourcesTable = this.renderDataSourcesTable(dataSources);
        const dataSourceDetailsCard = this.renderDataSourceDetails(selectedDataSource);

        return (
            <ExpansionPanel icon="pt-icon-database" text="Datasets" isExpanded={true} defaultHeight={400}>
                {dataStoreSelector}
                <SplitPane direction="ver" initialSize={200}>
                    {dataSourcesTable}
                    {dataSourceDetailsCard}
                </SplitPane>
            </ExpansionPanel>
        );
    }

    private renderDataStoreSelector(dataStores: Array<DataStoreState>, selectedDataStoreIndex: number) {
        const dataStoreOptions = [];
        for (let i = 0; i < dataStores.length; i++) {
            const dataStore = dataStores[i];
            dataStoreOptions.push(<option key={i} value={i}>{dataStore.name}</option>);
        }

        const handleDataStoreSelection = event => {
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
            <label className="pt-label pt-inline">
                Data store:
                <div className="pt-select" style={{float:'right'}}>
                    <select value={selectedDataStoreIndex >= 0 ? selectedDataStoreIndex : ''}
                            onChange={handleDataStoreSelection.bind(this)}>
                        {dataStoreOptions}
                    </select>
                </div>
            </label>
        );
    }

    private renderDataSourcesTable(dataSources: Array<DataSourceState>) {
        if (!dataSources) {
            return null;
        }

        const renderDataSourceNameCell = (rowIndex: number) => {
            const dataSource = dataSources[rowIndex];
            return <Cell>{dataSource.name}</Cell>
        };

        const handleDataSourceSelection = (selectedRegions: IRegion[]) => {
            let selectedDataSourceIndex;
            if (selectedRegions && selectedRegions.length > 0 && selectedRegions[0].rows) {
                selectedDataSourceIndex = selectedRegions[0].rows[0];
            } else {
                selectedDataSourceIndex = -1;
            }
            if (this.props.selectedDataSourceIndex !== selectedDataSourceIndex) {
                this.props.dispatch(setSelectedDataSourceIndex(selectedDataSourceIndex));
            }
        };

        return (
            <Table numRows={dataSources.length}
                   allowMultipleSelection={false}
                   selectionModes={SelectionModes.ROWS_AND_CELLS}
                   isRowHeaderShown={false}
                   isColumnResizable={false}
                   isRowResizable={false}
                   onSelection={handleDataSourceSelection.bind(this)}
                   defaultColumnWidth={400}>
                <Column name="Datasets" renderCell={renderDataSourceNameCell}/>
            </Table>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderDataSourceDetails(dataSource: DataSourceState) {
        let title = "No selection";
        let description = null;
        if (dataSource) {
            title = dataSource.name;

            if (dataSource.description) {
                description = (<p><i>{dataSource.description}</i></p>);
            }
        }

        return (
            <div style={{padding: 6, overflowY: 'auto'}}>
                <div className="pt-card pt-elevation-2">
                    <h5>{title}</h5>
                    {description}
                </div>
            </div>);
    }

}

export default connect(mapStateToProps)(DatasetsPanel);
