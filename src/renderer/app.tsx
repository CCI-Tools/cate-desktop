import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {Classes, ITreeNode, Tooltip, Tree, Tab, TabList, TabPanel, Tabs} from "@blueprintjs/core";
import {HGLContainer, HGLHeader, HGLFooter, HGLMidsection} from './components/hgl';
import {Panel} from './components/panel';


export function main() {
    const leftStyle = {
        width: "100%",
        height: "100%",
        overflow: "auto",
    };
    const rightStyle = {
        width: "100%",
        height: "100%",
        overflow: "auto",
    };
    const centerStyle = {
        width: "100%",
        height: "100%",
        overflow: "auto",
    };
    const closeIconName = "pt-icon-cross";

    ReactDOM.render(
        <HGLContainer>
            <HGLHeader>
                <NavBarExample/>
            </HGLHeader>
            <HGLMidsection leftWidth={180} rightWidth={180}>
                <Tabs>
                    <TabList>
                        <Tab>Tools-1</Tab>
                        <Tab>Tools-2</Tab>
                    </TabList>
                    <TabPanel>
                        <div style={leftStyle}>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <div style={leftStyle}>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                        </div>
                    </TabPanel>
                </Tabs>
                <Tabs>
                    <TabList>
                        {/* TODO: create component CloseableTab */}
                        <Tab>
                            <div className="cate-tab-header">
                                <span>View-1</span>
                                <span className={"pt-icon-standard  " + closeIconName + " cate-icon-small"}/>
                            </div>
                        </Tab>
                        <Tab>
                            <div className="cate-tab-header">
                                <span>View-2</span>
                                <span className={"pt-icon-standard  " + closeIconName + " cate-icon-small"}/>
                            </div>
                        </Tab>
                    </TabList>

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
                <Tabs>
                    <TabList>
                        <Tab>Tools-3</Tab>
                        <Tab>Tools-4</Tab>
                    </TabList>
                    <TabPanel>
                        <div style={rightStyle}>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                            <CollapseExample2/>
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <div style={rightStyle}>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                            <CollapseExample1/>
                        </div>
                    </TabPanel>
                </Tabs>
            </HGLMidsection>
            <HGLFooter>
                <p>FOOTER</p>
            </HGLFooter>
        </HGLContainer>,
        document.getElementById('container')
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

//noinspection JSUnusedLocalSymbols
function CollapseExample1(props: any) {
    return (
        <Panel text="Tree Example">
            <TreeExample/>
        </Panel>
    );
}

//noinspection JSUnusedLocalSymbols
function CollapseExample2(props: any) {
    return (
        <Panel text="Build Logs">
            <pre>
                [11:53:30] Finished 'typescript-bundle-blueprint' after 769 ms<br/>
                [11:53:30] Starting 'typescript-typings-blueprint'...<br/>
                [11:53:30] Finished 'typescript-typings-blueprint' after 198 ms<br/>
                [11:53:30] write ./blueprint.css<br/>
                [11:53:30] Finished 'sass-compile-blueprint' after 2.84 s
            </pre>
        </Panel>
    );
}


