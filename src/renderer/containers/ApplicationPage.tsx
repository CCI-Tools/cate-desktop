import * as React from 'react';
import GlobeView from './GlobeView'
import MapView from "./MapView";
import DataSourcesPanel from "./DataSourcesPanel";
import OperationsPanel from "./OperationsPanel";
import WorkspacePanel from "./WorkspacePanel";
import VariablePanel from "./VariablesPanel";
import ViewPanel from "./ViewPanel";
import TaskPanel from "./TasksPanel";
import LayersPanel from "./LayersPanel";
import PreferencesDialog from "./PreferencesDialog";
import {PanelContainer} from "../components/PanelContainer";
import {Panel} from "../components/Panel";
import {connect, Dispatch} from "react-redux";
import {State, ViewMode} from "../state";
import * as actions from "../actions";
import * as selectors from "../selectors";

// TODO (forman): refactor this class, it is still prototype code!

interface IDispatch {
    dispatch: Dispatch<State>;
}


interface IApplicationPageProps {
    viewMode: ViewMode;
    selectedLeftPanelId?: string;
    selectedRightPanelId?: string;
}

function mapStateToProps(state: State): IApplicationPageProps {
    return {
        viewMode: selectors.viewModeSelector(state),
        selectedLeftPanelId: selectors.selectedLeftPanelIdSelector(state),
        selectedRightPanelId: selectors.selectedRightPanelIdSelector(state),
    };
}

//noinspection JSUnusedLocalSymbols
class ApplicationPage extends React.PureComponent<IApplicationPageProps & IDispatch, null> {

    constructor(props: IApplicationPageProps & IDispatch) {
        super(props);
        this.onSelectedLeftPanelChange = this.onSelectedLeftPanelChange.bind(this);
        this.onSelectedRightPanelChange = this.onSelectedRightPanelChange.bind(this);

    }

    onSelectedLeftPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedLeftPanelId(id));
    }

    onSelectedRightPanelChange(id: string|null) {
        this.props.dispatch(actions.setSelectedRightPanelId(id));
    }

    render() {
        const centerStyle = {
            width: "100%",
            height: "100%",
            overflow: "auto",
        };

        return (
            <div style={{display: "flex", flexFlow: "column nowrap", width: "100%", height: "100%", }}>
                <div style={{flex: "auto", padding: 0, display:"flex", flexFlow: "row nowrap"}}>
                    <PanelContainer position="left"
                                    selectedPanelId={this.props.selectedLeftPanelId}
                                    onSelectedPanelChange={this.onSelectedLeftPanelChange}>
                        <Panel id="dataSources" iconName="pt-icon-database" title="Data Sources"
                               body={<DataSourcesPanel/>}/>
                        <Panel id="operations" iconName="pt-icon-function" title="Operations"
                               body={<OperationsPanel/>}/>
                        <Panel id="workspace" iconName="pt-icon-folder-close" title="Workspace"
                               body={<WorkspacePanel/>}/>
                        <Panel id="variables" iconName="pt-icon-variable" title="Variables"
                               body={<VariablePanel/>}/>
                    </PanelContainer>
                    <div style={{flex:"auto", maxHeight: "100%"}}>
                        <WorldView viewMode={this.props.viewMode}/>
                    </div>
                    <PanelContainer position="right"
                                    selectedPanelId={this.props.selectedRightPanelId}
                                    onSelectedPanelChange={this.onSelectedRightPanelChange}>
                        <Panel id="view" iconName="pt-icon-eye-open" title="View" body={<ViewPanel/>}/>
                        <Panel id="layers" iconName="pt-icon-layers" title="Layers" body={<LayersPanel/>}/>
                        <Panel id="analysis" iconName="pt-icon-scatter-plot" title="Analysis" body={null}/>
                        <Panel id="tasks" iconName="pt-icon-play" title="Tasks" body={<TaskPanel/>}/>
                    </PanelContainer>
                </div>
                <div
                    style={{flex: "none", padding: "0 4px 0 4px", height: "1.5em", fontSize: "small", alignItems: "center", backgroundColor: "#2B95D6"}}>
                    Ready.
                </div>
                <PreferencesDialog/>
            </div>
        );
    }
}

interface IWorldViewProps {
    viewMode: ViewMode;
}

function WorldView(props: IWorldViewProps) {
    return props.viewMode === "3D" ? (<GlobeView/>) : (<MapView/>);
}


export default connect(mapStateToProps)(ApplicationPage);


function TabHeader(props) {
    return (
        <div className="cate-tab-header">
            <span className={"pt-icon-standard " + props.icon}/>
            <span style={{marginLeft: "0.5em", marginRight: "0.5em", flexGrow: 1}}>{props.text}</span>
            <span className={"pt-icon-standard pt-icon-cross cate-icon-small"}/>
        </div>
    );
}



