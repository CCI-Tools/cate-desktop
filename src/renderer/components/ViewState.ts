import * as assert from "../../common/assert";


export type SplitDir = "hor" | "ver";

export type ViewPath = string;


export interface ViewState<T> {
    id: string;
    title: string;
    iconName?: string;
    /**
     * The view type is used to lookup the renderer for this kind of view, e.g. "world".
     */
        type: string;
    /**
     * Type T of 'data' property depends on 'type' property, e.g. if type is "world",
     * data may contains a layer list, the selected layer, and a projection code.
     */
    data: T;
}

export type ViewRenderer<T> = (view: ViewState<T>) => JSX.Element;


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

export function findViewPanel(viewLayout: ViewLayoutState,
                              filter: (viewPanel: ViewPanelState) => boolean): ViewPanelState|null {
    if (isViewPanelState(viewLayout)) {
        const viewPanel = viewLayout as ViewPanelState;
        return filter && filter(viewPanel) ? viewPanel : null;
    }
    assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
    const viewSplit = viewLayout as ViewSplitState;
    return findViewPanel(viewSplit.layouts[0], filter) || findViewPanel(viewSplit.layouts[1], filter);
}

export function addViewToPanel(viewLayout: ViewLayoutState,
                               placeAfterViewId: string,
                               viewId: string): ViewLayoutState {
    return _addViewToPanel(viewLayout, placeAfterViewId, viewId);
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

export function addViewToViewArray(views: ViewState<any>[], view: ViewState<any>): ViewState<any>[] {
    return views.concat([view]);
}

export function removeViewFromViewArray(views: ViewState<any>[], viewId: string): ViewState<any>[] {
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
    if (isViewPanelState(viewLayout)) {
        return viewLayout as ViewPanelState;
    }
    if (pathIndex < viewPath.length) {
        assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
        const viewSplit = viewLayout as ViewSplitState;
        const layoutIndex = viewPath[pathIndex];
        return _getViewPanel(viewSplit.layouts[layoutIndex], viewPath, pathIndex + 1);
    } else {
        return null;
    }
}


function _addViewToPanel(viewLayout: ViewLayoutState,
                         placeAfterViewId: string,
                         viewId: string): ViewLayoutState {
    if (isViewSplitState(viewLayout)) {
        const viewSplit = viewLayout as ViewSplitState;
        let oldLayout1 = viewSplit.layouts[0];
        let oldLayout2 = viewSplit.layouts[1];
        let newLayout1 = _addViewToPanel(oldLayout1, placeAfterViewId, viewId);
        let newLayout2;
        if (oldLayout1 === newLayout1) {
            newLayout2 = _addViewToPanel(oldLayout2, placeAfterViewId, viewId);
        } else {
            newLayout2 = oldLayout2;
        }
        if (oldLayout1 === newLayout1 && oldLayout2 === newLayout2) {
            // no change!
            return viewSplit;
        }
        const layouts = [newLayout1, newLayout2];
        return {...viewSplit, layouts} as ViewSplitState;
    } else {
        const viewPanel = viewLayout as ViewPanelState;
        let oldViewIds = viewPanel.viewIds;
        const placeAfterIndex = oldViewIds.findIndex(id => id === placeAfterViewId);
        if (placeAfterIndex < 0) {
            // no change!
            return viewPanel;
        }
        const insertionIndex = placeAfterIndex + 1;
        const viewIds = oldViewIds.slice(0, insertionIndex).concat([viewId].concat(oldViewIds.slice(insertionIndex)));
        return {viewIds, selectedViewId: viewId};
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
            let viewIds = viewPanel.viewIds;
            const viewIndex = viewIds.indexOf(viewId);
            if (viewIndex < 0) {
                // No change!
                return viewPanel;
            }
            viewIds = viewIds.slice(0, viewIndex).concat(viewIds.slice(viewIndex + 1));
            let selectedViewId = viewPanel.selectedViewId;
            if (selectedViewId === viewId) {
                selectedViewId = viewIndex > 0 ? viewIds[viewIndex - 1] : viewIndex < viewIds.length ? viewIds[viewIndex] : null;
            }
            return {viewIds, selectedViewId};
        } else {
            return {viewIds: [], selectedViewId: null};
        }
    }
}

