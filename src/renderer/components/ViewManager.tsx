import * as React from 'react';
import {Colors, NonIdealState} from "@blueprintjs/core";
import {Splitter, SplitDir} from "./Splitter";
import {
    isViewSplitState, ViewState, ViewSplitState, ViewPanelState, ViewLayoutState, ViewPath,
    ViewRenderer
} from "./ViewState";


export type ViewTypeRenderers = {[viewType: string]: ViewRenderer};

interface IViewManagerProps {
    viewTypeRenderers: ViewTypeRenderers;
    viewLayout: ViewLayoutState;
    views: ViewState[];
    noViewsDescription?: string|null;
    noViewsAction?: JSX.Element|null;
    onSelectView: (viewPath: ViewPath, viewId: string) => void;
    onCloseView: (viewPath: ViewPath, viewId: string) => void;
    onCloseAllViews: (viewPath: ViewPath) => void;
    onSplitViewPanel: (viewPath: ViewPath, dir: SplitDir, pos: number) => void;
    onChangeViewSplitPos: (viewPath: ViewPath, delta: number) => void;
}

interface IViewManagerState {
}

export class ViewManager extends React.PureComponent<IViewManagerProps, IViewManagerState> {

    private viewMap: {[id: string]: ViewState};

    constructor(props: IViewManagerProps) {
        super(props);
        this.viewMap = ViewManager.createViewMap(this.props.views);
        console.log('ViewManager.constructor: viewMap: ', this.viewMap);
    }

    componentWillReceiveProps(nextProps: IViewManagerProps): void {
        this.viewMap = ViewManager.createViewMap(nextProps.views);
        console.log('ViewManager.constructor: viewMap: ', this.viewMap);
    }

    static createViewMap(views: ViewState[]) {
        const map = {};
        views.forEach(w => {
            map[w.id] = w;
        });
        return map;
    }

    render() {
        if (!this.props.views.length) {
            return this.renderNoViews();
        }
        if (isViewSplitState(this.props.viewLayout)) {
            return this.renderViewSplit(this.props.viewLayout as ViewSplitState, '');
        } else {
            return this.renderViewPanel(this.props.viewLayout as ViewPanelState, '');
        }
    }

    renderNoViews() {
        return (
            <div style={{width:"100%", maxHeight:"100%", flex: "auto"}}>
                <NonIdealState
                    visual="globe"
                    title="No views opened"
                    description={this.props.noViewsDescription}
                    action={this.props.noViewsAction}
                />
            </div>
        );
    }

    renderViewSplit(viewSplit: ViewSplitState, viewPath: ViewPath) {

        let renderedLayout1;
        let layout1 = viewSplit.layouts[0];
        if (isViewSplitState(layout1)) {
            renderedLayout1 = this.renderViewSplit(layout1 as ViewSplitState, viewPath + '0');
        } else {
            renderedLayout1 = this.renderViewPanel(layout1 as ViewPanelState, viewPath + '0');
        }

        let renderedLayout2;
        let layout2 = viewSplit.layouts[1];
        if (isViewSplitState(layout2)) {
            renderedLayout2 = this.renderViewSplit(layout2 as ViewSplitState, viewPath + '1');
        } else {
            renderedLayout2 = this.renderViewPanel(layout2 as ViewPanelState, viewPath + '1');
        }

        if (renderedLayout1 && renderedLayout2) {
            let containerStyle;
            let childContainer1Style;
            let childContainer2Style;
            if (viewSplit.dir === 'hor') {
                containerStyle = {
                    width: "100%",
                    maxWidth: "100%",
                    display: "flex",
                    flexFlow: "row nowrap",
                    flex: "auto",
                };
                childContainer1Style = {flex: 'none', width: viewSplit.pos, height: '100%'};
                childContainer2Style = {flex: 'auto', height: '100%'};
            } else {
                containerStyle = {
                    height: "100%",
                    maxHeight: "100%",
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
                              onChange={(delta: number) => this.props.onChangeViewSplitPos(viewPath, delta)}/>
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

    renderViewPanel(viewPanel: ViewPanelState, viewPath: ViewPath) {
        return (
            <ViewPanel
                viewTypeRenderers={this.props.viewTypeRenderers}
                viewMap={this.viewMap}
                viewPath={viewPath}
                viewIds={viewPanel.viewIds}
                selectedViewId={viewPanel.selectedViewId}
                onSelectView={this.props.onSelectView}
                onCloseView={this.props.onCloseView}
                onCloseAllViews={this.props.onCloseAllViews}
                onSplitViewPanel={this.props.onSplitViewPanel}
            />
        );
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ViewPanel

interface IViewPanelProps {
    viewTypeRenderers: ViewTypeRenderers;
    viewMap: {[viewId: string]: ViewState};
    viewPath: ViewPath;
    viewIds: string[];
    selectedViewId: string|null;
    onSelectView: (viewPath: ViewPath, viewId: string) => void;
    onCloseView: (viewPath: ViewPath, viewId: string) => void;
    onCloseAllViews: (viewPath: ViewPath) => void;
    onSplitViewPanel: (viewPath: ViewPath, dir: SplitDir, pos: number) => void;
}

class ViewPanel extends React.PureComponent<IViewPanelProps, null> {

    static readonly SELECTED_BG_COLOR = Colors.DARK_GRAY1;
    static readonly TAB_STYLE_SELECTED = {
        padding: 2,
        flex: "none",
        color: Colors.WHITE,
        backgroundColor: ViewPanel.SELECTED_BG_COLOR
    };
    static readonly TAB_STYLE_NORMAL = {padding: 2, color: Colors.GRAY5};

    static readonly TITLE_STYLE = {paddingLeft: 4, paddingRight: 4};

    static readonly CLOSE_ICON_STYLE_SELECTED = {marginLeft: 6};
    static readonly CLOSE_ICON_STYLE_NORMAL = {marginLeft: 6, transition: "color 0.5s linear"};

    static readonly MENU_ICON_STYLE = {color: Colors.GRAY5};

    private contentElement: HTMLDivElement;

    constructor(props: IViewPanelProps) {
        super(props);
        this.onSplitHor = this.onSplitHor.bind(this);
        this.onSplitVer = this.onSplitVer.bind(this);
        this.onContentDivRef = this.onContentDivRef.bind(this);
    }

    onSplitHor() {
        this.props.onSplitViewPanel(this.props.viewPath, "hor", 0.5 * this.contentElement.clientWidth);
    }

    onSplitVer() {
        this.props.onSplitViewPanel(this.props.viewPath, "ver", 0.5 * this.contentElement.clientHeight);
    }

    onContentDivRef(contentElement: HTMLDivElement) {
        console.log('ViewPanel.onContentDivRef: contentElement:', contentElement);
        this.contentElement = contentElement;
    }

    render() {
        const viewIds = this.props.viewIds;
        if (!viewIds || !viewIds.length) {
            return null;
        }

        const selectedViewId = this.props.selectedViewId;
        const views = [];
        let selectedView = null;
        viewIds.forEach(id => {
            const view = this.props.viewMap[id];
            if (view) {
                if (selectedViewId && id === selectedViewId) {
                    selectedView = view;
                }
                views.push(view);
            }
        });

        console.log('ViewPanel.render: views: ', views);
        console.log('ViewPanel.render: selectedView: ', selectedView);

        let renderedViewContent;
        const tabItems = [];
        for (let i = 0; i < views.length; i++) {
            let view = views[i];
            let viewId = view.id;
            let viewTitle = view.title;
            let viewIconName = view.iconName;
            let tabStyle;
            let titleStyle;
            let closeIconStyle;
            if (selectedView && selectedView.id === viewId) {
                let viewRenderer = this.props.viewTypeRenderers[view.type];
                renderedViewContent = viewRenderer(view);
                tabStyle = ViewPanel.TAB_STYLE_SELECTED;
                titleStyle = ViewPanel.TITLE_STYLE;
                closeIconStyle = ViewPanel.CLOSE_ICON_STYLE_SELECTED;
            } else {
                tabStyle = ViewPanel.TAB_STYLE_NORMAL;
                titleStyle = ViewPanel.TITLE_STYLE;
                closeIconStyle = ViewPanel.CLOSE_ICON_STYLE_NORMAL;
            }

            const onClose = () => {
                this.props.onCloseView(this.props.viewPath, viewId);
            };
            const onSelect = () => {
                this.props.onSelectView(this.props.viewPath, viewId);
            };

            let iconSpan;
            if (viewIconName && viewIconName !== '') {
                iconSpan = <span className={"pt-icon-standard " + viewIconName} style={titleStyle} onClick={onSelect}/>;
            }
            tabItems.push(
                <div key={viewId} style={tabStyle}>
                    {iconSpan}
                    <span style={titleStyle} onClick={onSelect}>{viewTitle}</span>
                    <span style={closeIconStyle} className="pt-icon-standard pt-icon-cross" onClick={onClose}/>
                </div>
            );
        }

        const tabs = (<div style={{flex: "none", display: "flex", flexDirection: "row"}}>{tabItems}</div>);
        const spacer = (<div key="spacer" style={{flex: "auto"}}/>);

        let menu;
        if (views.length > 1) {
            const menuIconStyle = ViewPanel.MENU_ICON_STYLE;
            menu = (
                <div style={{flex: "none"}}>
                    <span key="splitHor" style={menuIconStyle} className="pt-icon-standard pt-icon-add-row-bottom"
                          onClick={this.onSplitHor}/>
                    <span key="splitVer" style={menuIconStyle} className="pt-icon-standard pt-icon-add-column-right"
                          onClick={this.onSplitVer}/>
                    <span key="more" style={menuIconStyle} className="pt-icon-standard pt-icon-more"/>,
                </div>
            );
        }

        let headerStyle = {
            display: "flex",
            flexDirection: "row",
            flex: "none",
            width:"100%",
            marginTop: 2,
            borderBottomStyle:"solid",
            borderBottomWidth: 2,
            borderBottomColor: ViewPanel.SELECTED_BG_COLOR
        };

        return (
            <div style={{display: "flex", flexDirection: "column", width:"100%", maxHeight:"100%"}}>
                <div style={headerStyle}>
                    {tabs}
                    {spacer}
                    {menu}
                </div>
                <div style={{display: "flex", flexDirection: "column", flex: 1, width:"100%"}} ref={this.onContentDivRef}>
                    {renderedViewContent}
                </div>
            </div>
        );
    }
}




