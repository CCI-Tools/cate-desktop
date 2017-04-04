import * as assert from "../../common/assert";


export type SplitDir = "hor" | "ver";

export type ViewPath = string;


export interface ViewState {
    type: "world" | "chart" | "table";
    id: string;
    title: string;
    iconName?: string;
    data?: any;
}

export type ViewRenderer = (view: ViewState) => JSX.Element;


/**
 * Definition for a panel of views with one visible at a time.
 */
export interface ViewPanelState {
    viewIds: string[];
    selectedViewId: string | null;
}

/**
 * JSON-serializable view viewLayout
 */
export interface ViewSplitState {
    /**
     * First and second panel is either a view panel given by view IDs or another ViewSplitState.
     */
    layouts: [ViewLayoutState, ViewLayoutState];

    /**
     * Direction is horizontal/vertical.
     */
    dir: SplitDir;

    /**
     * Horizontal/vertical position of 1st panel in pixels.
     */
    pos: number;
}

export type ViewLayoutState = ViewSplitState | ViewPanelState;


export function isViewSplitState(obj: any) {
    return 'layouts' in obj;
}

export function isViewPanelState(obj: any) {
    return 'viewIds' in obj;
}

export function getViewPanel(viewLayout: ViewLayoutState, viewPath: ViewPath): ViewPanelState {
    return _getViewPanel(viewLayout, viewPath, 0);
}

export function addViewToLayout(viewLayout: ViewLayoutState,
                                viewId: string): ViewLayoutState {
    return _addViewToLayout(viewLayout, viewId);
}

export function splitViewPanel(viewLayout: ViewLayoutState,
                               viewPath: ViewPath,
                               dir: SplitDir,
                               pos: number): ViewLayoutState {
    return _splitViewPanel(viewLayout, viewPath, dir, pos, 0);
}

export function changeViewSplitPos(viewLayout: ViewLayoutState,
                                   viewPath: ViewPath,
                                   delta: number): ViewLayoutState {
    return _changeViewSplitPos(viewLayout, viewPath, delta, 0);
}

export function selectViewInLayout(viewLayout: ViewLayoutState,
                                   viewPath: ViewPath,
                                   viewId: string): ViewLayoutState {
    return _selectViewInLayout(viewLayout, viewPath, viewId, 0);
}

export function removeViewFromLayout(viewLayout: ViewLayoutState,
                                     viewPath: ViewPath,
                                     viewId: string): ViewLayoutState {
    return _removeViewFromLayout(viewLayout, viewPath, viewId, 0);
}

export function removeAllViewsFromLayout(viewLayout: ViewLayoutState,
                                         viewPath: ViewPath) {
    return _removeViewFromLayout(viewLayout, viewPath, null, 0);
}

function removeViewFromViewIds(viewIds: string[], viewId: string): string[] {
    while (true) {
        const i = viewIds.indexOf(viewId);
        if (i >= 0) {
            viewIds = viewIds.slice(0, i).concat(viewIds.slice(i + 1));
        } else {
            break;
        }
    }
    return viewIds;
}

export function addViewToViewArray(views: ViewState[], view: ViewState): ViewState[] {
    return views.concat([view]);
}

export function removeViewFromViewArray(views: ViewState[], viewId: string): ViewState[] {
    while (true) {
        const i = views.findIndex(w => w.id === viewId);
        if (i >= 0) {
            views = views.slice(0, i).concat(views.slice(i + 1));
        } else {
            break;
        }
    }
    return views;
}


function _getViewPanel(viewLayout: ViewLayoutState,
                       viewPath: ViewPath,
                       pathIndex: number): ViewPanelState {
    assert.ok(pathIndex <= viewPath.length, 'illegal path index');
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        return _getViewPanel(viewSplit.layouts[viewPath[pathIndex]], viewPath, pathIndex + 1);
    } else {
        assert.ok(isViewPanelState(viewLayout), "ViewPanelState expected");
        return viewLayout as ViewPanelState;
    }
}


function _addViewToLayout(viewLayout: ViewLayoutState,
                          viewId: string): ViewLayoutState {
    if (isViewSplitState(viewLayout)) {
        const viewSplit = viewLayout as ViewSplitState;
        const oldLayout = viewSplit.layouts[0];
        const newLayout = _addViewToLayout(oldLayout, viewId);
        const layouts = [newLayout, viewSplit.layouts[1]];
        return {...viewSplit, layouts} as ViewSplitState;
    } else {
        const viewPanel = viewLayout as ViewPanelState;
        const viewIds = viewPanel.viewIds.concat([viewId]);
        return {viewIds, selectedViewId: viewId};
    }
}


function _splitViewPanel(viewLayout: ViewLayoutState,
                         viewPath: ViewPath,
                         dir: SplitDir,
                         pos: number,
                         pathIndex: number): ViewLayoutState {
    assert.ok(pathIndex <= viewPath.length, 'illegal path index');
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        const layoutIndex = viewPath.charCodeAt(pathIndex) - 48; // 48 = ascii('0')
        const oldLayout = viewSplit.layouts[layoutIndex];
        const newLayout = _splitViewPanel(oldLayout, viewPath, dir, pos, pathIndex + 1);
        let layouts;
        if (layoutIndex === 0) {
            layouts = [newLayout, viewSplit.layouts[1]];
        } else {
            layouts = [viewSplit.layouts[0], newLayout];
        }
        return {...viewSplit, layouts};
    } else {
        assert.ok(isViewPanelState(viewLayout), "ViewPanelState expected");
        const viewPanel = viewLayout as ViewPanelState;
        assert.ok(viewPanel.viewIds.length > 1, "ViewPanelState must have more than one view to be split");
        const selectedViewId = viewPanel.selectedViewId;
        const viewIds = removeViewFromViewIds(viewPanel.viewIds, selectedViewId);
        return {
            dir, pos,
            layouts: [
                {
                    viewIds: [selectedViewId],
                    selectedViewId
                },
                {
                    viewIds,
                    selectedViewId: viewIds[0]
                }
            ],
        };
    }
}

function _changeViewSplitPos(viewLayout: ViewLayoutState,
                             viewPath: ViewPath,
                             delta: number,
                             pathIndex: number): ViewLayoutState {
    assert.ok(pathIndex <= viewPath.length, 'illegal path index');
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        const layoutIndex = viewPath.charCodeAt(pathIndex) - 48; // 48 = ascii('0')
        const oldLayout = viewSplit.layouts[layoutIndex];
        const newLayout = _changeViewSplitPos(oldLayout, viewPath, delta, pathIndex + 1);
        let layouts;
        if (layoutIndex === 0) {
            layouts = [newLayout, viewSplit.layouts[1]];
        } else {
            layouts = [viewSplit.layouts[0], newLayout];
        }
        return {...viewSplit, layouts};
    } else {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        return {...viewSplit, pos: viewSplit.pos + delta};
    }
}

function _selectViewInLayout(viewLayout: ViewLayoutState,
                             viewPath: ViewPath,
                             viewId: string,
                             pathIndex: number): ViewLayoutState {
    assert.ok(pathIndex <= viewPath.length, 'illegal path index');
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        const layoutIndex = viewPath.charCodeAt(pathIndex) - 48; // 48 = ascii('0')
        const oldLayout = viewSplit.layouts[layoutIndex];
        const newLayout = _selectViewInLayout(oldLayout, viewPath, viewId, pathIndex + 1);
        if (oldLayout === newLayout) {
            // No change!
            return viewSplit;
        }
        let layouts;
        if (layoutIndex === 0) {
            layouts = [newLayout, viewSplit.layouts[1]];
        } else {
            layouts = [viewSplit.layouts[0], newLayout];
        }
        return {...viewSplit, layouts};
    } else {
        assert.ok(isViewPanelState(viewLayout), "ViewPanelState expected");
        const viewPanel = viewLayout as ViewPanelState;
        let viewIds = viewPanel.viewIds;
        if (viewId === viewPanel.selectedViewId) {
            // No change!
            return viewPanel;
        }
        assert.ok(viewIds.indexOf(viewId) >= 0, "viewId not found");
        return {viewIds: viewIds, selectedViewId: viewId};
    }
}

function _removeViewFromLayout(viewLayout: ViewLayoutState,
                               viewPath: ViewPath,
                               viewId: string | null,
                               pathIndex: number): ViewLayoutState {
    assert.ok(pathIndex <= viewPath.length, 'illegal path index');
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        const layoutIndex = viewPath.charCodeAt(pathIndex) - 48; // 48 = ascii('0')
        const oldLayout = viewSplit.layouts[layoutIndex];
        const newLayout = _removeViewFromLayout(oldLayout, viewPath, viewId, pathIndex + 1);
        if (oldLayout === newLayout) {
            // No change!
            return viewSplit;
        }
        if (isViewPanelState(newLayout) && (newLayout as ViewPanelState).viewIds.length === 0) {
            // A panel has been returned which is now empty, so return the other panel that is left.
            if (layoutIndex === 0) {
                return viewSplit.layouts[1];
            } else {
                return viewSplit.layouts[0];
            }
        }

        let layouts;
        if (layoutIndex === 0) {
            layouts = [newLayout, viewSplit.layouts[1]];
        } else {
            layouts = [viewSplit.layouts[0], newLayout];
        }

        return {...viewSplit, layouts};
    } else {
        assert.ok(isViewPanelState(viewLayout), "ViewPanelState expected");
        const viewPanel = viewLayout as ViewPanelState;
        if (viewId) {
            const viewIds = removeViewFromViewIds(viewPanel.viewIds, viewId);
            if (viewIds === viewPanel.viewIds) {
                // No change!
                return viewPanel;
            }
            let selectedViewId = viewPanel.selectedViewId;
            if (selectedViewId === viewId) {
                selectedViewId = viewIds.length > 0 ? viewIds[viewIds.length - 1] : null;
            }

            return {viewIds, selectedViewId};
        } else {
            return {viewIds: [], selectedViewId: null};
        }
    }
}

