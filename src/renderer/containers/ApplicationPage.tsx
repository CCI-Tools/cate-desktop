import * as React from 'react';
import {Tab, TabList, TabPanel, Tabs} from "@blueprintjs/core";
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
import {connect} from "react-redux";
import {State} from "../state";

// TODO (forman): refactor this class, it is still prototype code!

interface IApplicationPageProps {

}

function mapStateToProps(state: State): IApplicationPageProps {
    return {
    };
}

//noinspection JSUnusedLocalSymbols
class ApplicationPage extends React.PureComponent<IApplicationPageProps, null> {


    render() {
        const centerStyle = {
            width: "100%",
            height: "100%",
            overflow: "auto",
        };

        return (
            <div style={{display: "flex", flexFlow: "column nowrap", width: "100%", height: "100%", }}>
                <div style={{flex: "auto", padding: 0, display:"flex", flexFlow: "row nowrap"}}>
                    <PanelContainer position="left" selectedPanelId="dataSources">
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
                        <Tabs>
                            <TabList>
                                {/* TODO (forman): implement a component "CloseableTab" which we will use here */}
                                <Tab>
                                    <TabHeader icon="pt-icon-globe" text="3D Globe"/>
                                </Tab>
                                <Tab>
                                    <TabHeader icon="pt-icon-map" text="2D Map"/>
                                </Tab>
                                <Tab>
                                    <TabHeader icon="pt-icon-media" text="Image"/>
                                </Tab>
                                <Tab>
                                    <TabHeader icon="pt-icon-info-sign" text="Info"/>
                                </Tab>
                            </TabList>

                            <TabPanel>
                                <GlobeView/>
                            </TabPanel>

                            <TabPanel>
                                <MapView/>
                            </TabPanel>

                            <TabPanel>
                                <div style={centerStyle}>
                                    <img src="resources/SST.png"/>
                                </div>
                            </TabPanel>

                            <TabPanel>
                                <div style={centerStyle}>
                                    <h2>Example panel: React</h2>
                                    <p className="pt-running-text">
                                        Lots of people use React as the V in MVC. Since React makes no assumptions about the
                                        rest of your technology stack, it's easy to try it out on a small feature in an existing
                                        project.
                                    </p>
                                </div>
                            </TabPanel>
                        </Tabs>
                    </div>
                    <PanelContainer position="right" selectedPanelId="layers">
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

export default connect(mapStateToProps)(LayersPanel);


function TabHeader(props) {
    return (
        <div className="cate-tab-header">
            <span className={"pt-icon-standard " + props.icon}/>
            <span style={{marginLeft: "0.5em", marginRight: "0.5em", flexGrow: 1}}>{props.text}</span>
            <span className={"pt-icon-standard pt-icon-cross cate-icon-small"}/>
        </div>
    );
}



