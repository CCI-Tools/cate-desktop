import { IconName } from '@blueprintjs/icons';
import * as assert from "../../common/assert";


export type SplitDir = "hor" | "ver";

export type ViewPath = string;


export interface ViewState<T> {
    id: string;
    title: string;
    icon?: IconName;
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
                              filter: (viewPanel: ViewPanelState) => boolean): ViewPanelState | null {
    if (isViewPanelState(viewLayout)) {
        const viewPanel = viewLayout as ViewPanelState;
        return filter && filter(viewPanel) ? viewPanel : null;
    }
    assert.ok(isViewSplitState(viewLayout), "ViewSplitState expected");
    const viewSplit = viewLayout as ViewSplitState;
    return findViewPanel(viewSplit.layouts[0], filter) || findViewPanel(viewSplit.layouts[1], filter);
}

export function findMoveTargetViewIds(viewLayout: ViewLayoutState, sourceViewId: string): { after: string[]; before: string[] } {
    const result = {before: [], after: []};
    _collectMoveTargetViewIds(viewLayout, sourceViewId, result);
    return result;
}

export function moveView(viewLayout: ViewLayoutState,
                         sourceViewId: string,
                         placement: "before" | "after",
                         targetViewId: string): ViewLayoutState {
    return _moveView(viewLayout, sourceViewId, placement, targetViewId);
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

// function removeViewFromViewIds(viewIds: string[], viewId: string): string[] {
//     while (true) {
//         const i = viewIds.indexOf(viewId);
//         if (i >= 0) {
//             viewIds = viewIds.slice(0, i).concat(viewIds.slice(i + 1));
//         } else {
//             break;
//         }
//     }
//     return viewIds;
// }

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


export function _moveView(viewLayout: ViewLayoutState,
                          sourceViewId: string,
                          placement: "before" | "after",
                          targetViewId: string): ViewLayoutState {
    if (isViewSplitState(viewLayout)) {
        const viewSplit = viewLayout as ViewSplitState;
        let oldLayout1 = viewSplit.layouts[0];
        let oldLayout2 = viewSplit.layouts[1];
        let newLayout1 = _moveView(oldLayout1, sourceViewId, placement, targetViewId);
        let newLayout2 = _moveView(oldLayout2, sourceViewId, placement, targetViewId);
        if (oldLayout1 === newLayout1 && oldLayout2 === newLayout2) {
            // no change!
            return viewSplit;
        }
        if (newLayout1 === null) {
            assert.ok(newLayout2);
            return newLayout2;
        }
        if (newLayout2 === null) {
            return newLayout1;
        }
        return {...viewSplit, layouts: [newLayout1, newLayout2]} as ViewSplitState;
    } else {
        const viewPanel = viewLayout as ViewPanelState;
        let viewIds = viewPanel.viewIds;
        let selectedViewId = viewPanel.selectedViewId;

        const sourceViewIndex = viewIds.findIndex(id => id === sourceViewId);
        if (sourceViewIndex >= 0) {
            // remove sourceViewId
            viewIds = viewIds.slice();
            viewIds.splice(sourceViewIndex, 1);
            if (viewIds.length === 0) {
                // sourceViewId was the last one, so close this panel
                return null;
            }
            if (selectedViewId === sourceViewId && viewIds.length) {
                // the removed view was the selected view, select some other view now
                const selectedViewIndex = sourceViewIndex < viewIds.length ? sourceViewIndex : viewIds.length - 1;
                selectedViewId = viewIds[selectedViewIndex];
            }
        }

        const targetViewIndex = viewIds.findIndex(id => id === targetViewId);
        if (targetViewIndex >= 0) {
            if (placement === 'before') {
                // insert sourceViewId before
                viewIds = viewIds.slice(0, targetViewIndex).concat([sourceViewId].concat(viewIds.slice(targetViewIndex)));
            } else {
                // insert sourceViewId after
                viewIds = viewIds.slice(0, targetViewIndex + 1).concat([sourceViewId].concat(viewIds.slice(targetViewIndex + 1)));
            }
            selectedViewId = sourceViewId;
        }
        if (viewIds !== viewPanel.viewIds) {
            return {viewIds, selectedViewId};
        }
    }
    // no change!
    return viewLayout;
}


// TODO (forman): refactor out similar code with _moveViewToPanel()
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
        let viewIds = viewPanel.viewIds;
        assert.ok(viewIds.length > 1, "ViewPanelState must have more than one view to be split");
        const selectedViewId = viewPanel.selectedViewId;
        let index = viewIds.findIndex(id => id === selectedViewId);
        if (index === viewIds.length - 1) {
            index -= 1;
        }
        assert.ok(index >= 0);
        const viewIds1 = viewIds.slice(0, index + 1);
        const viewIds2 = viewIds.slice(index + 1);
        return {
            dir, pos,
            layouts: [
                {
                    viewIds: viewIds1,
                    selectedViewId: viewIds1[viewIds1.length - 1],
                },
                {
                    viewIds: viewIds2,
                    selectedViewId: viewIds2[0],
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

export function selectView(viewLayout: ViewLayoutState, viewId: string): ViewLayoutState {
    if (isViewSplitState(viewLayout)) {
        const viewSplit = viewLayout as ViewSplitState;
        const oldLayout1 = viewSplit.layouts[0];
        const oldLayout2 = viewSplit.layouts[1];
        const newLayout1 = selectView(oldLayout1, viewId);
        const newLayout2 = selectView(oldLayout2, viewId);
        if (oldLayout1 !== newLayout1 || oldLayout2 !== newLayout2) {
            return {...viewSplit, layouts: [newLayout1, newLayout2]} as ViewSplitState;
        }
    } else {
        const viewPanel = viewLayout as ViewPanelState;
        if (viewId !== viewPanel.selectedViewId) {
            const viewIds = viewPanel.viewIds;
            const selectedViewIndex = viewIds.findIndex(id => id === viewId);
            if (selectedViewIndex >= 0) {
                return {viewIds, selectedViewId: viewId};
            }
        }
    }
    // no change
    return viewLayout;
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

function _collectMoveTargetViewIds(viewLayout: ViewLayoutState, sourceViewId: string, result: { after: string[]; before: string[] }) {
    const viewIds = (viewLayout as ViewPanelState).viewIds;
    if (viewIds) {
        let lastViewId = null;
        for (let i = 0; i < viewIds.length; i++) {
            const viewId = viewIds[i];
            if (viewId !== sourceViewId) {
                const nextViewId = i < viewIds.length + 1 ? viewIds[i + 1] : null;
                if (nextViewId === null || nextViewId !== sourceViewId) {
                    result.after.push(viewId);
                }
                if (lastViewId === null || lastViewId !== sourceViewId) {
                    result.before.push(viewId);
                }
            }
            lastViewId = viewId;
        }
    }
    const layouts = (viewLayout as ViewSplitState).layouts;
    if (layouts) {
        for (let layout of layouts) {
            _collectMoveTargetViewIds(layout, sourceViewId, result);
        }
    }
}
