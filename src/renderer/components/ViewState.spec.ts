import {expect} from 'chai';

import {
    addViewToLayout,
    splitViewPanel,
    changeViewSplitPos,
    removeViewFromLayout,
    removeAllViewsFromLayout,
    removeViewFromViewArray,
    ViewLayoutState,
    ViewState, moveViewToPanel, ViewSplitState, ViewPanelState,
} from "./ViewState";

describe('function manipulating a ViewLayout', () => {

    const viewPanel = {
        viewIds: ['a', 'b', 'c'],
        selectedViewId: 'c'
    } as ViewLayoutState;

    const viewSplit1 = {
        dir: "hor",
        pos: 80,
        layouts: [
            {
                dir: "ver",
                pos: 120,
                layouts: [
                    {
                        viewIds: ["d", "e", "f"],
                        selectedViewId: "f",
                    },
                    {
                        viewIds: ["g", "h", "i"],
                        selectedViewId: "g",
                    }
                ],
            },
            {
                viewIds: ["a", "b", "c"],
                selectedViewId: "b",
            }
        ],
    } as ViewSplitState;

    const viewSplit2 = viewSplit1.layouts[0] as ViewSplitState;
    const viewPanel1 = viewSplit1.layouts[1] as ViewPanelState;
    const viewPanel2 = viewSplit2.layouts[0] as ViewPanelState;
    const viewPanel3 = viewSplit2.layouts[1] as ViewPanelState;

    describe('moveViewToPanel()', () => {
        it('can move view before another first one', () => {
            expect(moveViewToPanel(viewSplit1, 'h', 'a', true)).to.deep.equal({
                dir: "hor",
                layouts: [
                    {
                        dir: "ver",
                        layouts: [
                            {
                                selectedViewId: "f",
                                viewIds: ["d", "e", "f"]
                            },
                            {
                                selectedViewId: "g",
                                viewIds: ["g", "i"]
                            }
                        ],
                        "pos": 120
                    },
                    {
                        selectedViewId: "h",
                        viewIds: ["h", "a", "b", "c"]
                    }
                ],
                "pos": 80
            });
        });
        it('can move view before another last one', () => {
            expect(moveViewToPanel(viewSplit1, 'h', 'c', true)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ["d", "e", "f"],
                                selectedViewId: "f",
                            },
                            {
                                viewIds: ["g", "i"],
                                selectedViewId: "g",
                            }
                        ],
                    },
                    {
                        viewIds: ["a", "b", "h", "c"],
                        selectedViewId: "h",
                    }
                ],
            });
        });
        it('can move view after another first one', () => {
            expect(moveViewToPanel(viewSplit1, 'h', 'a', false)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ["d", "e", "f"],
                                selectedViewId: "f",
                            },
                            {
                                viewIds: ["g", "i"],
                                selectedViewId: "g",
                            }
                        ],
                    },
                    {
                        viewIds: ["a", "h", "b", "c"],
                        selectedViewId: "h",
                    }
                ],
            });
        });
        it('can move view after another last one', () => {
            expect(moveViewToPanel(viewSplit1, 'h', 'c', false)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ["d", "e", "f"],
                                selectedViewId: "f",
                            },
                            {
                                viewIds: ["g", "i"],
                                selectedViewId: "g",
                            }
                        ],
                    },
                    {
                        viewIds: ["a", "b", "c", "h"],
                        selectedViewId: "h",
                    }
                ],
            });
        });
        it('can move view within others', () => {
            expect(moveViewToPanel(viewSplit1, 'b', 'e', true)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ["d", "b", "e", "f"],
                                selectedViewId: "b",
                            },
                            {
                                viewIds: ["g", "h", "i"],
                                selectedViewId: "g",
                            }
                        ],
                    },
                    {
                        viewIds: ["a", "c"],
                        selectedViewId: "c",
                    }
                ],
            });
        });
    });

    describe('addViewToLayout()', () => {
        it('can add view to top-level view panel', () => {
            expect(addViewToLayout(viewPanel, 'd')).to.deep.equal({
                viewIds: ['a', 'b', 'c', 'd'],
                selectedViewId: 'd'
            });
        });
        it('can add view to deeper view panel', () => {
            expect(addViewToLayout(viewSplit1, 'x')).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            {
                                viewIds: ['d', 'e', 'f', 'x'],
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
            expect(splitViewPanel(viewPanel, '', "hor", 100)).to.deep.equal({
                dir: "hor",
                pos: 100,
                layouts: [
                    {
                        selectedViewId: "b",
                        viewIds: [
                            "a",
                            "b",
                        ]
                    },
                    {
                        selectedViewId: "c",
                        viewIds: [
                            "c",
                        ]
                    }
                ],
            });
        });
        it('can split a deeper view panel', () => {
            expect(splitViewPanel(viewSplit1, '01', "hor", 60)).to.deep.equal({
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

    describe('changeViewSplitPos()', () => {
        it('can change pos in top-level view split', () => {
            expect(changeViewSplitPos(viewSplit2, '', 3)).to.deep.equal({
                    dir: "ver",
                    pos: 123,
                    layouts: [viewPanel2, viewPanel3],
                }
            );
        });
        it('can change pos in deeper view split', () => {
            expect(changeViewSplitPos(viewSplit1, '0', -2)).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 118,
                        layouts: [viewPanel2, viewPanel3],
                    },
                    viewPanel1
                ],
            });
        });
    });

    describe('removeViewFromLayout()', () => {
        it('can remove view from top-level view panel', () => {
            expect(removeViewFromLayout(viewPanel, '', 'b')).to.deep.equal({
                selectedViewId: "c",
                viewIds: [
                    "a",
                    "c",
                ]
            });
        });

        it('can remove view from a deeper view panel', () => {
            expect(removeViewFromLayout(viewSplit1, '01', 'i')).to.deep.equal({
                dir: "hor",
                pos: 80,
                layouts: [
                    {
                        dir: "ver",
                        pos: 120,
                        layouts: [
                            viewPanel2,
                            {
                                viewIds: ['g', 'h'],
                                selectedViewId: 'g'
                            }
                        ],
                    },
                    viewPanel1,
                ],
            });
        });
    });

    describe('removeAllViewFromLayout()', () => {
        it('can remove all views from top-level view panel', () => {
            expect(removeAllViewsFromLayout(viewPanel, '')).to.deep.equal({
                selectedViewId: null,
                viewIds: []
            });
        });
        it('can remove all views from a deeper view panel', () => {
            expect(removeAllViewsFromLayout(viewSplit1, '01')).to.deep.equal({
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
            ] as ViewState<any>[];
            expect(removeViewFromViewArray(views, 'b')).to.deep.equal([{id: 'a'}, {id: 'c'}]);
        });
    });
})
;



