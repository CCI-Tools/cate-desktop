import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, DataSourceState, DataStoreState} from "../state";
import {Table, Column, Cell, SelectionModes, IRegion} from "@blueprintjs/table";
import {setSelectedDataStoreId, updateDataSources, setSelectedDataSourceId} from '../actions'
import {DatasetAPI} from '../webapi';
import {SplitPane} from "../containers/SplitPane";
import {Tabs, TabList, Tab, TabPanel, Button} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "./ListBox";
import {Card} from "./Card";

interface IDataSourcesPanelProps {
    dispatch?: (action: {type: string, payload: any}) => void;
    webAPIClient: any;
    dataStores: Array<DataStoreState>;
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;
}

function mapStateToProps(state: State): IDataSourcesPanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        dataStores: state.data.dataStores,
        selectedDataStoreId: state.control.selectedDataStoreId,
        selectedDataSourceId: state.control.selectedDataSourceId,
    };
}

/**
 * The DataSourcesPanel is used browse and open data data sources originating from a selected data store.
 *
 * @author Norman Fomferra
 */
class DataSourcesPanel extends React.Component<IDataSourcesPanelProps, null> {

    render() {
        const dataStores = this.props.dataStores || [];
        const selectedDataStoreId = this.props.selectedDataStoreId;
        const selectedDataSourceId = this.props.selectedDataSourceId;

        let dataStore;
        let dataSources;
        if (selectedDataStoreId) {
            dataStore = dataStores.find(dataStore => dataStore.id === selectedDataStoreId);
            if (dataStore) {
                dataSources = dataStore.dataSources;
            }
        }

        let dataSource;
        if (dataSources && selectedDataSourceId) {
            dataSource = dataSources.find(dataSource => dataSource.id === selectedDataSourceId);
        }

        if (dataStores && dataStores.length) {
            const dataStoreSelector = this.renderDataStoreSelector(dataStores, selectedDataStoreId);
            const dataSourcesList = this.renderDataSourcesList(dataSources, selectedDataSourceId);

            let dataSourcesPane;
            if (dataSourcesList) {
                const dataSourceDetailsCard = this.renderDataSourceDetails(dataSource);
                dataSourcesPane = (
                    <SplitPane direction="ver" initialSize={200}>
                        {dataSourcesList}
                        {dataSourceDetailsCard}
                    </SplitPane>
                );
            } else {
                dataSourcesPane = this.renderNoDataSourcesMessage();
            }

            return (
                <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                    {dataStoreSelector}
                    {dataSourcesPane}
                </ExpansionPanel>
            );
        } else {
            const noDataStoreMessage = this.renderNoDataStoreMessage();
            return (
                <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                    {noDataStoreMessage}
                </ExpansionPanel>
            );
        }
    }

    private renderDataSourcesList(dataSources: Array<DataSourceState>, selectedDataSourceId: string) {
        if (!dataSources || !dataSources.length) {
            return null;
        }

        const defaultIconName = 'cci';

        const handleIconLoadError = img => {
            img.onError = null;
            img.src = `resources/images/data-sources/esacci/${defaultIconName}.png`;
        };

        const renderItem = (itemIndex: number) => {
            const dataSource = dataSources[itemIndex];
            // TODO: compute icon size based on screen resolution
            const imageSize = 32;
            const iconName = ((dataSource.meta_info && dataSource.meta_info.cci_project) || 'cci').toLowerCase();
            const displayName = dataSource.name.replace('esacci', '').replace(/\./g, ' ');
            return (
                <div style={{display:'flex', alignItems: 'center'}}>
                    <img src={`resources/images/data-sources/esacci/${iconName}.png`}
                         style={{width: imageSize, height: imageSize, flex: 'none', marginRight: 6}}
                         onError={handleIconLoadError}/>
                    <span>{displayName}</span>
                </div>
            );
        };

        const handleDataSourceSelection = (oldSelection: Array<React.Key>, newSelection: Array<React.Key>) => {
            if (newSelection.length > 0) {
                this.props.dispatch(setSelectedDataSourceId(newSelection[0] as string));
            } else {
                this.props.dispatch(setSelectedDataSourceId(null));
            }
        };

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={dataSources.length}
                         getItemKey={index => dataSources[index].id}
                         renderItem={renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={selectedDataSourceId ? [selectedDataSourceId] : []}
                         onSelection={handleDataSourceSelection.bind(this)}/>
            </div>
        );
    }

    private renderDataStoreSelector(dataStores: Array<DataStoreState>, selectedDataStoreId: string) {
        const dataStoreOptions = [];
        for (let dataStore of dataStores) {
            dataStoreOptions.push(<option key={dataStore.id} value={dataStore.id}>{dataStore.name}</option>);
        }

        const handleOpenButtonClicked = () => {
            console.log('now opening: ', this.props.selectedDataSourceId);
        };


        const handleDataStoreSelection = event => {
            const dataStoreId = event.target.value;
            this.props.dispatch(setSelectedDataStoreId(dataStoreId));
            if (!dataStoreId) {
                return;
            }

            const dataStore = this.props.dataStores.find(dataStore => dataStore.id === dataStoreId);
            if (!dataStore.dataSources) {
                // TODO: before calling into datasetAPI, check if we have a call in progress
                const datasetAPI = new DatasetAPI(this.props.webAPIClient);
                datasetAPI.getDataSources(dataStore.id).then(dataSources => {
                    this.props.dispatch(updateDataSources(dataStore.id, dataSources));
                }).catch(error => {
                    // TODO: handle error
                });
            } else {
                this.props.dispatch(setSelectedDataSourceId(dataStore.dataSources.length ? dataStore.dataSources[0].id : null));
            }
        };

        return (
            <div style={{display: 'flex', marginBottom: 4, alignItems: 'center'}}>
                <span>Store </span>
                <div className="pt-select" style={{flex: 'auto'}}>
                    <select value={selectedDataStoreId || ''}
                            onChange={handleDataStoreSelection.bind(this)}>
                        {dataStoreOptions}
                    </select>
                </div>
                <Button className="pt-intent-success"
                        onClick={handleOpenButtonClicked.bind(this)}
                        disabled={!this.props.selectedDataSourceId}
                        iconName="add">Open</Button>
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderDataSourceDetails(dataSource: DataSourceState) {
        if (!dataSource) {
            return (
                <Card>
                    <p>No data source selected.</p>
                </Card>
            );
        }
        let metaInfo = null;
        let variables = null;
        if (dataSource.meta_info) {
            const metaInfoItems = Object.keys(dataSource.meta_info).filter(key => key !== 'variables').map(key => {
                const value = dataSource.meta_info[key];
                return (<tr key={key}>
                    <td>{key}</td>
                    <td>{value}</td>
                </tr>);
            });
            if (metaInfoItems.length > 0) {
                metaInfo = (
                    <table className="pt-table pt-condensed pt-striped">
                        <thead>
                        <tr>
                            <th>Key</th>
                            <th>Value</th>
                        </tr>
                        </thead>
                        <tbody>{metaInfoItems}</tbody>
                    </table>
                );
            }
            if (dataSource.meta_info.variables) {
                const variableItems = dataSource.meta_info.variables.map(variable => {
                    return (<tr key={variable.name}>
                        <td>{variable.name}</td>
                        <td>{variable.units || '-'}</td>
                    </tr>);
                });
                if (variableItems.length > 0) {
                    variables = (
                        <table className="pt-table pt-condensed pt-striped">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Units</th>
                            </tr>
                            </thead>
                            <tbody>{variableItems}</tbody>
                        </table>
                    );
                }
            }
        }

        let metaInfoPanel;
        if (metaInfo) {
            metaInfoPanel = (<Card>{metaInfo}</Card>);
        }

        let variablesPanel;
        if (variables) {
            variablesPanel = (<Card>{variables}</Card>);
        }

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
                <Card>
                    <p>No meta-information available.</p>
                </Card>
            );
        }
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataStoreMessage() {
        return (
            <Card>
                <p><strong>No data stores found!</strong></p>
                <p>
                    This is very likely a configuration error,
                    please check the logs of the Cate WebAPI service.
                </p>
            </Card>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataSourcesMessage() {
        return (
            <Card>
                <p><strong>No data sources found!</strong></p>
                <p>
                    This is very likely a configuration error,
                    please check the logs of the Cate WebAPI service.
                </p>
            </Card>
        );
    }
}

export default connect(mapStateToProps)(DataSourcesPanel);
