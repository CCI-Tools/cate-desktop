import * as React from 'react';
import {Classes, ITreeNode, Tooltip, Tree, Tab, TabList, TabPanel, Tabs} from "@blueprintjs/core";
import {ExpansionPanel} from '../components/ExpansionPanel';
import GlobeView from './GlobeView'
import MapView from "./MapView";
import DataSourcesPanel from "./DataSourcesPanel";
import OperationsPanel from "./OperationsPanel";
import WorkspacePanel from "./WorkspacePanel";
import VariablePanel from "./VariablesPanel";
import TaskPanel from "./TasksPanel";
import LayersPanel from "./LayersPanel";
import PreferencesDialog from "./PreferencesDialog";
import {PanelContainer} from "../components/PanelContainer";
import {Panel} from "../components/Panel";

// TODO (forman): refactor this class, it is still prototype code!

//noinspection JSUnusedLocalSymbols
export function ApplicationPage(props) {

    const centerStyle = {
        width: "100%",
        height: "100%",
        overflow: "auto",
    };

    return (
        <div style={{display: "flex", flexFlow: "column nowrap", width: "100%", height: "100%", }}>
            <div style={{flex: "none", padding: "0 4px 0 4px;"}}>
                {/*<NavBarExample/>*/}
            </div>
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
                    <Panel id="layers" iconName="pt-icon-layers" title="Layers" body={<LayersPanel/>}/>
                    <Panel id="analysis" iconName="pt-icon-scatter-plot" title="Analysis" body={<TreeExample/>}/>
                    <Panel id="tasks" iconName="pt-icon-play" title="Tasks" body={<TaskPanel/>}/>
                </PanelContainer>
            </div>
            <div
                style={{flex: "none", padding: "0 4px 0 4px;", height: "1.5em", fontSize: "small", alignItems: "center", backgroundColor: "#2B95D6"}}>
                Ready.
            </div>
            <PreferencesDialog/>
        </div>
    );
}


function TabHeader(props) {
    return (
        <div className="cate-tab-header">
            <span className={"pt-icon-standard " + props.icon}/>
            <span style={{marginLeft: "0.5em", marginRight: "0.5em", flexGrow: 1}}>{props.text}</span>
            <span className={"pt-icon-standard pt-icon-cross cate-icon-small"}/>
        </div>
    );
}


//noinspection JSUnusedLocalSymbols
function NavBarExample(props) {
    return (
        <nav className="pt-navbar">
            <div className="pt-navbar-group pt-align-left">
                <div className="pt-navbar-heading">Cate</div>
                <input className="pt-input" placeholder="Search files..." type="text"/>
            </div>
            <div className="pt-navbar-group pt-align-right">
                <button className="pt-button pt-minimal pt-icon-home">Home</button>
                <button className="pt-button pt-minimal pt-icon-document">Files</button>
                <span className="pt-navbar-divider"/>
                <button className="pt-button pt-minimal pt-icon-user"/>
                <button className="pt-button pt-minimal pt-icon-notifications"/>
                <button className="pt-button pt-minimal pt-icon-cog"/>
            </div>
        </nav>
    );
}

export interface ITreeExampleState {
    nodes: ITreeNode[];
}

export class TreeExample extends React.Component<any, ITreeExampleState> {
    constructor(props) {
        super(props);
        const tooltipLabel = <Tooltip content="An eye!"><span className="pt-icon-standard pt-icon-eye-open"/></Tooltip>;
        const longLabel = "Organic meditation gluten-free, sriracha VHS drinking vinegar beard man.";
        this.state = {
            nodes: [
                {
                    hasCaret: true,
                    iconName: "folder-close",
                    label: "Folder 0",
                },
                {
                    iconName: "folder-close",
                    isExpanded: true,
                    label: <Tooltip content="I'm a folder <3">Folder 1</Tooltip>,
                    childNodes: [
                        {iconName: "document", label: "Item 0", secondaryLabel: tooltipLabel},
                        {iconName: "pt-icon-tag", label: longLabel},
                        {
                            hasCaret: true,
                            iconName: "pt-icon-folder-close",
                            label: <Tooltip content="foo">Folder 2</Tooltip>,
                            childNodes: [
                                {label: "No-Icon Item"},
                                {iconName: "pt-icon-tag", label: "Item 1"},
                                {
                                    hasCaret: true, iconName: "pt-icon-folder-close", label: "Folder 3",
                                    childNodes: [
                                        {iconName: "document", label: "Item 0"},
                                        {iconName: "pt-icon-tag", label: "Item 1"},
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any as ITreeExampleState;
        /* tslint:enable:object-literal-sort-keys */
        let i = 0;
        this.forEachNode(this.state.nodes, (n) => n.id = i++);
    }

    // override @PureRender because nodes are not a primitive type and therefore aren't included in
    // shallow prop comparison
    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        return true;
    }

    render() {
        return (
            <Tree
                contents={this.state.nodes}
                onNodeClick={this.handleNodeClick}
                onNodeCollapse={this.handleNodeCollapse}
                onNodeExpand={this.handleNodeExpand}
                className={Classes.ELEVATION_4}
            />
        );
    }

    private handleNodeClick = (nodeData: ITreeNode, _nodePath: number[], e: React.MouseEvent<HTMLElement>) => {
        const originallySelected = nodeData.isSelected;
        if (!e.shiftKey) {
            this.forEachNode(this.state.nodes, (n) => n.isSelected = false);
        }
        nodeData.isSelected = originallySelected == null ? true : !originallySelected;
        this.setState(this.state);
    };

    private handleNodeCollapse = (nodeData: ITreeNode) => {
        nodeData.isExpanded = false;
        this.setState(this.state);
    };

    private handleNodeExpand = (nodeData: ITreeNode) => {
        nodeData.isExpanded = true;
        this.setState(this.state);
    };

    private forEachNode(nodes: ITreeNode[], callback: (node: ITreeNode) => void) {
        if (nodes == null) {
            return;
        }

        for (const node of nodes) {
            callback(node);
            this.forEachNode(node.childNodes, callback);
        }
    }
}


