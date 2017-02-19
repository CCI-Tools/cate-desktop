import * as React from "react";
import {connect} from "react-redux";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {State, DataStoreState, DataSourceState} from "../state";
import {Tabs, TabList, Tab, TabPanel, Button, InputGroup, Classes, Tag, NumberRange} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import {OpenDatasetDialog, IOpenDatasetDialogState} from "./OpenDatasetDialog";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import * as actions from "../actions";
import * as selectors from "../selectors";


interface IDataSourcesPanelProps {
    hasWorkspace: boolean;
    dataStores: Array<DataStoreState>;
    dataSourceFilterExpr: string;
    selectedDataStore: DataStoreState|null;
    selectedDataSource: DataSourceState|null;
    selectedDataSources: DataSourceState[]|null;
    filteredDataSources: DataSourceState[]|null;
    showDataSourceDetails: boolean;
    openDatasetDialogState: IOpenDatasetDialogState;
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
        openDatasetDialogState: selectors.dialogStateSelector(OpenDatasetDialog.DIALOG_ID)(state) as IOpenDatasetDialogState
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
    setControlState: actions.setControlProperty,
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
        const selectedDataSource = this.props.selectedDataSource;
        this.props.showOpenDatasetDialog(
            this.props.selectedDataStore.id,
            this.props.selectedDataSource.id,
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

    render() {
        const hasDataStores = this.props.dataStores && this.props.dataStores.length;
        const hasDataSources = this.props.selectedDataSources && this.props.selectedDataSources.length;
        if (hasDataStores && hasDataSources) {

            const dataSourceFilterExpr = this.props.dataSourceFilterExpr;
            const filteredDataSources = this.props.filteredDataSources;

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
                const dataSource = this.props.selectedDataSource;

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
                            disabled={!this.props.selectedDataSource || !this.props.hasWorkspace}
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
                                         selectedDataSourceId={this.props.selectedDataSource ? this.props.selectedDataSource.id : null}
                                         setSelectedDataSourceId={this.props.setSelectedDataSourceId}/>
                        <DataSourceDetails dataSource={this.props.selectedDataSource}/>
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
                    <select value={this.props.selectedDataStore ? this.props.selectedDataStore.id : ''}
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
    dataSources: DataSourceState[];
    selectedDataSourceId: string|null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
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
                <ListBox items={this.props.dataSources}
                         getItemKey={DataSourcesList.getItemKey}
                         renderItem={this.renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedDataSourceId}
                         onSelection={this.handleDataSourceSelected}/>
            </div>
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
