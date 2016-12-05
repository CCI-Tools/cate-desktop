import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, DataSourceState, DataStoreState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedDataStoreIndex, updateDataSources, setSelectedDataSourceIndex} from '../actions'
import {DatasetAPI} from '../webapi';
import {SplitPane} from "../containers/SplitPane";
import {Tabs, TabList, Tab, TabPanel} from "@blueprintjs/core";


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
        const dataStores = this.props.dataStores || [];
        let selectedDataStoreIndex = this.props.selectedDataStoreIndex;
        let selectedDataSourceIndex = this.props.selectedDataSourceIndex;

        let dataSources;
        if (selectedDataStoreIndex >= 0 && selectedDataStoreIndex < dataStores.length) {
            dataSources = dataStores[selectedDataStoreIndex].dataSources;
        } else {
            selectedDataStoreIndex = null;
        }
        if (!dataSources) {
            dataSources = [];
        }

        let selectedDataSource;
        if (selectedDataSourceIndex >= 0 && selectedDataSourceIndex < dataSources.length) {
            selectedDataSource = dataSources[selectedDataSourceIndex];
        }

        if (dataStores.length > 0) {
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
        } else {
            const noDataStoreMessage = this.renderNoDataStoreMessage();
            return (
                <ExpansionPanel icon="pt-icon-database" text="Datasets" isExpanded={true} defaultHeight={400}>
                    {noDataStoreMessage}
                </ExpansionPanel>
            );
        }
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
        if (!dataSource) {
            return (
                <div style={{padding: 6, overflow: 'auto'}}>
                    <div className="pt-card pt-elevation-2">
                        <p>No data source selected.</p>
                    </div>
                </div>
            );
        }
        let metaInfo = null;
        let variables = null;
        if (dataSource.meta_info) {
            const metaInfoItems = Object.keys(dataSource.meta_info).filter(key => key !== 'variables').map(key => {
                const value = dataSource.meta_info[key];
                return (<tr>
                    <td>{key}</td>
                    <td>{value}</td>
                </tr>);
            });
            if (metaInfoItems.length > 0) {
                metaInfo = (
                    <table className="pt-table pt-condensed pt-striped">
                        <thead>
                        <th>Key</th>
                        <th>Value</th>
                        </thead>
                        <tbody>{metaInfoItems}</tbody>
                    </table>
                );
            }
            if (dataSource.meta_info.variables) {
                const variableItems = Object.keys(dataSource.meta_info.variables).map(key => {
                    const value = dataSource.meta_info.variables[key];
                    return (<tr>
                        <td>{key}</td>
                        <td>{value.units || '-'}</td>
                    </tr>);
                });
                if (variableItems.length > 0) {
                    variables = (
                        <table className="pt-table pt-condensed pt-striped">
                            <thead>
                            <th>Name</th>
                            <th>Units</th>
                            </thead>
                            <tbody>{variableItems}</tbody>
                        </table>
                    );
                }
            }
        }

        let metaInfoPanel;
        if (metaInfo)
            metaInfoPanel = (
                <div style={{padding: 6, overflow: 'auto'}}>
                    <div className="pt-card pt-elevation-2">
                        {metaInfo}
                    </div>
                </div>
            );

        let variablesPanel;
        if (variables)
            variablesPanel = (
                <div style={{padding: 6, overflow: 'auto'}}>
                    <div className="pt-card pt-elevation-2">
                        {variables}
                    </div>
                </div>
            );

        if (metaInfoPanel && variablesPanel) {
            return (
                <Tabs>
                    <TabList>
                        <Tab>Variables</Tab>
                        <Tab>Meta-Info</Tab>
                    </TabList>
                    <TabPanel>
                        {variablesPanel}
                    </TabPanel>
                    <TabPanel>
                        {metaInfoPanel}
                    </TabPanel>
                </Tabs>
            );
        } else if (metaInfoPanel) {
            return metaInfoPanel;
        } else if (variablesPanel) {
            return variablesPanel;
        } else {
            return (
                <div style={{padding: 6, overflow: 'auto'}}>
                    <div className="pt-card pt-elevation-2">
                        <p>No meta-information available.</p>
                    </div>
                </div>
            );
        }
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataStoreMessage() {
        return (
            <div style={{padding: 6, overflow: 'auto'}}>
                <div className="pt-card pt-elevation-2">
                    <h5>No data stores found!</h5>
                    <p>This is very likely a configuration error, please check the logs of the Cate WebAPI service.</p>
                </div>
            </div>
        );
    }
}

export default connect(mapStateToProps)(DatasetsPanel);
