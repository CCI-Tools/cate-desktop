import * as React from 'react';
import {Colors} from "@blueprintjs/core";
import {Splitter} from "./Splitter";
import {isViewSplitState, ViewState, ViewSplitState, ViewPanelState, ViewLayoutState, Direction} from "./ViewState";

interface IViewManagerProps {
    viewLayout: ViewLayoutState;
    views: ViewState[];
    onClose: (viewPath: number[], viewId: string) => void;
    onCloseAll: (viewPath: number[]) => void;
    onSplit: (viewPath: number[], dir: Direction, pos: number) => void;
    onSplitPosChange: (viewPath: number[], delta: number) => void;
}

interface IViewManagerState {
}

export class ViewManager extends React.PureComponent<IViewManagerProps, IViewManagerState> {

    private viewMap: {[id: string]: ViewState};

    constructor(props: IViewManagerProps) {
        super(props);
        this.viewMap = ViewManager.createViewMap(this.props.views);
    }

    static createViewMap(views: ViewState[]) {
        const map = {};
        views.forEach(w => {
            map[w.id] = w;
        });
        return map;
    }

    componentWillReceiveProps(nextProps: IViewManagerProps): void {
        this.viewMap = ViewManager.createViewMap(nextProps.views);
    }

    render() {
        if (isViewSplitState(this.props.viewLayout)){
            return this.renderViewSplit(this.props.viewLayout as ViewSplitState, []);
        } else {
            return this.renderViewPanel(this.props.viewLayout as ViewPanelState, []);
        }
    }

    renderViewSplit(viewSplit: ViewSplitState, viewPath: number[]) {

        let renderedLayout1;
        let layout1 = viewSplit.layouts[0];
        if (isViewSplitState(layout1)) {
            renderedLayout1 = this.renderViewSplit(layout1 as ViewSplitState, [...viewPath, 0]);
        } else {
            renderedLayout1 = this.renderViewPanel(layout1 as ViewPanelState, [...viewPath, 0]);
        }

        let renderedLayout2;
        let layout2 = viewSplit.layouts[1];
        if (isViewSplitState(layout2)) {
            renderedLayout2 = this.renderViewSplit(layout2 as ViewSplitState, [...viewPath, 1]);
        } else {
            renderedLayout2 = this.renderViewPanel(layout2 as ViewPanelState, [...viewPath, 1]);
        }

        if (renderedLayout1 && renderedLayout2) {
            let containerStyle;
            let childContainer1Style;
            let childContainer2Style;
            if (viewSplit.dir === 'hor') {
                containerStyle = {
                    width: "100%",
                    display: "flex",
                    flexFlow: "row nowrap",
                    flex: "auto",
                };
                childContainer1Style = {flex: 'none', width: viewSplit.pos, height: '100%'};
                childContainer2Style = {flex: 'auto', height: '100%'};
            } else {
                containerStyle = {
                    height: "100%",
                    display: "flex",
                    flexFlow: "column nowrap",
                    flex: "auto",
                };
                childContainer1Style = {flex: 'none', width: '100%', height: viewSplit.pos};
                childContainer2Style = {flex: 'auto', width: '100%'};
            }

            return (
                <div style={containerStyle}>
                    <div style={childContainer1Style}>
                        {renderedLayout1}
                    </div>
                    <Splitter dir={viewSplit.dir}
                              onChange={(delta: number) => this.props.onSplitPosChange(viewPath, delta)}/>
                    <div style={childContainer2Style}>
                        {renderedLayout2}
                    </div>
                </div>
            );
        } else if (renderedLayout1) {
            return renderedLayout1;
        } else if (renderedLayout2) {
            return renderedLayout2;
        }
        return null;
    }

    renderViewPanel(viewPanel: ViewPanelState, viewPath: number[]) {
        const viewIds = viewPanel.viewIds;
        if (!viewIds || !viewIds.length) {
            return null;
        }
        const selectedViewId = viewPanel.selectedViewId;
        const viewDefs = [];
        let selectedViewDef = null;
        viewIds.forEach(id => {
            const viewDef = this.viewMap[id];
            if (viewDef) {
                if (selectedViewId && id === selectedViewId) {
                    selectedViewDef = viewDef;
                }
                viewDefs.push(viewDef);
            }
        });
        return (
            <ViewPanel
                viewPath={viewPath}
                views={viewDefs}
                selectedView={selectedViewDef}
                onClose={this.props.onClose}
                onCloseAll={this.props.onCloseAll}
                onSplit={this.props.onSplit}
            />
        );
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewPanel

interface IViewPanelProps {
    viewPath: number[];
    views: ViewState[];
    selectedView: ViewState|null;
    onClose: (viewPath: number[], viewId: string) => void;
    onCloseAll: (viewPath: number[]) => void;
    onSplit: (viewPath: number[], dir:"hor"|"ver", pos: number) => void;
}

class ViewPanel extends React.PureComponent<IViewPanelProps, null> {
    static readonly TAB_STYLE_SELECTED = {color: Colors.WHITE, backgroundColor: Colors.DARK_GRAY1};
    static readonly TAB_STYLE_NORMAL = {color: Colors.GRAY5, backgroundColor: Colors.DARK_GRAY5};

    static readonly TITLE_STYLE = {padding: 4};

    static readonly CLOSE_ICON_STYLE_SELECTED = {marginLeft: 6};
    static readonly CLOSE_ICON_STYLE_NORMAL = {marginLeft: 6, color: Colors.DARK_GRAY5};

    static readonly MENU_ICON_STYLE = {color: Colors.GRAY5};

    private contentElement: HTMLDivElement;

    constructor(props: IViewPanelProps) {
        super(props);
        this.onSplitHor = this.onSplitHor.bind(this);
        this.onSplitVer = this.onSplitVer.bind(this);
        this.onContentDivRef = this.onContentDivRef.bind(this);
    }

    onSplitHor() {
        this.props.onSplit(this.props.viewPath, "hor", 0.5 * this.contentElement.clientWidth);
    }

    onSplitVer() {
        this.props.onSplit(this.props.viewPath, "ver", 0.5 * this.contentElement.clientHeight);
    }

    onContentDivRef(contentElement: HTMLDivElement) {
        this.contentElement = contentElement;
    }

    render() {
        const views = this.props.views;
        if (!views.length) {
            return <div style={{width:"100%", height:"100%"}}/>
        }
        const selectedView = this.props.selectedView;
        let selectedContent;
        const tabs = [];
        for (let i = 0; i < views.length; i++) {
            let view = views[i];
            let viewId = view.id;
            let viewTitle = view.title;
            let viewIconName = view.iconName;
            let tabStyle;
            let titleStyle;
            let closeIconStyle;
            if (selectedView && selectedView.id === viewId) {
                selectedContent = view.renderContent(view);
                tabStyle = ViewPanel.TAB_STYLE_SELECTED;
                titleStyle = ViewPanel.TITLE_STYLE;
                closeIconStyle = ViewPanel.CLOSE_ICON_STYLE_SELECTED;
            } else {
                tabStyle = ViewPanel.TAB_STYLE_NORMAL;
                titleStyle = ViewPanel.TITLE_STYLE;
                closeIconStyle = ViewPanel.CLOSE_ICON_STYLE_NORMAL;
            }
            let iconSpan;
            if (viewIconName && viewIconName !== '') {
                iconSpan = <span className={"pt-icon-standard " + viewIconName} style={titleStyle}/>;
            }
            const onClose = () => {
                this.props.onClose(this.props.viewPath, viewId);
            };
            tabs.push(
                <span key={viewId} style={tabStyle}>
                    {iconSpan}
                    <span style={titleStyle}>{viewTitle}</span>
                    <span style={closeIconStyle} className="pt-icon-standard pt-icon-cross" onClick={onClose}/>
                </span>
            );
        }

        let menu;
        if (views.length > 1) {
            const menuIconStyle = ViewPanel.MENU_ICON_STYLE;
            menu = [
                <span key="splitHor" style={menuIconStyle} className="pt-icon-standard pt-icon-add-row-bottom" onClick={this.onSplitHor}/>,
                <span key="splitVer" style={menuIconStyle} className="pt-icon-standard pt-icon-add-column-right" onClick={this.onSplitVer}/>,
                <span key="more" style={menuIconStyle} className="pt-icon-standard pt-icon-more"/>,
            ];
        }

        return (
            <div style={{display: "flex", width:"100%", height:"100%"}}>
                <div style={{display: "flex", flexDirection: "col", flex: "none", width:"100%"}}>
                    <div style={{flex: "none"}}>{tabs}</div>
                    <div style={{flex: "auto"}}/>
                    <div style={{flex: "none"}}>{menu}</div>
                </div>
                <div style={{flex: "auto", width:"100%", padding: 2}} ref={this.onContentDivRef}>
                    {selectedContent}
                </div>
            </div>
        );
    }
}




