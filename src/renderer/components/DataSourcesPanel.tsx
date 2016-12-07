import * as React from 'react';
import {connect} from 'react-redux';
import {ExpansionPanel} from './ExpansionPanel';
import {State, DataStoreState} from "../state";
import {setSelectedDataStoreId, updateDataSources, setSelectedDataSourceId, setDialogState} from '../actions'
import {DatasetAPI} from '../webapi';
import {SplitPane} from "../containers/SplitPane";
import {Tabs, TabList, Tab, TabPanel, Button} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "./ListBox";
import {Card} from "./Card";
import {OpenDatasetDialog, IOpenDatasetDialogState} from "./OpenDatasetDialog";

interface IDataSourcesPanelProps {
    dispatch?: (action: {type: string, payload: any}) => void;
    webAPIClient: any;
    dataStores: Array<DataStoreState>;
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;
    openDatasetDialogState: IOpenDatasetDialogState;
}

function mapStateToProps(state: State): IDataSourcesPanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        dataStores: state.data.dataStores,
        selectedDataStoreId: state.control.selectedDataStoreId,
        selectedDataSourceId: state.control.selectedDataSourceId,
        openDatasetDialogState: state.control.dialogs['openDataset'] as IOpenDatasetDialogState
    };
}

/**
 * The DataSourcesPanel is used browse and open data data sources originating from a selected data store.
 *
 * @author Norman Fomferra
 */
class DataSourcesPanel extends React.Component<IDataSourcesPanelProps, null> {
    constructor(props: IDataSourcesPanelProps) {
        super(props);
    }

    private handleOpenDatasetButtonClicked() {
        this.props.dispatch(setDialogState('openDataset', {isOpen: true}));
    }

    private handleOpenDatasetDialogClosed(actionId: string, dialogState: IOpenDatasetDialogState) {
        this.props.dispatch(setDialogState('openDataset', dialogState));
        if (actionId) {
            console.log('now opening', this.props.selectedDataSourceId, 'with', dialogState, '...');
        }
    }

    private handleDataStoreSelected(event) {
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
    }

    private handleDataSourceSelected(oldSelection: Array<React.Key>, newSelection: Array<React.Key>) {
        if (newSelection.length > 0) {
            this.props.dispatch(setSelectedDataSourceId(newSelection[0] as string));
        } else {
            this.props.dispatch(setSelectedDataSourceId(null));
        }
    }

    private getSelectedDataStore() {
        if (!this.props.dataStores || !this.props.selectedDataStoreId) {
            return null;
        }
        return this.props.dataStores.find(dataStore => dataStore.id === this.props.selectedDataStoreId);
    }

    private getDataSourcesOfSelectedDataStore() {
        const selectedDataStore = this.getSelectedDataStore();
        return (selectedDataStore && selectedDataStore.dataSources) || null;
    }

    private getSelectedDataSource() {
        if (!this.props.selectedDataSourceId) {
            return null;
        }
        const dataSources = this.getDataSourcesOfSelectedDataStore();
        if (!dataSources) {
            return null;
        }
        return dataSources.find(dataSource => dataSource.id === this.props.selectedDataSourceId);

    }

    render() {
        let dataStoreSelector = this.renderDataStoreSelector();
        let dataSourcesList = this.renderDataSourcesList();

        let dataSourcesPane = null;
        if (dataStoreSelector && dataSourcesList) {
            const dataSourceDetailsCard = this.renderDataSourceDetails();
            dataSourcesPane = (
                <SplitPane direction="ver" initialSize={200}>
                    {dataSourcesList}
                    {dataSourceDetailsCard}
                </SplitPane>
            );
        } else if (dataStoreSelector) {
            dataSourcesPane = this.renderNoDataSourcesMessage();
        } else {
            dataStoreSelector = this.renderNoDataStoreMessage();
        }
        return (
            <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                {dataStoreSelector}
                {dataSourcesPane}
            </ExpansionPanel>
        );
    }

    private renderDataSourcesList() {
        const dataSources = this.getDataSourcesOfSelectedDataStore();
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

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={dataSources.length}
                         getItemKey={index => dataSources[index].id}
                         renderItem={renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedDataSourceId ? [this.props.selectedDataSourceId] : []}
                         onSelection={this.handleDataSourceSelected.bind(this)}/>
            </div>
        );
    }

    private renderDataStoreSelector() {
        if (!this.props.dataStores || !this.props.dataStores.length) {
            return null;
        }

        const dataStoreOptions = [];
        for (let dataStore of this.props.dataStores) {
            dataStoreOptions.push(<option key={dataStore.id} value={dataStore.id}>{dataStore.name}</option>);
        }

        let openDatasetDialog = null;
        if (this.props.openDatasetDialogState.isOpen) {
            const dataSource = this.getSelectedDataSource();
            openDatasetDialog = (
                <OpenDatasetDialog
                    dataSource={dataSource}
                    {...this.props.openDatasetDialogState}
                    onClose={this.handleOpenDatasetDialogClosed.bind(this)}/>
            );
        }

        return (
            <div style={{display: 'flex', marginBottom: 4, alignItems: 'center'}}>
                <span>Store </span>
                <div className="pt-select" style={{flex: 'auto'}}>
                    <select value={this.props.selectedDataStoreId || ''}
                            onChange={this.handleDataStoreSelected.bind(this)}>
                        {dataStoreOptions}
                    </select>
                </div>
                <Button className="pt-intent-success"
                        onClick={this.handleOpenDatasetButtonClicked.bind(this)}
                        disabled={!this.props.selectedDataSourceId}
                        iconName="add">Open</Button>
                {openDatasetDialog}
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderDataSourceDetails() {
        const dataSource = this.getSelectedDataSource();
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
