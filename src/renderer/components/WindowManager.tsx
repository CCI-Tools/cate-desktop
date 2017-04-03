import * as React from 'react';
import {Colors} from "@blueprintjs/core";
import {Splitter} from "./Splitter";

//noinspection JSUnusedGlobalSymbols
export function removeWindowFromLayout(windowLayout: WindowLayout, windowPath: number[], windowId: string) {
    if (windowPath.length === 0) {
        return windowLayout;
    }
    return _removeWindowFromLayout(windowLayout, windowPath, windowId, 0);
}

function _removeWindowFromLayout(windowLayout: WindowLayout, windowPath: number[], windowId: string, pathIndex: number) {
    const panelIndex = windowPath[pathIndex];
    const oldPanel = windowLayout.panels[panelIndex];
    let newPanel;
    if (isWindowLayout(oldPanel)) {
        newPanel = _removeWindowFromLayout(oldPanel as WindowLayout, windowPath, windowId, pathIndex + 1);
    } else {
        newPanel = removeWindowFromPanel(oldPanel as WindowPanelDef, windowId);
    }
    if (newPanel === oldPanel) {
        // No change!
        return windowLayout;
    }

    let panels;
    if (panelIndex === 0) {
        panels = [newPanel, windowLayout.panels[1]];
    } else {
        panels = [windowLayout.panels[0], newPanel];
    }

    return {...windowLayout, panels};
}

function removeWindowFromPanel(windowPanel: WindowPanelDef, windowId: string) {
    const windowIds = removeWindowFromWindowIds(windowPanel.windowIds, windowId);
    if (windowIds === windowPanel.windowIds) {
        // No change!
        return windowPanel;
    }

    let selectedWindowId = windowPanel.selectedWindowId;
    if (selectedWindowId === windowId) {
        selectedWindowId = windowIds.length > 0 ? windowIds[windowIds.length - 1] : null;
    }

    return {...windowPanel, windowIds, selectedWindowId};
}

function removeWindowFromWindowIds(windowIds: string[], windowId: string): string[] {
    while (true) {
        const i = windowIds.indexOf(windowId);
        if (i >= 0) {
            windowIds = windowIds.slice(0, i).concat(windowIds.slice(i + 1));
        } else {
            break;
        }
    }
    return windowIds;
}

//noinspection JSUnusedGlobalSymbols
export function removeWindowFromWindows(windows: WindowDef[], windowId: string): WindowDef[] {
    while (true) {
        const i = windows.findIndex(w => w.id === windowId);
        if (i >= 0) {
            windows = windows.slice(0, i).concat(windows.slice(i + 1));
        } else {
            break;
        }
    }
    return windows;
}


export function isWindowLayout(obj: any) {
    return 'path' in obj && 'panel1' in obj && 'panel2' in obj;
}

interface WindowDef {
    id: string;
    type: "world" | "chart" | "table";
    title: string;
    iconName?: string;
    onClose: () => void;
    renderContent: (window: WindowDef) => JSX.Element;
}

interface WindowPanelDef {
    windowIds: string[];
    selectedWindowId: string | null;
}

/**
 * JSON-serializable window layout
 */
interface WindowLayout {
    /**
     * The path to this layout. The root path is an empty string. Path a 1st panel of a layout is indicated by a
     * "1", path to a 2nd panel by a "2".
     */
    path: number[];

    /**
     * First and second panel is either a window panel given by window IDs or another WindowLayout.
     */
    panels: [WindowLayout | WindowPanelDef, WindowLayout | WindowPanelDef];

    /**
     * Direction is horizontal/vertical.
     */
    dir: "hor"|"ver";

    /**
     * Horizontal/vertical position in pixels.
     */
    pos: number;
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WindowManager


interface IWindowManagerProps {
    layout: WindowLayout;
    windows: WindowDef[];
    onClose: (windowPath: number[], windowId: string) => void;
    onCloseAll: (windowPath: number[]) => void;
    onSplitHor: (windowPath: number[]) => void;
    onSplitVer: (windowPath: number[]) => void;
    onSplitPosChange: (windowPath: number[], delta: number) => void;
}

interface IWindowManagerState {
}

export class WindowManager extends React.PureComponent<IWindowManagerProps, IWindowManagerState> {

    private windowMap: {[id: string]: WindowDef};

    constructor(props: IWindowManagerProps) {
        super(props);
        this.windowMap = WindowManager.createWindowMap(this.props.windows);
    }

    static createWindowMap(windows: WindowDef[]) {
        const map = {};
        windows.forEach(w => {
            map[w.id] = w;
        });
        return map;
    }

    componentWillReceiveProps(nextProps: IWindowManagerProps): void {
        this.windowMap = WindowManager.createWindowMap(nextProps.windows);
    }

    render() {
        return this.renderWindowLayout(this.props.layout);
    }

    renderWindowLayout(layout: WindowLayout) {

        let renderedPanel1;
        let panel1 = layout.panels[0];
        if (isWindowLayout(panel1)) {
            renderedPanel1 = this.renderWindowLayout(panel1 as WindowLayout);
        } else {
            renderedPanel1 = this.renderWindowPanel(panel1 as WindowPanelDef, [...layout.path, 0]);
        }

        let renderedPanel2;
        let panel2 = layout.panels[1];
        if (isWindowLayout(panel2)) {
            renderedPanel2 = this.renderWindowLayout(panel2 as WindowLayout);
        } else {
            renderedPanel2 = this.renderWindowPanel(panel2 as WindowPanelDef, [...layout.path, 1]);
        }

        if (renderedPanel1 && renderedPanel2) {
            let containerStyle;
            let childContainer1Style;
            let childContainer2Style;
            if (layout.dir === 'hor') {
                containerStyle = {
                    width: "100%",
                    display: "flex",
                    flexFlow: "row nowrap",
                    flex: "auto",
                };
                childContainer1Style = {flex: 'none', width: layout.pos, height: '100%'};
                childContainer2Style = {flex: 'auto', height: '100%'};
            } else {
                containerStyle = {
                    height: "100%",
                    display: "flex",
                    flexFlow: "column nowrap",
                    flex: "auto",
                };
                childContainer1Style = {flex: 'none', width: '100%', height: layout.pos};
                childContainer2Style = {flex: 'auto', width: '100%'};
            }

            return (
                <div style={containerStyle}>
                    <div style={childContainer1Style}>
                        {renderedPanel1}
                    </div>
                    <Splitter dir={layout.dir}
                              onChange={(delta: number) => this.props.onSplitPosChange(layout.path, delta)}/>
                    <div style={childContainer2Style}>
                        {renderedPanel2}
                    </div>
                </div>
            );
        } else if (renderedPanel1) {
            return renderedPanel1;
        } else if (renderedPanel2) {
            return renderedPanel2;
        }
        return null;
    }

    renderWindowPanel(windowPanel: WindowPanelDef, windowPath: number[]) {
        const windowIds = windowPanel.windowIds;
        if (!windowIds || !windowIds.length) {
            return null;
        }
        const selectedWindowId = windowPanel.selectedWindowId;
        const windowDefs = [];
        let selectedWindowDef = null;
        windowIds.forEach(id => {
            const windowDef = this.windowMap[id];
            if (windowDef) {
                if (selectedWindowId && id === selectedWindowId) {
                    selectedWindowDef = windowDef;
                }
                windowDefs.push(windowDef);
            }
        });
        return (
            <WindowPanel
                windowPath={windowPath}
                windows={windowDefs}
                selectedWindow={selectedWindowDef}
                onClose={this.props.onClose}
                onCloseAll={this.props.onCloseAll}
                onSplitHor={this.props.onSplitHor}
                onSplitVer={this.props.onSplitVer}
            />
        );
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WindowPanel

interface IWindowPanelProps {
    windowPath: number[];
    windows: WindowDef[];
    selectedWindow: WindowDef|null;
    onClose: (windowPath: number[], windowId: string) => void;
    onCloseAll: (windowPath: number[]) => void;
    onSplitHor: (windowPath: number[]) => void;
    onSplitVer: (windowPath: number[]) => void;
}

class WindowPanel extends React.PureComponent<IWindowPanelProps, null> {
    static readonly TAB_STYLE_SELECTED = {color: Colors.WHITE, backgroundColor: Colors.DARK_GRAY1};
    static readonly TAB_STYLE_NORMAL = {color: Colors.GRAY5, backgroundColor: Colors.DARK_GRAY5};

    static readonly TITLE_STYLE = {padding: 4};

    static readonly CLOSE_ICON_STYLE_SELECTED = {marginLeft: 6};
    static readonly CLOSE_ICON_STYLE_NORMAL = {marginLeft: 6, color: Colors.DARK_GRAY5};

    static readonly MENU_ICON_STYLE = {color: Colors.GRAY5};

    constructor(props: IWindowPanelProps) {
        super(props);
        this.onSplitHor = this.onSplitHor.bind(this);
        this.onSplitVer = this.onSplitVer.bind(this);
    }

    onSplitHor() {
        this.props.onSplitHor(this.props.windowPath);
    }

    onSplitVer() {
        this.props.onSplitVer(this.props.windowPath);
    }

    render() {
        const windows = this.props.windows;
        if (!windows.length) {
            return <div style={{width:"100%", height:"100%"}}/>
        }
        const selectedWindow = this.props.selectedWindow;
        let selectedContent;
        const tabs = [];
        for (let i = 0; i < windows.length; i++) {
            let window = windows[i];
            let windowId = window.id;
            let windowTitle = window.title;
            let windowIconName = window.iconName;
            let tabStyle;
            let titleStyle;
            let closeIconStyle;
            if (selectedWindow && selectedWindow.id === windowId) {
                selectedContent = window.renderContent(window);
                tabStyle = WindowPanel.TAB_STYLE_SELECTED;
                titleStyle = WindowPanel.TITLE_STYLE;
                closeIconStyle = WindowPanel.CLOSE_ICON_STYLE_SELECTED;
            } else {
                tabStyle = WindowPanel.TAB_STYLE_NORMAL;
                titleStyle = WindowPanel.TITLE_STYLE;
                closeIconStyle = WindowPanel.CLOSE_ICON_STYLE_NORMAL;
            }
            let iconSpan;
            if (windowIconName && windowIconName !== '') {
                iconSpan = <span className={"pt-icon-standard " + windowIconName} style={titleStyle}/>;
            }
            const onClose = () => {
                this.props.onClose(this.props.windowPath, windowId);
            };
            tabs.push(
                <span key={windowId} style={tabStyle}>
                    {iconSpan}
                    <span style={titleStyle}>{windowTitle}</span>
                    <span style={closeIconStyle} className="pt-icon-standard pt-icon-cross" onClick={onClose}/>
                </span>
            );
        }

        let menu;
        if (windows.length > 1) {
            menu = [
                <span key="splitHor" className="pt-icon-standard pt-icon-add-row-bottom" onClick={this.onSplitHor}/>,
                <span key="splitVer" className="pt-icon-standard pt-icon-add-column-right" onClick={this.onSplitVer}/>,
                <span key="more" className="pt-icon-standard pt-icon-more"/>,
            ];
        }

        return (
            <div style={{display: "flex", width:"100%", height:"100%"}}>
                <div style={{display: "flex", flexDirection: "col", flex: "none", width:"100%"}}>
                    <div style={{flex: "none"}}>{tabs}</div>
                    <div style={{flex: "auto"}}/>
                    <div style={{flex: "none"}}>{menu}</div>
                </div>
                <div style={{flex: "auto", width:"100%"}}>
                    {selectedContent}
                </div>
            </div>
        );
    }
}




