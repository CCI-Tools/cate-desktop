import * as React from 'react';
import GlobeView from './GlobeView'
import MapView from "./MapView";
import FigureView from "./FigureView";
import TableView from "./TableView";
import DataSourcesPanel from "./DataSourcesPanel";
import OperationsPanel from "./OperationsPanel";
import WorkspacePanel from "./WorkspacePanel";
import VariablePanel from "./VariablesPanel";
import PlacemarksPanel from "./PlacemarksPanel";
import ViewPanel from "./ViewPanel";
import TaskPanel from "./TasksPanel";
import StatusBar from "./StatusBar";
import LayersPanel from "./LayersPanel";
import PreferencesDialog from "./PreferencesDialog";
import {PanelContainer, PanelContainerLayout} from "../components/PanelContainer";
import {Panel} from "../components/Panel";
import {connect, Dispatch} from "react-redux";
import {State, WorldViewDataState, FigureViewDataState, TableViewDataState} from "../state";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ViewManager, ViewRenderMap} from "../components/ViewManager";
import {ViewLayoutState, ViewState, ViewPath, SplitDir} from "../components/ViewState";
import {CSSProperties} from "react";


function renderWorldView(view: ViewState<WorldViewDataState>) {
    return view.data.viewMode === "3D" ? (<GlobeView view={view}/>) : (<MapView view={view}/>);
}

function renderFigureView(view: ViewState<FigureViewDataState>) {
    return <FigureView view={view}/>;
}

function renderTableView(view: ViewState<TableViewDataState>) {
    return <TableView view={view}/>;
}

const VIEW_TYPE_RENDERERS: ViewRenderMap = {
    world: renderWorldView,
    figure: renderFigureView,
    table: renderTableView,
};

interface IDispatch {
    dispatch: Dispatch<State>;
}

//noinspection JSUnusedLocalSymbols
export default class ApplicationPage extends React.PureComponent<null, null> {
    static readonly ROOT_DIV_STYLE: CSSProperties = {
        display: "flex",
        flexFlow: "column nowrap",
        width: "100%",
        height: "100%",
        overflow: "hidden"
    };
    static readonly MAIN_DIV_STYLE: CSSProperties = {
        display: "flex",
        flexFlow: "row nowrap",
        flex: "auto",
        height: "100%",
        overflow: "hidden"
    };
    static readonly CREDITS_DIV_STYLE: CSSProperties = {
        minWidth: "10em",
        minHeight: "4em",
        position: "relative",
        overflow: "auto",
        display: "none"
    };

    render() {
        return (
            <div style={ApplicationPage.ROOT_DIV_STYLE}>
                <div style={ApplicationPage.MAIN_DIV_STYLE}>
                    <LeftPanel/>
                    <CenterPanel/>
                    <RightPanel/>
                </div>
                <StatusBar/>
                <PreferencesDialog/>
                <div id="creditContainer"
                     style={ApplicationPage.CREDITS_DIV_STYLE}/>

            </div>
        );
    }
}

interface ILeftPanelProps {
    panelContainerUndockedMode: boolean;
    leftPanelContainerLayout: PanelContainerLayout;
    selectedLeftTopPanelId?: string;
    selectedLeftBottomPanelId?: string;
}

function mapStateToPropsLeft(state: State): ILeftPanelProps {
    return {
        panelContainerUndockedMode: selectors.panelContainerUndockedModeSelector(state),
        leftPanelContainerLayout: selectors.leftPanelContainerLayoutSelector(state),
        selectedLeftTopPanelId: selectors.selectedLeftTopPanelIdSelector(state),
        selectedLeftBottomPanelId: selectors.selectedLeftBottomPanelIdSelector(state),
    };
}

class _LeftPanel extends React.PureComponent<ILeftPanelProps & IDispatch, null> {

    constructor(props: ILeftPanelProps & IDispatch) {
        super(props);
        this.onLeftPanelContainerLayoutChange = this.onLeftPanelContainerLayoutChange.bind(this);
        this.onRightPanelContainerLayoutChange = this.onRightPanelContainerLayoutChange.bind(this);
        this.onSelectedLeftTopPanelChange = this.onSelectedLeftTopPanelChange.bind(this);
        this.onSelectedLeftBottomPanelChange = this.onSelectedLeftBottomPanelChange.bind(this);
    }

    onLeftPanelContainerLayoutChange(layout: PanelContainerLayout) {
        this.props.dispatch(actions.setLeftPanelContainerLayout(layout));
    }

    onRightPanelContainerLayoutChange(layout: PanelContainerLayout) {
        this.props.dispatch(actions.setRightPanelContainerLayout(layout));
    }

    onSelectedLeftTopPanelChange(id: string | null) {
        this.props.dispatch(actions.setSelectedLeftTopPanelId(id));
    }

    onSelectedLeftBottomPanelChange(id: string | null) {
        this.props.dispatch(actions.setSelectedLeftBottomPanelId(id));
    }

    render() {
        return (
            <PanelContainer position="left"
                            undockedMode={this.props.panelContainerUndockedMode}
                            layout={this.props.leftPanelContainerLayout}
                            onLayoutChange={this.onLeftPanelContainerLayoutChange}
                            selectedTopPanelId={this.props.selectedLeftTopPanelId}
                            selectedBottomPanelId={this.props.selectedLeftBottomPanelId}
                            onSelectedTopPanelChange={this.onSelectedLeftTopPanelChange}
                            onSelectedBottomPanelChange={this.onSelectedLeftBottomPanelChange}
            >
                <Panel id="dataSources" position="top" iconName="pt-icon-database" title="Data Sources"
                       body={<DataSourcesPanel/>}/>
                <Panel id="operations" position="bottom" iconName="pt-icon-function" title="Operations"
                       body={<OperationsPanel/>}/>
            </PanelContainer>
        );
    }
}
const LeftPanel = connect(mapStateToPropsLeft)(_LeftPanel);

interface IRightPanelProps {
    panelContainerUndockedMode: boolean;
    rightPanelContainerLayout: PanelContainerLayout;
    selectedRightTopPanelId?: string;
    selectedRightBottomPanelId?: string;
}

function mapStateToPropsRight(state: State): IRightPanelProps {
    return {
        panelContainerUndockedMode: selectors.panelContainerUndockedModeSelector(state),
        rightPanelContainerLayout: selectors.rightPanelContainerLayoutSelector(state),
        selectedRightTopPanelId: selectors.selectedRightTopPanelIdSelector(state),
        selectedRightBottomPanelId: selectors.selectedRightBottomPanelIdSelector(state),
    };
}

class _RightPanel extends React.PureComponent<IRightPanelProps & IDispatch, null> {

    constructor(props: IRightPanelProps & IDispatch) {
        super(props);
        this.onRightPanelContainerLayoutChange = this.onRightPanelContainerLayoutChange.bind(this);
        this.onSelectedRightTopPanelChange = this.onSelectedRightTopPanelChange.bind(this);
        this.onSelectedRightBottomPanelChange = this.onSelectedRightBottomPanelChange.bind(this);
    }

    onRightPanelContainerLayoutChange(layout: PanelContainerLayout) {
        this.props.dispatch(actions.setRightPanelContainerLayout(layout));
    }

    onSelectedRightTopPanelChange(id: string | null) {
        this.props.dispatch(actions.setSelectedRightTopPanelId(id));
    }

    onSelectedRightBottomPanelChange(id: string | null) {
        this.props.dispatch(actions.setSelectedRightBottomPanelId(id));
    }

    render() {
        return (
            <PanelContainer position="right"
                            undockedMode={this.props.panelContainerUndockedMode}
                            layout={this.props.rightPanelContainerLayout}
                            onLayoutChange={this.onRightPanelContainerLayoutChange}
                            selectedTopPanelId={this.props.selectedRightTopPanelId}
                            selectedBottomPanelId={this.props.selectedRightBottomPanelId}
                            onSelectedTopPanelChange={this.onSelectedRightTopPanelChange}
                            onSelectedBottomPanelChange={this.onSelectedRightBottomPanelChange}
            >
                <Panel id="workspace" position="top" iconName="pt-icon-flows" title="Workspace"
                       body={<WorkspacePanel/>}/>
                <Panel id="layers" position="top" iconName="pt-icon-layers" title="Layers"
                       body={<LayersPanel/>}/>
                <Panel id="placemarks" position="top" iconName="pt-icon-map-marker" title="Placemarks"
                       body={<PlacemarksPanel/>}/>
                <Panel id="variables" position="bottom" iconName="pt-icon-variable" title="Variables"
                       body={<VariablePanel/>}/>
                <Panel id="view" position="bottom" iconName="pt-icon-eye-open" title="View"
                       body={<ViewPanel/>}/>
                <Panel id="tasks" position="bottom" iconName="pt-icon-play" title="Tasks"
                       body={<TaskPanel/>}/>
            </PanelContainer>
        );
    }
}
const RightPanel = connect(mapStateToPropsRight)(_RightPanel);

interface IViewManagerPanelProps {
    viewLayout: ViewLayoutState;
    views: ViewState<any>[];
    activeView: ViewState<any> | null;
}

function mapStateToPropsView(state: State): IViewManagerPanelProps {
    return {
        viewLayout: selectors.viewLayoutSelector(state),
        views: selectors.viewsSelector(state),
        activeView: selectors.activeViewSelector(state),
    };
}

class _CenterPanel extends React.PureComponent<IViewManagerPanelProps & IDispatch, null> {
    static readonly DIV_STYLE: CSSProperties = {flex: "auto", height: "100%", overflow: "hidden"};

    constructor(props: IViewManagerPanelProps & IDispatch) {
        super(props);
        this.onSelectView = this.onSelectView.bind(this);
        this.onCloseView = this.onCloseView.bind(this);
        this.onCloseAllViews = this.onCloseAllViews.bind(this);
        this.onMoveView = this.onMoveView.bind(this);
        this.onChangeViewSplitPos = this.onChangeViewSplitPos.bind(this);
        this.onSplitViewPanel = this.onSplitViewPanel.bind(this);
    }

    onSelectView(viewPath: ViewPath, viewId: string) {
        this.props.dispatch(actions.selectView(viewPath, viewId));
    }

    onCloseView(viewPath: ViewPath, viewId: string) {
        this.props.dispatch(actions.closeView(viewPath, viewId));
    }

    onCloseAllViews(viewPath: ViewPath) {
        this.props.dispatch(actions.closeAllViews(viewPath));
    }

    onMoveView(sourceViewId: string, placement: "before" | "after", targetViewId: string) {
        this.props.dispatch(actions.moveView(sourceViewId, placement, targetViewId));
    }

    onSplitViewPanel(viewPath: ViewPath, dir: SplitDir, pos: number) {
        this.props.dispatch(actions.splitViewPanel(viewPath, dir, pos));
    }

    onChangeViewSplitPos(viewPath: ViewPath, delta: number) {
        this.props.dispatch(actions.changeViewSplitPos(viewPath, delta));
    }

    render() {
        return (
            <div style={_CenterPanel.DIV_STYLE}>
                <ViewManager viewRenderMap={VIEW_TYPE_RENDERERS}
                             viewLayout={this.props.viewLayout}
                             views={this.props.views}
                             activeView={this.props.activeView}
                             noViewsDescription="You can create new views from the Views menu."
                             noViewsVisual="pt-icon-eye-open"
                             onSelectView={this.onSelectView}
                             onCloseView={this.onCloseView}
                             onCloseAllViews={this.onCloseAllViews}
                             onMoveView={this.onMoveView}
                             onChangeViewSplitPos={this.onChangeViewSplitPos}
                             onSplitViewPanel={this.onSplitViewPanel}
                />
            </div>
        );
    }
}
const CenterPanel = connect(mapStateToPropsView)(_CenterPanel);



