import * as React from "react";
import {connect} from "react-redux";
import {State, DataStoreState, DataSourceState} from "../state";
import {AnchorButton, InputGroup, Classes, Tag, Tabs2, Tab2, Tooltip} from "@blueprintjs/core";
import {Table, Column, Cell} from "@blueprintjs/table";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import DownloadDatasetDialog from "./DownloadDatasetDialog";
import OpenDatasetDialog from "./OpenDatasetDialog";
import AddDatasetDialog from "./AddDatasetDialog";
import RemoveDatasetDialog from "./RemoveDatasetDialog";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {NO_DATA_STORES_FOUND, NO_DATA_SOURCES_FOUND, NO_LOCAL_DATA_SOURCES} from "../messages";


interface IDataSourcesPanelProps {
    hasWorkspace: boolean;
    dataStores: Array<DataStoreState>;
    dataSourceFilterExpr: string;
    selectedDataStore: DataStoreState | null;
    selectedDataSource: DataSourceState | null;
    selectedDataSources: DataSourceState[] | null;
    filteredDataSources: DataSourceState[] | null;
    showDataSourceDetails: boolean;
}

function mapStateToProps(state: State): IDataSourcesPanelProps {
    return {
        hasWorkspace: !!selectors.workspaceSelector(state),
        dataStores: selectors.dataStoresSelector(state),
        dataSourceFilterExpr: selectors.dataSourceFilterExprSelector(state),
        selectedDataStore: selectors.selectedDataStoreSelector(state),
        selectedDataSource: selectors.selectedDataSourceSelector(state),
        selectedDataSources: selectors.selectedDataSourcesSelector(state),
        filteredDataSources: selectors.filteredDataSourcesSelector(state),
        showDataSourceDetails: selectors.showDataSourceDetailsSelector(state),
    };
}

interface IDataSourcesPanelDispatch {
    setSelectedDataStoreId(selectedDataStoreId: string): void;
    setSelectedDataSourceId(selectedDataSourceId: string): void;
    setDataSourceFilterExpr(dataSourceFilterExpr: string): void;
    setControlState(propertyName: string, value: any): void;
    loadTemporalCoverage(dataStoreId: string, dataSourceId: string): void;
    showDialog(dialogId: string): void;
    hideDialog(dialogId: string): void;
}

const mapDispatchToProps = {
    setSelectedDataStoreId: actions.setSelectedDataStoreId,
    setSelectedDataSourceId: actions.setSelectedDataSourceId,
    setDataSourceFilterExpr: actions.setDataSourceFilterExpr,
    setControlState: actions.setControlProperty,
    loadTemporalCoverage: actions.loadTemporalCoverage,
    showDialog: actions.showDialog,
    hideDialog: actions.hideDialog,
};

/**
 * The DataSourcesPanel is used browse and open data data sources originating from a selected data store.
 *
 * @author Norman Fomferra
 */
class DataSourcesPanel extends React.Component<IDataSourcesPanelProps & IDataSourcesPanelDispatch, null> {

    constructor(props: IDataSourcesPanelProps) {
        super(props);
        this.handleAddDatasetDialog = this.handleAddDatasetDialog.bind(this);
        this.handleRemoveDatasetDialog = this.handleRemoveDatasetDialog.bind(this);
        this.handleShowDownloadDatasetDialog = this.handleShowDownloadDatasetDialog.bind(this);
        this.handleShowOpenDatasetDialog = this.handleShowOpenDatasetDialog.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleDataStoreSelected = this.handleDataStoreSelected.bind(this);
    }

    private handleAddDatasetDialog() {
        this.props.showDialog('addDatasetDialog');
    }

    private handleRemoveDatasetDialog() {
        this.props.showDialog('removeDatasetDialog');
    }

    private handleShowDownloadDatasetDialog() {
        this.maybeLoadTemporalCoverage();
        this.props.showDialog('downloadDatasetDialog');
    }

    private handleShowOpenDatasetDialog() {
        this.maybeLoadTemporalCoverage();
        this.props.showDialog('openDatasetDialog');
    }

    private maybeLoadTemporalCoverage() {
        if (!this.props.selectedDataSource.temporalCoverage) {
            this.props.loadTemporalCoverage(this.props.selectedDataStore.id, this.props.selectedDataSource.id);
        }
    }

    private handleDataStoreSelected(event) {
        const dataStoreId = event.target.value;
        this.props.setSelectedDataStoreId(dataStoreId);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.setControlState('showDataSourceDetails', value);
    }

    render() {
        const hasDataStores = this.props.dataStores && this.props.dataStores.length;
        const hasDataSources = this.props.selectedDataSources && this.props.selectedDataSources.length;
        let body;
        if (hasDataStores) {
            const hasSelection = this.props.selectedDataSource;
            const isLocalStore = this.props.selectedDataStore && this.props.selectedDataStore.id === 'local';
            const isNonLocalStore = this.props.selectedDataStore && this.props.selectedDataStore.id !== 'local';
            const canAdd = isLocalStore;
            const canRemove = hasSelection && isLocalStore;
            const canDownload = hasSelection && !isLocalStore;
            const canOpen = hasSelection && this.props.hasWorkspace;
            const actionComponent = (
                <div className="pt-button-group">
                    <Tooltip content="Add local data source">
                        <AnchorButton className={(isLocalStore && !hasDataSources) ? "pt-intent-primary" : ""}
                                      onClick={this.handleAddDatasetDialog}
                                      disabled={!canAdd}
                                      iconName="add"/>
                    </Tooltip>
                    <Tooltip content="Remove local data source">
                        <AnchorButton
                                      onClick={this.handleRemoveDatasetDialog}
                                      disabled={!canRemove}
                                      iconName="trash"/>
                    </Tooltip>
                    <Tooltip content="Make remote data source local">
                        <AnchorButton className={isNonLocalStore ? "pt-intent-primary" : ""}
                                      onClick={this.handleShowDownloadDatasetDialog}
                                      disabled={!canDownload}
                                      iconName="cloud-download"/>
                    </Tooltip>
                    <Tooltip content="Open data source">
                        <AnchorButton className={isLocalStore ? "pt-intent-primary" : ""}
                                      onClick={this.handleShowOpenDatasetDialog}
                                      disabled={!canOpen}
                                      iconName="folder-shared-open"/>
                    </Tooltip>
                    <AddDatasetDialog/>
                    <RemoveDatasetDialog/>
                    <DownloadDatasetDialog/>
                    <OpenDatasetDialog/>
                </div>
            );

            body = (
                <div>
                    {this.renderDataStoreSelector()}
                    {this.renderDataSourceFilterExprInput()}
                    <ContentWithDetailsPanel showDetails={this.props.showDataSourceDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged}
                                             isSplitPanel={true}
                                             initialContentHeight={200}
                                             actionComponent={actionComponent}>
                        <DataSourcesList dataSources={this.props.filteredDataSources}
                                         selectedDataSourceId={this.props.selectedDataSource ? this.props.selectedDataSource.id : null}
                                         setSelectedDataSourceId={this.props.setSelectedDataSourceId}
                                         doubleClickAction={isLocalStore ? this.handleShowOpenDatasetDialog : isNonLocalStore ? this.handleShowDownloadDatasetDialog : null}/>
                        <DataSourceDetails dataSource={this.props.selectedDataSource}/>
                    </ContentWithDetailsPanel>
                </div>
            );
        } else if (hasDataStores) {
            body = <div>
                {this.renderDataStoreSelector()}
                {this.renderNoDataSourcesMessage()}
            </div>;
        } else {
            body = this.renderNoDataStoreMessage();
        }
        return body;
    }

    private renderDataSourceFilterExprInput() {
        const resultsTag = (
            <Tag className={Classes.MINIMAL} onRemove={(event) => this.props.setDataSourceFilterExpr("")}>
                {this.props.filteredDataSources && this.props.filteredDataSources.length}
            </Tag>
        );

        return (<div style={{paddingTop: 4, paddingBottom: 2}}>
            <InputGroup
                disabled={false}
                leftIconName="filter"
                onChange={(event) => this.props.setDataSourceFilterExpr(event.target.value)}
                placeholder="Find data source"
                rightElement={resultsTag}
                value={this.props.dataSourceFilterExpr}
            />
        </div>);
    }

    private renderDataStoreSelector() {
        if (!this.props.dataStores || !this.props.dataStores.length) {
            return null;
        }

        const dataStoreOptions = [];
        for (let dataStore of this.props.dataStores) {
            dataStoreOptions.push(<option key={dataStore.id} value={dataStore.id}>{dataStore.name}</option>);
        }

        const selectedDataStore = this.props.selectedDataStore;
        //  a label has by default a 15px margin at the bottom
        return (
            <label className="pt-label pt-inline" style={{margin: "0 0 0 0"}}>
                Data store:
                <div className="pt-select" style={{padding: '0.2em'}}>
                    <select value={selectedDataStore ? selectedDataStore.id : ''}
                            onChange={this.handleDataStoreSelected}>
                        {dataStoreOptions}
                    </select>
                </div>
            </label>
        );
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataStoreMessage() {
        return NO_DATA_STORES_FOUND;
    }

    //noinspection JSMethodCanBeStatic
    private renderNoDataSourcesMessage() {
        const selectedDataStore = this.props.selectedDataStore;
        if (selectedDataStore && selectedDataStore.id === 'local') {
            return NO_LOCAL_DATA_SOURCES;
        } else {
            return NO_DATA_SOURCES_FOUND;
        }
    }
}

interface IDataSourcesListProps {
    dataSources: DataSourceState[];
    selectedDataSourceId: string | null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
    doubleClickAction: (dataSource: DataSourceState) => any;
}
class DataSourcesList extends React.PureComponent<IDataSourcesListProps, null> {

    readonly defaultIconName = 'cci';

    constructor(props: IDataSourcesListProps) {
        super(props);
        this.renderItem = this.renderItem.bind(this);
        this.handleDataSourceSelected = this.handleDataSourceSelected.bind(this);
        this.handleIconLoadError = this.handleIconLoadError.bind(this);
    }

    private handleDataSourceSelected(newSelection: Array<React.Key>) {
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

    private static getItemKey(dataSource: DataSourceState) {
        return dataSource.id;
    }

    private renderItem(dataSource: DataSourceState) {
        // TODO (forman): compute icon size based on screen resolution
        const imageSize = 32;
        const iconName = ((dataSource.meta_info && dataSource.meta_info.cci_project) || 'cci').toLowerCase();
        const displayName = dataSource.name.replace('esacci', '').replace(/\./g, ' ');
        return (
            <div style={{display: 'flex', alignItems: 'center'}}>
                <img src={`resources/images/data-sources/esacci/${iconName}.png`}
                     style={{width: imageSize, height: imageSize, flex: 'none', marginRight: 6}}
                     onError={this.handleIconLoadError}/>
                <span>{displayName}</span>
            </div>
        );
    }

    render() {
        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.dataSources}
                         getItemKey={DataSourcesList.getItemKey}
                         renderItem={this.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedDataSourceId}
                         onItemDoubleClick={this.props.doubleClickAction}
                         onSelection={this.handleDataSourceSelected}/>
            </ScrollablePanelContent>
        );
    }
}

interface IDataSourceDetailsProps {
    dataSource: DataSourceState
}
class DataSourceDetails extends React.PureComponent<IDataSourceDetailsProps, null> {

    render() {
        const dataSource = this.props.dataSource;
        if (!dataSource) {
            return null;
        }
        let metaInfoTable = null;
        let variablesTable = null;
        if (dataSource.meta_info) {
            const metaInfoKeys = Object.keys(dataSource.meta_info).filter(key => key !== 'variables');
            if (metaInfoKeys.length) {
                function renderKey(rowIndex: number) {
                    const key = metaInfoKeys[rowIndex];
                    return <Cell>{key}</Cell>;
                }

                function renderValue(rowIndex: number) {
                    const key = metaInfoKeys[rowIndex];
                    return <Cell>{dataSource.meta_info[key]}</Cell>;
                }

                function getCellClipboardData(row: number, col: number) {
                    console.log('getCellClipboardData: ', row, col);
                }

                metaInfoTable = (
                    <Table numRows={metaInfoKeys.length}
                           isRowHeaderShown={false}
                           getCellClipboardData={getCellClipboardData}>
                        <Column name="Key" renderCell={renderKey}/>
                        <Column name="Value" renderCell={renderValue}/>
                    </Table>
                );
            }
            const variables = dataSource.meta_info.variables;
            if (dataSource.meta_info.variables) {
                if (variables.length) {
                    function renderName(rowIndex: number) {
                        const variable = variables[rowIndex];
                        return <Cell>{variable.name}</Cell>;
                    }

                    function renderUnit(rowIndex: number) {
                        const variable = variables[rowIndex];
                        return <Cell>{variable.units || '-'}</Cell>;
                    }

                    function getCellClipboardData(row: number, col: number) {
                        console.log('getCellClipboardData: ', row, col);
                    }

                    variablesTable = (
                        <Table numRows={variables.length}
                               isRowHeaderShown={false}
                               getCellClipboardData={getCellClipboardData}>
                            <Column name="Name" renderCell={renderName}/>
                            <Column name="Units" renderCell={renderUnit}/>
                        </Table>
                    );
                }
            }
        }

        if (metaInfoTable && variablesTable) {
            return (

                <Tabs2 id="dsDetails" renderActiveTabPanelOnly={true}>
                    <Tab2 id="vars" title="Variables" panel={variablesTable}/>
                    <Tab2 id="meta" title="Meta-Info" panel={metaInfoTable}/>
                </Tabs2>
            );
        } else if (metaInfoTable) {
            return metaInfoTable;
        } else if (variablesTable) {
            return variablesTable;
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
