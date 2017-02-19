import {should, expect} from 'chai';
import {getLayerDiff} from "./Layer";

should();

describe('Layer update algorithm v2', () => {
    it('can detect no-action', () => {
        expect(getLayerDiff(
            [],
            [],
        )).to.deep.equal([]);
        expect(getLayerDiff(
            [{id: 4}],
            [{id: 4}],
        )).to.deep.equal([]);
        expect(getLayerDiff(
            [{id: 4}, {id: 7}],
            [{id: 4}, {id: 7}],
        )).to.deep.equal([]);
    });

    it('can detect single removals', () => {
        expect(getLayerDiff(
            [{id: 4}],
            []
        )).to.deep.equal([
            {type: 'REMOVE', index: 0}
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 7}],
            [{id: 4}]
        )).to.deep.equal([
            {type: 'REMOVE', index: 1}
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 3}, {id: 9}, {id: 7}],
            [{id: 4}, {id: 3}, {id: 7}]
        )).to.deep.equal([
            {type: 'REMOVE', index: 2},
        ]);
    });

    it('can detect single additions', () => {
        expect(getLayerDiff(
            [], [{id: 4}]))
            .to.deep.equal([{type: 'ADD', index: 0, newLayer: {id: 4}}]);
        expect(getLayerDiff(
            [{id: 4}],
            [{id: 4}, {id: 7}],
        )).to.deep.equal([{type: 'ADD', index: 1, newLayer: {id: 7}}]);
        expect(getLayerDiff(
            [{id: 4}, {id: 3}, {id: 7}],
            [{id: 4}, {id: 3}, {id: 9}, {id: 7}],
        )).to.deep.equal([
            {type: 'ADD', index: 2, newLayer: {id: 9}}
        ]);
    });

    it('can detect multiple removals', () => {
        expect(getLayerDiff(
            [{id: 4}, {id: 2}],
            [],
        )).to.deep.equal([
            {type: 'REMOVE', index: 1},
            {type: 'REMOVE', index: 0},
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 2}, {id: 6}],
            [{id: 2}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 2},
            {type: 'REMOVE', index: 0},
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 2}, {id: 6}, {id: 7}, {id: 0}],
            [{id: 4}, {id: 6}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 4},
            {type: 'REMOVE', index: 3},
            {type: 'REMOVE', index: 1},
        ]);
    });

    it('can detect multiple additions', () => {
        expect(getLayerDiff(
            [],
            [{id: 4}, {id: 2}],
        )).to.deep.equal([
            {type: 'ADD', index: 0, newLayer: {id: 4}},
            {type: 'ADD', index: 1, newLayer: {id: 2}},
        ]);
        expect(getLayerDiff(
            [{id: 2}],
            [{id: 4}, {id: 2}, {id: 6}],
        )).to.deep.equal([
            {type: 'ADD', index: 0, newLayer: {id: 4}},
            {type: 'ADD', index: 2, newLayer: {id: 6}},
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 6}],
            [{id: 4}, {id: 2}, {id: 6}, {id: 7}, {id: 0}],
        )).to.deep.equal([
            {type: 'ADD', index: 1, newLayer: {id: 2}},
            {type: 'ADD', index: 3, newLayer: {id: 7}},
            {type: 'ADD', index: 4, newLayer: {id: 0}},
        ]);
    });

    it('can mix additions and removals', () => {
        expect(getLayerDiff(
            [{id: 4}],
            [{id: 3}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 0},
            {type: 'ADD', index: 0, newLayer: {id: 3}},
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 2}],
            // 1. [{id: 2}]
            // 2. [{id: 3}, {id: 2}]
            [{id: 3}, {id: 2}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 0},
            {type: 'ADD', index: 0, newLayer: {id: 3}},
        ]);
        expect(getLayerDiff(
            [{id: 1}, {id: 4}, {id: 2}],
            [{id: 1}, {id: 3}, {id: 2}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 1},
            {type: 'ADD', index: 1, newLayer: {id: 3}},
        ]);
        expect(getLayerDiff(
            [{id: 1}, {id: 3}],
            [{id: 4}, {id: 2}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 1},
            {type: 'REMOVE', index: 0},
            {type: 'ADD', index: 0, newLayer: {id: 4}},
            {type: 'ADD', index: 1, newLayer: {id: 2}},
        ]);
        expect(getLayerDiff(
            [{id: 4}, {id: 2}],
            [{id: 3}, {id: 4}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 1},
            {type: 'ADD', index: 0, newLayer: {id: 3}},
        ]);
        expect(getLayerDiff(
            [{id: 1}, {id: 2}, {id: 7}],
            // 1. [{id: 1}, {id: 7}]
            // 2. [{id: 7}]
            // 3. [{id: 3}, {id: 7}]
            // 4. [{id: 3}, {id: 4}, {id: 7}]
            // 5. [{id: 3}, {id: 4}, {id: 7}, {id: 8}]
            [{id: 3}, {id: 4}, {id: 7}, {id: 8}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 1},
            {type: 'REMOVE', index: 0},
            {type: 'ADD', index: 0, newLayer: {id: 3}},
            {type: 'ADD', index: 1, newLayer: {id: 4}},
            {type: 'ADD', index: 3, newLayer: {id: 8}},
        ]);
    });

    it('can move up and down', () => {
        expect(getLayerDiff(
            [{id: 4}, {id: 3}],
            // 1. [{id: 3}, {id: 4}]
            [{id: 3}, {id: 4}],
        )).to.deep.equal([
            {type: 'MOVE_DOWN', index: 1, numSteps: 1},
        ]);

        expect(getLayerDiff(
            [{id: 1}, {id: 2}, {id: 4}],
            // 1. [{id: 4}, {id: 1}, {id: 2}]
            [{id: 4}, {id: 1}, {id: 2}],
        )).to.deep.equal([
            {type: 'MOVE_DOWN', index: 2, numSteps: 2},
        ]);

        expect(getLayerDiff(
            [{id: 1}, {id: 2}, {id: 4}, {id: 3}],
            // 1. [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
            [{id: 1}, {id: 2}, {id: 3}, {id: 4}],
        )).to.deep.equal([
            {type: 'MOVE_DOWN', index: 3, numSteps: 1},
        ]);

        expect(getLayerDiff(
            [{id: 4}, {id: 3}, {id: 2}, {id: 1}],
            // 1. [{id: 1}, {id: 4}, {id: 3}, {id: 2}]
            // 2. [{id: 1}, {id: 2}, {id: 4}, {id: 3}]
            // 3. [{id: 1}, {id: 2}, {id: 3}, {id: 4}]
            [{id: 1}, {id: 2}, {id: 3}, {id: 4}],
        )).to.deep.equal([
            {type: 'MOVE_DOWN', index: 3, numSteps: 3},
            {type: 'MOVE_DOWN', index: 3, numSteps: 2},
            {type: 'MOVE_DOWN', index: 3, numSteps: 1},
        ]);
    });

    it('can detect updates', () => {
        expect(getLayerDiff(
            [{id: 4, alpha: 0.1}],
            [{id: 4, alpha: 0.2}],
        )).to.deep.equal([
            {type: 'UPDATE', index: 0, oldLayer: {id: 4, alpha: 0.1}, newLayer: {id: 4, alpha: 0.2}},
        ]);

        expect(getLayerDiff(
            [{id: 4, alpha: 0.1}, {id: 3, alpha: 0.9}, {id: 7, alpha: 0.3}],
            [{id: 4, alpha: 0.2}, {id: 3, alpha: 0.9}, {id: 7, alpha: 0.4}],
        )).to.deep.equal([
            {type: 'UPDATE', index: 0, oldLayer: {id: 4, alpha: 0.1}, newLayer: {id: 4, alpha: 0.2}},
            {type: 'UPDATE', index: 2, oldLayer: {id: 7, alpha: 0.3}, newLayer: {id: 7, alpha: 0.4}},
        ]);
    });

    it('can detect any changes', () => {
        expect(getLayerDiff(
            [{id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}, {id: 3, alpha: 0.3}, {id: 4, alpha: 0.3}],
            // 1. [{id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}, {id: 4, alpha: 0.3}]
            // 2. [{id: 4, alpha: 0.3}, {id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}]
            // 3. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.8}, {id: 1, alpha: 0.1}]
            // 4. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 1, alpha: 0.1}]
            // 5. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.1}]
            // 6. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.2}]
            [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.2}],
        )).to.deep.equal([
            {type: 'REMOVE', index: 2},
            {type: 'MOVE_DOWN', index: 2, numSteps: 2},
            {type: 'MOVE_DOWN', index: 2, numSteps: 1},
            {type: 'UPDATE', index: 1, oldLayer: {id: 2, alpha: 0.8}, newLayer: {id: 2, alpha: 0.9}},
            {type: 'ADD', index: 2, newLayer: {id: 5, alpha: 0.4}},
            {type: 'UPDATE', index: 3, oldLayer: {id: 1, alpha: 0.1}, newLayer: {id: 1, alpha: 0.2}},
        ]);

        function computeDelta(l1, l2) {
            if (l1.alpha !== l2.alpha) {
                return {alpha: l2.alpha}
            }
            return null;
        }

        // Same as above, now with computeDelta
        expect(getLayerDiff(
            [{id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}, {id: 3, alpha: 0.3}, {id: 4, alpha: 0.3}],
            // 1. [{id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}, {id: 4, alpha: 0.3}]
            // 2. [{id: 4, alpha: 0.3}, {id: 1, alpha: 0.1}, {id: 2, alpha: 0.8}]
            // 3. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.8}, {id: 1, alpha: 0.1}]
            // 4. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 1, alpha: 0.1}]
            // 5. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.1}]
            // 6. [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.2}]
            [{id: 4, alpha: 0.3}, {id: 2, alpha: 0.9}, {id: 5, alpha: 0.4}, {id: 1, alpha: 0.2}],
            computeDelta
        )).to.deep.equal([
            {type: 'REMOVE', index: 2},
            {type: 'MOVE_DOWN', index: 2, numSteps: 2},
            {type: 'MOVE_DOWN', index: 2, numSteps: 1},
            {
                type: 'UPDATE',
                index: 1,
                oldLayer: {id: 2, alpha: 0.8},
                newLayer: {id: 2, alpha: 0.9},
                change: {alpha: 0.9}
            },
            {type: 'ADD', index: 2, newLayer: {id: 5, alpha: 0.4}},
            {
                type: 'UPDATE',
                index: 3,
                oldLayer: {id: 1, alpha: 0.1},
                newLayer: {id: 1, alpha: 0.2},
                change: {alpha: 0.2}
            },
        ]);
    });

});



