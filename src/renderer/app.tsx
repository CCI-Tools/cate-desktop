import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
    HGLContainer, HGLHeader, HGLFooter,
    HGLMidsection
} from './components/hgl';

import { Panel } from './components/panel';

import {Classes, ITreeNode, Tooltip, Tree, Button, Collapse,
    Menu, MenuDivider, MenuItem, Popover, Position } from "@blueprintjs/core";


export function main() {
    let leftStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflowX: "auto",
        overflowY: "auto",
    };
    let rightStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflowY: "auto",
    };
    let centerStyle = {
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "auto",
    };
    ReactDOM.render(
        <HGLContainer>
            <HGLHeader>
                <NavBarExample/>
            </HGLHeader>
            <HGLMidsection leftWidth={180} rightWidth={180}>
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
                <div style={centerStyle}>
                    <img src="resources/SST.png"/>
                </div>
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
            </HGLMidsection>
            <HGLFooter>
                <p>FOOTER</p>
            </HGLFooter>
        </HGLContainer>,
        document.getElementById('container')
    );
}

function NavBarExample(props) {
    return (
        <nav className="pt-navbar .modifier">
            <div className="pt-navbar-group pt-align-left">
                <div className="pt-navbar-heading">Blueprint</div>
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


export class CollapseExample1 extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }

    render() {
        return (
            <div>
                <Panel text="Tree Example" onExpandedStateChanged={this.handleOpenStateChanged}/>
                <Collapse isOpen={this.state.isOpen}>
                    <TreeExample/>
                </Collapse>
            </div>
        );
    }

    private handleClick = () => {
        this.setState({isOpen: !this.state.isOpen});
    };

    private handleOpenStateChanged = (isOpen) => {
         this.setState({isOpen: isOpen});
    };
}

export class CollapseExample2 extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false,
        };
    }

    render() {
        return (
            <div>
                <Button onClick={this.handleClick}>
                    {this.state.isOpen ? "Hide" : "Show"} build logs
                </Button>
                <Collapse isOpen={this.state.isOpen}>
                    <pre>
                        [11:53:30] Finished 'typescript-bundle-blueprint' after 769 ms<br/>
                        [11:53:30] Starting 'typescript-typings-blueprint'...<br/>
                        [11:53:30] Finished 'typescript-typings-blueprint' after 198 ms<br/>
                        [11:53:30] write ./blueprint.css<br/>
                        [11:53:30] Finished 'sass-compile-blueprint' after 2.84 s
                    </pre>
                </Collapse>
            </div>
        );
    }

    private handleClick = () => {
        this.setState({isOpen: !this.state.isOpen});
    }
}


export class DropdownMenuExample extends React.Component<any, any> {
    protected renderExample() {
        const compassMenu = (
            <Menu>
                <MenuItem iconName="graph" text="Graph" />
                <MenuItem iconName="map" text="Map" />
                <MenuItem iconName="th" text="Table" shouldDismissPopover={false} />
                <MenuItem iconName="zoom-to-fit" text="Nucleus" disabled={true} />
                <MenuDivider />
                <MenuItem iconName="cog" text="Settings...">
                    <MenuItem iconName="add" text="Add new application" disabled={true} />
                    <MenuItem iconName="remove" text="Remove application" />
                </MenuItem>
            </Menu>
        );
        return (
            <Popover content={compassMenu} position={Position.RIGHT_BOTTOM}>
                <button className="pt-button pt-icon-share" type="button">Open in...</button>
            </Popover>
        );
    }
}

