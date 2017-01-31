import * as React from "react";
import {connect, Dispatch} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, DataStoreState, WorkspaceState, DataSourceState} from "../state";
import {Tabs, TabList, Tab, TabPanel, Button, InputGroup, Classes, Tag, NumberRange} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import {OpenDatasetDialog, IOpenDatasetDialogState} from "./OpenDatasetDialog";
import * as actions from "../actions";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";

interface IDataSourcesPanelProps {
    webAPIClient: any;
    workspace: WorkspaceState;
    dataStores: Array<DataStoreState>;
    selectedDataStoreId: string|null;
    selectedDataSourceId: string|null;
    dataSourceFilterExpr: string;
    showDataSourceDetails: boolean;
    openDatasetDialogState: IOpenDatasetDialogState;
}

function mapStateToProps(state: State): IDataSourcesPanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        workspace: state.data.workspace,
        dataStores: state.data.dataStores,
        selectedDataStoreId: state.control.selectedDataStoreId,
        selectedDataSourceId: state.control.selectedDataSourceId,
        dataSourceFilterExpr: state.control.dataSourceFilterExpr,
        showDataSourceDetails: state.control.showDataSourceDetails,
        openDatasetDialogState: (state.control.dialogs[OpenDatasetDialog.DIALOG_ID] || {}) as IOpenDatasetDialogState
    };
}

interface IDataSourcesPanelDispatch {
    setSelectedDataStoreId(selectedDataStoreId: string): void;
    setSelectedDataSourceId(selectedDataSourceId: string): void;
    setDataSourceFilterExpr(dataSourceFilterExpr: string): void;
    setControlState(propertyName: string, value: any): void;
    showOpenDatasetDialog(dataStoreId: string, dataSourceId: string, loadTimeInfo: boolean): void;
    confirmOpenDatasetDialog(dataSourceId: string, timeRange: NumberRange): void;
    cancelOpenDatasetDialog(): void;
}

const mapDispatchToProps = {
    setSelectedDataStoreId: actions.setSelectedDataStoreId,
    setSelectedDataSourceId: actions.setSelectedDataSourceId,
    setDataSourceFilterExpr: actions.setDataSourceFilterExpr,
    setControlState: actions.setControlState,
    showOpenDatasetDialog: actions.showOpenDatasetDialog,
    confirmOpenDatasetDialog: actions.confirmOpenDatasetDialog,
    cancelOpenDatasetDialog: actions.cancelOpenDatasetDialog,
};

/**
 * The DataSourcesPanel is used browse and open data data sources originating from a selected data store.
 *
 * @author Norman Fomferra
 */
class DataSourcesPanel extends React.Component<IDataSourcesPanelProps & IDataSourcesPanelDispatch, null> {

    constructor(props: IDataSourcesPanelProps) {
        super(props);
    }

    private handleShowOpenDatasetDialog() {
        const selectedDataSource = this.getSelectedDataSource();
        this.props.showOpenDatasetDialog(
            this.props.selectedDataStoreId,
            this.props.selectedDataSourceId,
            !selectedDataSource.temporalCoverage
        );
    }

    private handleDataStoreSelected(event) {
        const dataStoreId = event.target.value;
        this.props.setSelectedDataStoreId(dataStoreId);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.setControlState('showDataSourceDetails', value);
    }

    private getSelectedDataStore(): DataStoreState|null {
        if (!this.props.dataStores || !this.props.selectedDataStoreId) {
            return null;
        }
        return this.props.dataStores.find(dataStore => dataStore.id === this.props.selectedDataStoreId);
    }

    private getDataSourcesOfSelectedDataStore(): Array<DataSourceState>|null {
        const selectedDataStore = this.getSelectedDataStore();
        return (selectedDataStore && selectedDataStore.dataSources) || null;
    }

    private getSelectedDataSource(): DataSourceState|null {
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
        const allDataStores = this.props.dataStores;
        const hasDataStores = allDataStores && allDataStores.length;

        const allDataSources = this.getDataSourcesOfSelectedDataStore();
        const hasDataSources = allDataSources && allDataSources.length;

        if (hasDataStores && hasDataSources) {

            const dataSourceFilterExpr = this.props.dataSourceFilterExpr;
            const dataSourceFilterExprLC = dataSourceFilterExpr ? dataSourceFilterExpr.toLowerCase() : null;

            const nameMatches = ds => !dataSourceFilterExprLC || ds.name.toLowerCase().includes(dataSourceFilterExprLC);
            const filteredDataSources = !dataSourceFilterExpr
                ? allDataSources
                : allDataSources.filter(ds => nameMatches(ds));

            const resultsTag = (
                <Tag className={Classes.MINIMAL}>
                    {filteredDataSources.length}
                </Tag>
            );

            const dataSourceFilterExprInput = (<InputGroup
                disabled={false}
                leftIconName="filter"
                onChange={(event) => this.props.setDataSourceFilterExpr(event.target.value)}
                placeholder="Find data source"
                rightElement={resultsTag}
                value={dataSourceFilterExpr}
            />);
            // {...this.props.openDatasetDialogState}
            let openDatasetDialog = null;
            if (this.props.openDatasetDialogState.isOpen) {
                const dataSource = this.getSelectedDataSource();

                openDatasetDialog = (
                    <OpenDatasetDialog
                        dataSource={dataSource}
                        coveredTimeRange={dataSource.temporalCoverage}
                        onConfirm={this.props.confirmOpenDatasetDialog}
                        onCancel={this.props.cancelOpenDatasetDialog}/>
                );
            }

            const actionComponent = (
                <div>
                    <Button className="pt-intent-primary"
                            onClick={this.handleShowOpenDatasetDialog.bind(this)}
                            disabled={!this.props.selectedDataSourceId || !this.props.workspace}
                            iconName="folder-shared-open">Open...</Button>
                    {openDatasetDialog}
                </div>
            );

            return (
                <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                    {this.renderDataStoreSelector()}
                    <div style={{paddingBottom: '0.1em'}}>{dataSourceFilterExprInput}</div>
                    <ContentWithDetailsPanel showDetails={this.props.showDataSourceDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged.bind(this)}
                                             isSplitPanel={true}
                                             initialContentHeight={200}
                                             actionComponent={actionComponent}>
                        <DataSourcesList dataSources={filteredDataSources}
                                         selectedDataSourceId={this.props.selectedDataSourceId}
                                         setSelectedDataSourceId={this.props.setSelectedDataSourceId}/>
                        <DataSourceDetails dataSource={this.getSelectedDataSource()}/>
                    </ContentWithDetailsPanel>
                </ExpansionPanel>
            );
        } else if (hasDataStores) {
            return (
                <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                    {this.renderDataStoreSelector()}
                    {this.renderNoDataSourcesMessage()}
                </ExpansionPanel>
            );
        } else {
            return (
                <ExpansionPanel icon="pt-icon-database" text="Data Sources" isExpanded={true} defaultHeight={400}>
                    {this.renderNoDataStoreMessage()}
                </ExpansionPanel>
            );
        }
    }

    private renderDataStoreSelector() {
        if (!this.props.dataStores || !this.props.dataStores.length) {
            return null;
        }

        const dataStoreOptions = [];
        for (let dataStore of this.props.dataStores) {
            dataStoreOptions.push(<option key={dataStore.id} value={dataStore.id}>{dataStore.name}</option>);
        }

        return (
            <label className="pt-label pt-inline">
                Data store:
                <div className="pt-select" style={{padding: '0.2em'}}>
                    <select value={this.props.selectedDataStoreId || ''}
                            onChange={this.handleDataStoreSelected.bind(this)}>
                        {dataStoreOptions}
                    </select>
                </div>
            </label>
        );
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

interface IDataSourcesListProps {
    dataSources: Array<DataSourceState>;
    selectedDataSourceId: string|null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
}
class DataSourcesList extends React.Component<IDataSourcesListProps, null> {

    readonly defaultIconName = 'cci';

    constructor(props: IDataSourcesListProps) {
        super(props);
        this.renderItem = this.renderItem.bind(this);
        this.handleDataSourceSelected = this.handleDataSourceSelected.bind(this);
        this.handleIconLoadError = this.handleIconLoadError.bind(this);
    }

    private handleDataSourceSelected(oldSelection: Array<React.Key>, newSelection: Array<React.Key>) {
        if (newSelection.length > 0) {
            this.props.setSelectedDataSourceId(newSelection[0] as string);
        } else {
            this.props.setSelectedDataSourceId(null);
        }
    }

    private handleIconLoadError(img) {
        img.onError = null;
        img.src = `resources/images/data-sources/esacci/${this.defaultIconName}.png`;
    }

    private renderItem(itemIndex: number) {
        const dataSource = this.props.dataSources[itemIndex];
        // TODO (forman): compute icon size based on screen resolution
        const imageSize = 32;
        const iconName = ((dataSource.meta_info && dataSource.meta_info.cci_project) || 'cci').toLowerCase();
        const displayName = dataSource.name.replace('esacci', '').replace(/\./g, ' ');
        return (
            <div style={{display:'flex', alignItems: 'center'}}>
                <img src={`resources/images/data-sources/esacci/${iconName}.png`}
                     style={{width: imageSize, height: imageSize, flex: 'none', marginRight: 6}}
                     onError={this.handleIconLoadError}/>
                <span>{displayName}</span>
            </div>
        );
    }

    render() {
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={this.props.dataSources.length}
                         getItemKey={index => this.props.dataSources[index].id}
                         renderItem={this.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedDataSourceId ? [this.props.selectedDataSourceId] : []}
                         onSelection={this.handleDataSourceSelected}/>
            </div>
        );
    }
}

interface IDataSourceDetailsProps {
    dataSource: DataSourceState
}
class DataSourceDetails extends React.Component<IDataSourceDetailsProps, null> {

    render() {
        const dataSource = this.props.dataSource;
        if (!dataSource) {
            return null;
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
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourcesPanel);
