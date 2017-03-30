import * as React from 'react';
import GlobeView from './GlobeView'
import MapView from "./MapView";
import DataSourcesPanel from "./DataSourcesPanel";
import OperationsPanel from "./OperationsPanel";
import WorkspacePanel from "./WorkspacePanel";
import VariablePanel from "./VariablesPanel";
import ViewPanel from "./ViewPanel";
import TaskPanel from "./TasksPanel";
import StatusBar from "./StatusBar";
import LayersPanel from "./LayersPanel";
import PreferencesDialog from "./PreferencesDialog";
import {PanelContainer, PanelContainerLayout} from "../components/PanelContainer";
import {Panel} from "../components/Panel";
import {connect, Dispatch} from "react-redux";
import {State, ViewMode} from "../state";
import * as actions from "../actions";
import * as selectors from "../selectors";

interface IDispatch {
    dispatch: Dispatch<State>;
}

interface IApplicationPageProps {
    viewMode: ViewMode;
    panelContainerUndockedMode: boolean;
    leftPanelContainerLayout: PanelContainerLayout;
    rightPanelContainerLayout: PanelContainerLayout;
    selectedLeftTopPanelId?: string;
    selectedLeftBottomPanelId?: string;
    selectedRightTopPanelId?: string;
    selectedRightBottomPanelId?: string;
}

function mapStateToProps(state: State): IApplicationPageProps {
    return {
        viewMode: selectors.viewModeSelector(state),
        panelContainerUndockedMode: selectors.panelContainerUndockedModeSelector(state),
        leftPanelContainerLayout: selectors.leftPanelContainerLayoutSelector(state),
        rightPanelContainerLayout: selectors.rightPanelContainerLayoutSelector(state),
        selectedLeftTopPanelId: selectors.selectedLeftTopPanelIdSelector(state),
        selectedLeftBottomPanelId: selectors.selectedLeftBottomPanelIdSelector(state),
        selectedRightTopPanelId: selectors.selectedRightTopPanelIdSelector(state),
        selectedRightBottomPanelId: selectors.selectedRightBottomPanelIdSelector(state),
    };
}

//noinspection JSUnusedLocalSymbols
class ApplicationPage extends React.PureComponent<IApplicationPageProps & IDispatch, null> {

    constructor(props: IApplicationPageProps & IDispatch) {
        super(props);
        this.onLeftPanelContainerLayoutChange = this.onLeftPanelContainerLayoutChange.bind(this);
        this.onRightPanelContainerLayoutChange = this.onRightPanelContainerLayoutChange.bind(this);
        this.onSelectedLeftTopPanelChange = this.onSelectedLeftTopPanelChange.bind(this);
        this.onSelectedLeftBottomPanelChange = this.onSelectedLeftBottomPanelChange.bind(this);
        this.onSelectedRightTopPanelChange = this.onSelectedRightTopPanelChange.bind(this);
        this.onSelectedRightBottomPanelChange = this.onSelectedRightBottomPanelChange.bind(this);
    }

    onLeftPanelContainerLayoutChange(layout: PanelContainerLayout) {
        this.props.dispatch(actions.setLeftPanelContainerLayout(layout));
    }

    onRightPanelContainerLayoutChange(layout: PanelContainerLayout) {
        this.props.dispatch(actions.setRightPanelContainerLayout(layout));
    }

    onSelectedLeftTopPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedLeftTopPanelId(id));
    }

    onSelectedLeftBottomPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedLeftBottomPanelId(id));
    }

    onSelectedRightTopPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedRightTopPanelId(id));
    }

    onSelectedRightBottomPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedRightBottomPanelId(id));
    }

    render() {
        return (
            <div style={{display: "flex", flexFlow: "column nowrap", width: "100%", height: "100%", }}>
                <div style={{flex: "auto", padding: 0, display:"flex", flexFlow: "row nowrap"}}>
                    <PanelContainer position="left"
                                    undockedMode={this.props.panelContainerUndockedMode}
                                    layout={this.props.leftPanelContainerLayout}
                                    onLayoutChange={this.onLeftPanelContainerLayoutChange}
                                    selectedTopPanelId={this.props.selectedLeftTopPanelId}
                                    selectedBottomPanelId={this.props.selectedLeftBottomPanelId}
                                    onSelectedTopPanelChange={this.onSelectedLeftTopPanelChange}
                                    onSelectedBottomPanelChange={this.onSelectedLeftBottomPanelChange}
                    >
                        <Panel id="dataSources" position="top"  iconName="pt-icon-database" title="Data Sources"
                               body={<DataSourcesPanel/>}/>
                        <Panel id="operations"  position="top" iconName="pt-icon-function" title="Operations"
                               body={<OperationsPanel/>}/>
                        <Panel id="workspace" position="bottom" iconName="pt-icon-folder-close" title="Workspace"
                               body={<WorkspacePanel/>}/>
                    </PanelContainer>
                    <div style={{flex:"auto", maxHeight: "100%"}}>
                        <WorldView viewMode={this.props.viewMode}/>
                    </div>
                    <PanelContainer position="right"
                                    undockedMode={this.props.panelContainerUndockedMode}
                                    layout={this.props.rightPanelContainerLayout}
                                    onLayoutChange={this.onRightPanelContainerLayoutChange}
                                    selectedTopPanelId={this.props.selectedRightTopPanelId}
                                    selectedBottomPanelId={this.props.selectedRightBottomPanelId}
                                    onSelectedTopPanelChange={this.onSelectedRightTopPanelChange}
                                    onSelectedBottomPanelChange={this.onSelectedRightBottomPanelChange}
                    >
                        <Panel id="variables" position="top"  iconName="pt-icon-variable" title="Variables"
                               body={<VariablePanel/>}/>
                        <Panel id="analysis" position="top"  iconName="pt-icon-scatter-plot" title="Analysis" body={null}/>
                        <Panel id="view" position="bottom"  iconName="pt-icon-eye-open" title="View" body={<ViewPanel/>}/>
                        <Panel id="layers" position="bottom"  iconName="pt-icon-layers" title="Layers" body={<LayersPanel/>}/>
                        <Panel id="tasks" position="bottom"  iconName="pt-icon-play" title="Tasks" body={<TaskPanel/>}/>
                    </PanelContainer>
                </div>
                <StatusBar/>
                <PreferencesDialog/>
            </div>
        );
    }
}

export default connect(mapStateToProps)(ApplicationPage);


interface IWorldViewProps {
    viewMode: ViewMode;
}

function WorldView(props: IWorldViewProps) {
    return props.viewMode === "3D" ? (<GlobeView/>) : (<MapView/>);
}





