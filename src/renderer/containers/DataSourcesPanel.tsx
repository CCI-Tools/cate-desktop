import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import { Table, Column, Cell, TruncatedFormat } from '@blueprintjs/table';
import ReactMarkdown from 'react-markdown';
import { State, DataStoreState, DataSourceState, DataStoreNotice } from '../state';
import {
    AnchorButton,
    InputGroup,
    Classes,
    Tag,
    Tabs,
    Tab,
    Checkbox,
    Colors, Collapse, Callout, Intent, HTMLSelect
} from '@blueprintjs/core';
import { IconName } from '@blueprintjs/core/src/components/icon/icon';
import { ListBox, ListBoxSelectionMode } from '../components/ListBox';
import { Card } from '../components/Card';
import { ScrollablePanelContent } from '../components/ScrollableContent';
import { ContentWithDetailsPanel } from '../components/ContentWithDetailsPanel';
import { ToolButton } from '../components/ToolButton';
import { TextWithLinks } from '../components/TextWithLinks';
import DownloadDatasetDialog from './DownloadDataSourceDialog';
import OpenDatasetDialog from './OpenDatasetDialog';
import AddDatasetDialog from './AddDatasetDialog';
import RemoveDatasetDialog from './RemoveDatasetDialog';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { NO_DATA_STORES_FOUND, NO_DATA_SOURCES_FOUND, NO_LOCAL_DATA_SOURCES } from '../messages';


const INTENTS = {
    'default': Intent.NONE,
    'primary': Intent.PRIMARY,
    'success': Intent.SUCCESS,
    'warning': Intent.WARNING,
    'danger': Intent.DANGER,
};

interface IDataSourcesPanelProps {
    hasWorkspace: boolean;
    dataStores: Array<DataStoreState>;
    dataSourceFilterExpr: string;
    selectedDataStore: DataStoreState | null;
    selectedDataSource: DataSourceState | null;
    selectedDataSources: DataSourceState[] | null;
    filteredDataSources: DataSourceState[] | null;
    dataSourceListHeight: number;
    showDataSourceIdsOnly: boolean;
    showDataSourceDetails: boolean;
    showDataStoreDescription: boolean;
    showDataStoreNotices: boolean;
    offlineMode: boolean;
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
        dataSourceListHeight: selectors.dataSourceListHeightSelector(state),
        showDataSourceDetails: selectors.showDataSourceDetailsSelector(state),
        showDataSourceIdsOnly: selectors.showDataSourceIdsOnlySelector(state),
        showDataStoreDescription: selectors.showDataStoreDescriptionSelector(state),
        showDataStoreNotices: selectors.showDataStoreNoticesSelector(state),
        offlineMode: selectors.offlineModeSelector(state),
    };
}

interface IDataSourcesPanelDispatch {
    setSelectedDataStoreId(selectedDataStoreId: string): void;

    setSelectedDataSourceId(selectedDataSourceId: string): void;

    setDataSourceFilterExpr(dataSourceFilterExpr: string): void;

    setControlState(propertyName: string, value: any): void;

    setSessionState(propertyName: string, value: any): void;

    updateSessionState(sessionState: any): void;

    loadTemporalCoverage(dataStoreId: string, dataSourceId: string): void;

    showDialog(dialogId: string): void;

    hideDialog(dialogId: string): void;
}

const mapDispatchToProps = {
    setSelectedDataStoreId: actions.setSelectedDataStoreId,
    setSelectedDataSourceId: actions.setSelectedDataSourceId,
    setDataSourceFilterExpr: actions.setDataSourceFilterExpr,
    setSessionState: actions.setSessionProperty,
    setControlState: actions.setControlProperty,
    updateSessionState: actions.updateSessionState,
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

    private static readonly FLEX_ROW_STYLE: CSSProperties = {display: 'flex', alignItems: 'center'};
    private static readonly SPACER_STYLE: CSSProperties = {flex: 1};

    constructor(props: IDataSourcesPanelProps & IDataSourcesPanelDispatch) {
        super(props);
        this.handleAddDatasetDialog = this.handleAddDatasetDialog.bind(this);
        this.handleRemoveDatasetDialog = this.handleRemoveDatasetDialog.bind(this);
        this.handleShowDownloadDataSourceDialog = this.handleShowDownloadDataSourceDialog.bind(this);
        this.handleShowOpenDatasetDialog = this.handleShowOpenDatasetDialog.bind(this);
        this.handleListHeightChanged = this.handleListHeightChanged.bind(this);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleDataStoreSelected = this.handleDataStoreSelected.bind(this);
        this.handleShowDataStoreDescriptionChanged = this.handleShowDataStoreDescriptionChanged.bind(this);
        this.handleShowDataStoreNoticesChanged = this.handleShowDataStoreNoticesChanged.bind(this);
        this.handleShowDataSourceIdsOnlyChanged = this.handleShowDataSourceIdsOnlyChanged.bind(this);
    }

    private handleAddDatasetDialog() {
        this.props.showDialog('addDatasetDialog');
    }

    private handleRemoveDatasetDialog() {
        this.props.showDialog('removeDatasetDialog');
    }

    private handleShowDownloadDataSourceDialog() {
        this.maybeLoadTemporalCoverage();
        this.props.showDialog('downloadDataSourceDialog');
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

    private handleListHeightChanged(value: number) {
        this.props.setSessionState('dataSourceListHeight', value);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.setSessionState('showDataSourceDetails', value);
    }

    private handleShowDataStoreDescriptionChanged() {
        this.props.updateSessionState({showDataStoreDescription: !this.props.showDataStoreDescription});
    }

    private handleShowDataStoreNoticesChanged() {
        this.props.updateSessionState({showDataStoreNotices: !this.props.showDataStoreNotices});
    }

    private handleShowDataSourceIdsOnlyChanged(ev: any) {
        this.props.updateSessionState({showDataSourceIdsOnly: ev.target.checked});
    }

    render() {
        const hasDataStores = this.props.dataStores && this.props.dataStores.length;
        const hasDataSources = this.props.selectedDataSources && this.props.selectedDataSources.length;
        let body;
        if (hasDataStores) {
            const hasSelection = this.props.selectedDataSource;
            const isDynamicLocalStore = this.props.selectedDataStore && this.props.selectedDataStore.id === 'local';
            const isLocalStore = isDynamicLocalStore || (this.props.selectedDataStore && this.props.selectedDataStore.isLocal);
            const isNonLocalStore = this.props.selectedDataStore && this.props.selectedDataStore.id !== 'local';
            const canAdd = isDynamicLocalStore;
            const canRemove = hasSelection && isDynamicLocalStore;
            const canDownload = hasSelection && !isLocalStore;
            const canOpen = hasSelection && this.props.hasWorkspace;
            let primaryAction;
            if (isLocalStore) {
                primaryAction = (
                    <ToolButton tooltipContent="Open local data source"
                                intent={Intent.PRIMARY}
                                onClick={this.handleShowOpenDatasetDialog}
                                disabled={!canOpen}
                                icon="folder-shared-open"/>
                );
            } else {
                primaryAction = (
                    <ToolButton tooltipContent="Download and/or open remote data source"
                                intent={Intent.PRIMARY}
                                onClick={this.handleShowDownloadDataSourceDialog}
                                disabled={!canDownload}
                                icon="cloud-download"/>
                );
            }
            const actionComponent = (
                <div className="pt-button-group">
                    <ToolButton tooltipContent="Add local data source"
                                intent={(isDynamicLocalStore && !hasDataSources) ? Intent.PRIMARY : Intent.NONE}
                                onClick={this.handleAddDatasetDialog}
                                disabled={!canAdd}
                                icon="add"/>
                    <ToolButton tooltipContent="Remove local data source"
                                onClick={this.handleRemoveDatasetDialog}
                                disabled={!canRemove}
                                icon="trash"/>
                    {primaryAction}
                    <AddDatasetDialog/>
                    <RemoveDatasetDialog/>
                    <DownloadDatasetDialog/>
                    <OpenDatasetDialog/>
                </div>
            );
            let listItemDoubleClickAction = null;
            if (isLocalStore && canOpen) {
                listItemDoubleClickAction = this.handleShowOpenDatasetDialog;
            } else if (isNonLocalStore && canDownload) {
                listItemDoubleClickAction = this.handleShowDownloadDataSourceDialog;
            }
            body = (
                <div>
                    {this.renderDataStoreSelector()}
                    {this.renderDataSourceFilterExprInput()}
                    <ContentWithDetailsPanel showDetails={this.props.showDataSourceDetails}
                                             onShowDetailsChange={this.handleShowDetailsChanged}
                                             isSplitPanel={true}
                                             contentHeight={this.props.dataSourceListHeight}
                                             onContentHeightChange={this.handleListHeightChanged}
                                             actionComponent={actionComponent}>
                        <DataSourcesList dataSources={this.props.filteredDataSources}
                                         selectedDataSourceId={this.props.selectedDataSource ? this.props.selectedDataSource.id : null}
                                         setSelectedDataSourceId={this.props.setSelectedDataSourceId}
                                         showDataSourceIdsOnly={this.props.showDataSourceIdsOnly}
                                         doubleClickAction={listItemDoubleClickAction}/>
                        <DataSourceDetails dataSource={this.props.selectedDataSource}/>
                    </ContentWithDetailsPanel>
                </div>
            );
        } else if (hasDataStores) {
            body = (
                <div>
                    {this.renderDataStoreSelector()}
                    {this.renderNoDataSourcesMessage()}
                </div>
            );
        } else {
            body = this.renderNoDataStoreMessage();
        }
        return body;
    }

    private renderDataSourceFilterExprInput() {
        const resultsTag = (
            <Tag className={Classes.MINIMAL} onRemove={() => this.props.setDataSourceFilterExpr('')}>
                {this.props.filteredDataSources && this.props.filteredDataSources.length}
            </Tag>
        );

        return (
            <div style={{paddingBottom: 2}}>
                <InputGroup
                    disabled={false}
                    leftIcon="filter"
                    onChange={(event) => this.props.setDataSourceFilterExpr(event.target.value)}
                    placeholder="Find data source"
                    rightElement={resultsTag}
                    value={this.props.dataSourceFilterExpr}
                />
            </div>
        );
    }

    private renderDataStoreSelector() {
        if (!this.props.dataStores || !this.props.dataStores.length) {
            return null;
        }

        const dataStoreOptions = [];
        for (let dataStore of this.props.dataStores) {
            dataStoreOptions.push(
                <option key={dataStore.id} value={dataStore.id}>{dataStore.title || dataStore.id}</option>
            );
        }

        const {selectedDataStore, showDataStoreDescription, showDataStoreNotices, showDataSourceIdsOnly} = this.props;

        const hasDataStoreDescription = selectedDataStore && selectedDataStore.description;
        const hasDataStoreNotices = selectedDataStore && selectedDataStore.notices && selectedDataStore.notices.length;

        let dataStoreDescriptionElement;
        if (hasDataStoreDescription) {
            dataStoreDescriptionElement = (
                <Collapse isOpen={showDataStoreDescription}>
                    <Card>
                        {this.renderMarkdown(selectedDataStore.description)}
                    </Card>
                </Collapse>
            );
        }

        let dataStoreNoticesElement;
        if (hasDataStoreNotices) {
            const callouts = [];
            selectedDataStore.notices.forEach((notice: DataStoreNotice) => {
                callouts.push(
                    <div key={notice.id} style={{margin: '0 4px 4px 4px'}}>
                        <Callout
                            title={notice.title}
                            icon={notice.icon as IconName}
                            intent={notice.intent in INTENTS ? INTENTS[notice.intent] : Intent.NONE}
                        >
                            {this.renderMarkdown(notice.content)}
                        </Callout>
                    </div>
                );
            });
            dataStoreNoticesElement = (<Collapse isOpen={showDataStoreNotices}>{callouts}</Collapse>);
        }

        // TODO (forman): BP3: use new Select component

        //  a label has by default a 15px margin at the bottom
        return (
            <React.Fragment>
                <div style={DataSourcesPanel.FLEX_ROW_STYLE}>
                    <label className="pt-label pt-inline" style={{margin: '0 0 0 0'}}>
                        Data store:
                        <div className="pt-select" style={{padding: '0.2em'}}>
                            <HTMLSelect
                                value={selectedDataStore ? selectedDataStore.id : ''}
                                onChange={this.handleDataStoreSelected}
                            >
                                {dataStoreOptions}
                            </HTMLSelect>
                        </div>
                    </label>
                    <span style={DataSourcesPanel.SPACER_STYLE}/>
                    <div className="pt-button-group">
                        <ToolButton tooltipContent="Show/hide data store description"
                                    onClick={this.handleShowDataStoreDescriptionChanged}
                                    disabled={!hasDataStoreDescription}
                                    active={showDataStoreDescription}
                                    icon="help"/>
                        <ToolButton tooltipContent="Show/hide data store notices"
                                    onClick={this.handleShowDataStoreNoticesChanged}
                                    disabled={!hasDataStoreNotices}
                                    active={showDataStoreNotices}
                                    icon="notifications"/>
                    </div>
                </div>

                {dataStoreDescriptionElement}
                {dataStoreNoticesElement}

                <div style={DataSourcesPanel.FLEX_ROW_STYLE}>
                    <span style={DataSourcesPanel.SPACER_STYLE}/>
                    <Checkbox label="Show data source IDs only"
                              checked={showDataSourceIdsOnly}
                              onChange={this.handleShowDataSourceIdsOnlyChanged}
                              style={{marginBottom: 2, marginTop: 6}}
                    />
                </div>

            </React.Fragment>
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

    //noinspection JSMethodCanBeStatic
    private renderMarkdown(source: string) {
        return <ReactMarkdown renderers={MARKDOWN_RENDERERS} source={source}/>
    }
}

/**
 * Allow Markdown text elements to be user-selectable.
 */
class MarkdownText extends React.PureComponent<any> {
    render() {
        return <span className="user-selectable">{this.props.value}</span>
    }
}

/**
 * Allow Markdown inline code elements to be user-selectable.
 */
class MarkdownInlineCode extends React.PureComponent<any> {
    static readonly SPAN_STYLE = {
        fontFamily: 'Source Code Pro, Consolas, monospace',
        color: Colors.LIGHT_GRAY1,
    };

    render() {
        return <span className="user-selectable" style={MarkdownInlineCode.SPAN_STYLE}>{this.props.value}</span>
    }
}

/**
 * Allow Markdown code elements to be user-selectable.
 */
class MarkdownCode extends React.PureComponent<any> {

    render() {
        return <pre className="user-selectable">{this.props.value}</pre>
    }
}

const MARKDOWN_RENDERERS = {text: MarkdownText, inlineCode: MarkdownInlineCode, code: MarkdownCode};


interface IDataSourcesListProps {
    dataSources: DataSourceState[];
    selectedDataSourceId: string | null;
    setSelectedDataSourceId: (selectedDataSourceId: string) => void;
    showDataSourceIdsOnly: boolean;
    doubleClickAction: (dataSource: DataSourceState) => any;
}

class DataSourcesList extends React.PureComponent<IDataSourcesListProps, null> {
    static readonly ITEM_DIV_STYLE: CSSProperties = {display: 'flex', alignItems: 'flex-start'};
    static readonly ID_DIV_STYLE: CSSProperties = {color: Colors.GREEN4, fontSize: '0.8em'};
    static readonly ICON_DIV_STYLE: CSSProperties = {width: 32, height: 32, flex: 'none', marginRight: 6};
    readonly defaultIconName = 'cci';

    constructor(props: IDataSourcesListProps) {
        super(props);
        this.renderIcon = this.renderIcon.bind(this);
        this.renderDataSourceTitleAndId = this.renderDataSourceTitleAndId.bind(this);
        this.renderDataSourceId = this.renderDataSourceId.bind(this);
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

    private renderIcon(dataSource: DataSourceState) {
        const icon = ((dataSource.meta_info && dataSource.meta_info.cci_project) || 'cci').toLowerCase();
        return <img src={`resources/images/data-sources/esacci/${icon}.png`}
                    style={DataSourcesList.ICON_DIV_STYLE}
                    alt="cci icon"
                    onError={this.handleIconLoadError}/>
    }

    private renderDataSourceTitleAndId(dataSource: DataSourceState) {
        const title = dataSource.title || (dataSource.meta_info && dataSource.meta_info.title);
        const id = dataSource.id;
        return (
            <div style={DataSourcesList.ITEM_DIV_STYLE}>
                {this.renderIcon(dataSource)}
                <div>
                    <div className="user-selectable">{title}</div>
                    <div className="user-selectable" style={DataSourcesList.ID_DIV_STYLE}>{id}</div>
                </div>
            </div>
        );
    }

    private renderDataSourceId(dataSource: DataSourceState) {
        const id = dataSource.id;
        return (
            <div style={DataSourcesList.ITEM_DIV_STYLE}>
                {this.renderIcon(dataSource)}
                <span className="user-selectable">{id}</span>
            </div>
        );
    }

    render() {
        let renderTitle;
        if (this.props.showDataSourceIdsOnly) {
            renderTitle = this.renderDataSourceId;
        } else {
            renderTitle = this.renderDataSourceTitleAndId;
        }

        return (
            <ScrollablePanelContent>
                <ListBox items={this.props.dataSources}
                         getItemKey={DataSourcesList.getItemKey}
                         renderItem={renderTitle}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedDataSourceId}
                         onItemDoubleClick={this.props.doubleClickAction}
                         onSelection={this.handleDataSourceSelected}/>
            </ScrollablePanelContent>
        );
    }
}

interface DetailPart {
    title: string;
    id: string;
    element: JSX.Element;
}

interface IDataSourceDetailsProps {
    dataSource: DataSourceState
}

class DataSourceDetails extends React.PureComponent<IDataSourceDetailsProps, null> {

    constructor(props: IDataSourceDetailsProps) {
        super(props);
        this.renderAbstract = this.renderAbstract.bind(this);
        this.openOdpLink = this.openOdpLink.bind(this);
    }

    private openOdpLink() {
        const uuid = this.props.dataSource.meta_info.uuid;
        const url = 'http://catalogue.ceda.ac.uk/uuid/' + uuid;
        actions.openExternal(url);
    }

    private renderAbstract(dataSource: DataSourceState): DetailPart {
        const metaInfo = dataSource.meta_info;
        let element;
        if (metaInfo) {
            let openOdpPage;
            if (metaInfo.uuid) {
                openOdpPage =
                    <AnchorButton onClick={this.openOdpLink}
                                  style={{float: 'right', margin: 4}}>Catalogue</AnchorButton>
            }
            let spatialCoverage;
            if (metaInfo.bbox_miny && metaInfo.bbox_maxy && metaInfo.bbox_minx && metaInfo.bbox_maxx) {
                spatialCoverage = (
                    <div>
                        <h5>Spatial coverage</h5>
                        <table>
                            <tbody>
                            <tr>
                                <td/>
                                <td className="user-selectable">{metaInfo.bbox_maxy}&#176;</td>
                                <td/>
                            </tr>
                            <tr>
                                <td className="user-selectable">{metaInfo.bbox_minx}&#176;</td>
                                <td/>
                                <td className="user-selectable">{metaInfo.bbox_maxx}&#176;</td>
                            </tr>
                            <tr>
                                <td/>
                                <td className="user-selectable">{metaInfo.bbox_miny}&#176;</td>
                                <td/>
                            </tr>
                            </tbody>
                        </table>
                        <br/>
                    </div>
                );
            }
            let temporalCoverage;
            if (dataSource.temporalCoverage) {
                temporalCoverage = (
                    <div><h5>Temporal coverage</h5>
                        <table>
                            <tbody>
                            <tr>
                                <td>Start</td>
                                <td className="user-selectable">{dataSource.temporalCoverage[0]}</td>
                            </tr>
                            <tr>
                                <td>End</td>
                                <td className="user-selectable">{dataSource.temporalCoverage[1]}</td>
                            </tr>
                            </tbody>
                        </table>
                        <br/>
                    </div>
                );
            }
            let summary;
            if (metaInfo.abstract) {
                summary = (
                    <div><h5>Summary</h5>
                        <p className="user-selectable"><TextWithLinks>{metaInfo.abstract}</TextWithLinks></p>
                    </div>
                );
            }
            if (openOdpPage || spatialCoverage || temporalCoverage || summary) {
                element = (
                    <ScrollablePanelContent>
                        <Card>
                            {openOdpPage}
                            {spatialCoverage}
                            {temporalCoverage}
                            {summary}
                        </Card>
                    </ScrollablePanelContent>
                );
            }
        }

        if (!element) {
            element = <Card>No abstract available.</Card>;
        }

        return {title: 'Abstract', id: 'abstract', element};
    }

    private static renderVariablesTable(variables?: any[]): DetailPart {
        let element;
        if (variables && variables.length > 0) {
            const renderName = (rowIndex: number) => {
                const variable = variables[rowIndex];
                return (
                    <Cell tooltip={variable.long_name}>
                        <TruncatedFormat className="user-selectable">{variable.name}</TruncatedFormat>
                    </Cell>
                );
            };

            const renderUnit = (rowIndex: number) => {
                const variable = variables[rowIndex];
                return (
                    <Cell>
                        <TruncatedFormat className="user-selectable">{variable.units || '-'}</TruncatedFormat>
                    </Cell>
                );
            };

            const getCellClipboardData = (row: number, col: number) => {
                console.log('getCellClipboardData: ', row, col);
            };

            element = (
                <Table numRows={variables.length}
                       enableRowHeader={false}
                       getCellClipboardData={getCellClipboardData}>
                    <Column name="Name" cellRenderer={renderName}/>
                    <Column name="Units" cellRenderer={renderUnit}/>
                </Table>
            );
        } else {
            element = <Card>No information about variables available.</Card>;
        }
        return {title: 'Variables', id: 'var', element};
    }

    private static renderMetaInfoTable(metaInfo?: any, metaInfoKeys?: string[]): DetailPart {
        let element;
        if (metaInfo && metaInfoKeys) {

            const renderKey = (rowIndex: number) => {
                const key = metaInfoKeys[rowIndex];
                return <Cell><TruncatedFormat>{key}</TruncatedFormat></Cell>;
            };

            const renderValue = (rowIndex: number) => {
                const key = metaInfoKeys[rowIndex];
                return <Cell><TruncatedFormat>{metaInfo[key]}</TruncatedFormat></Cell>;
            };

            const getCellClipboardData = (row: number, col: number) => {
                console.log('getCellClipboardData: ', row, col);
            };

            element = (
                <Table numRows={metaInfoKeys.length}
                       enableRowHeader={false}
                       getCellClipboardData={getCellClipboardData}>
                    <Column name="Key" cellRenderer={renderKey}/>
                    <Column name="Value" cellRenderer={renderValue}/>
                </Table>
            );
        } else {
            element = <Card>No global meta-information available.</Card>;
        }

        return {title: 'Meta-Info', id: 'meta', element};
    }

    private static renderMetaInfoLicences(metaInfo: any): DetailPart {
        let element;
        if (metaInfo && metaInfo.licences) {
            element = (
                <div>
                    <p className="user-selectable"><TextWithLinks>{metaInfo.licences}</TextWithLinks></p>
                </div>
            );
        } else {
            element = <Card>No license information available.</Card>;
        }
        return {title: 'Licences', id: 'licences', element};
    }

    render() {
        const dataSource = this.props.dataSource;
        if (!dataSource) {
            return null;
        }
        let metaInfoKeys;
        if (dataSource.meta_info) {
            metaInfoKeys = Object.keys(dataSource.meta_info).filter(key => key !== 'variables');
        }
        let variables;
        if (dataSource.meta_info.variables) {
            variables = dataSource.meta_info.variables;
        }

        const details: DetailPart[] = [];
        details.push(this.renderAbstract(dataSource));
        details.push(DataSourceDetails.renderVariablesTable(variables));
        details.push(DataSourceDetails.renderMetaInfoTable(dataSource.meta_info, metaInfoKeys));
        details.push(DataSourceDetails.renderMetaInfoLicences(dataSource.meta_info));

        return (
            <Tabs id="dsDetails" renderActiveTabPanelOnly={true}>
                {details.map(d => <Tab key={d.id} id={d.id} title={d.title} panel={d.element}/>)}
            </Tabs>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataSourcesPanel as any);
