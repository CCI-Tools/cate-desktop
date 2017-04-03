import {should, expect} from 'chai';
import {
    addView, splitViewPanel, removeViewFromLayout, removeViewFromViewArray, ViewLayoutState, ViewState,
    removeAllViewsFromLayout
} from "./ViewState";

should();
describe('ViewLayoutState tests', () => {
    const viewPanel = {
        viewIds: ['a', 'b', 'c'],
        selectedViewId: 'c'
    } as ViewLayoutState;

    const viewPanel1 = {
        viewIds: ['a', 'b', 'c'],
        selectedViewId: 'b'
    } as ViewLayoutState;
    const viewPanel2 = {
        viewIds: ['d', 'e', 'f'],
        selectedViewId: 'f'
    } as ViewLayoutState;
    const viewPanel3 = {
        viewIds: ['g', 'h', 'i'],
        selectedViewId: 'g'
    } as ViewLayoutState;
    const viewSplit1 = {
        dir: "ver",
        pos: 120,
        layouts: [viewPanel2, viewPanel3],
    } as ViewLayoutState;
    const viewSplit2 = {
        dir: "hor",
        pos: 80,
        layouts: [viewSplit1, viewPanel1],
    } as ViewLayoutState;

    describe('addView()', () => {
        it('can add to top-level view panel', () => {
            expect(addView(viewPanel, 'd')).to.deep.equal({
                viewIds: ['d', 'a', 'b', 'c'],
                selectedViewId: 'd'
            });
        });
        it('can add to deeper panel', () => {
            expect(addView(viewSplit2, 'x')).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ['x', 'd', 'e', 'f'],
                                selectedViewId: 'x',
                            },
                            viewPanel3,
                        ],
                    },
                    viewPanel1,
                ],
            });
        });
    });

    describe('splitViewPanel()', () => {
        it('can split a top-level view panel', () => {
            expect(splitViewPanel(viewPanel, [], "hor", 100)).to.deep.equal({
                dir: "hor",
                pos: 100,
                layouts: [
                    {
                        selectedViewId: "c",
                        viewIds: [
                            "c"
                        ]
                    },
                    {
                        selectedViewId: "a",
                        viewIds: [
                            "a",
                            "b"
                        ]
                    }
                ],
            });
        });
        it('can split a deeper panel', () => {
            expect(splitViewPanel(viewSplit2, [0, 1], "hor", 60)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            viewPanel2,
                            {
                                dir: "hor",
                                pos: 60,
                                layouts: [
                                    {
                                        viewIds: ['g'],
                                        selectedViewId: 'g'
                                    },
                                    {
                                        viewIds: ['h', 'i'],
                                        selectedViewId: 'h'
                                    },
                                ],
                            },
                        ],
                    },
                    viewPanel1,
                ],
            });
        });
    });

    describe('removeViewFromLayout()', () => {
        it('can remove view from top-level-panel', () => {
            expect(removeViewFromLayout(viewPanel, [], 'b')).to.deep.equal({
                selectedViewId: "c",
                viewIds: [
                    "a",
                    "c",
                ]
            });
        });
    });

    describe('removeAllViewFromLayout()', () => {
        it('can remove all views from top-level-panel', () => {
            expect(removeAllViewsFromLayout(viewPanel, [])).to.deep.equal({
                selectedViewId: null,
                viewIds: []
            });
        });
        it('can remove all views from a deeper panel', () => {
            expect(removeAllViewsFromLayout(viewSplit2, [0, 1])).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [viewPanel2, viewPanel1],
            });
        });
    });

    describe('removeViewFromViewArray()', () => {
        it('removes a view', () => {
            const views = [
                {id: 'a'},
                {id: 'b'},
                {id: 'c'},
            ] as ViewState[];
            expect(removeViewFromViewArray(views, 'b')).to.deep.equal([{id: 'a'}, {id: 'c'}]);
        });
    });
});



