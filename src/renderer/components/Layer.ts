import * as assert from '../../common/assert';
import deepEqual = require("deep-equal");

export interface Layer {
    id: any;
}

export interface LayerAction<T extends Layer> {
    type: string;
    index: number;
    numSteps?: number;
    oldLayer?: T;
    newLayer?: T;
    change?: any;
}

export function getLayerDiff<T extends Layer>(oldLayers: T[], newLayers: T[], computeChange?): LayerAction<T>[] {

    const actions = <LayerAction<T>[]>[];
    const currentLayers = oldLayers.slice();

    // REMOVE first, so we have less actions afterwards
    const newLayerIdSet = new Set<string>(newLayers.map(l => l.id));
    for (let oldIndex = oldLayers.length - 1; oldIndex >= 0; oldIndex--) {
        if (!newLayerIdSet.has(oldLayers[oldIndex].id)) {
            actions.push({type: 'REMOVE', index: oldIndex});
            currentLayers.splice(oldIndex, 1);
        }
    }

    assert.ok(currentLayers.length <= newLayers.length);

    for (let newIndex = 0; newIndex < newLayers.length; newIndex++) {
        const newLayer = newLayers[newIndex];
        assert.ok(!!newLayer);
        const currentLayer = currentLayers[newIndex];
        if (!currentLayer) {
            actions.push({type: 'ADD', index: newIndex, newLayer});
            currentLayers.push(newLayer);
        } else if (newLayer.id !== currentLayer.id) {
            let currentIndex = -1;
            for (let i = newIndex + 1; i < currentLayers.length; i++) {
                if (currentLayers[i].id === newLayer.id) {
                    currentIndex = i;
                    break;
                }
            }
            if (currentIndex === -1) {
                actions.push({type: 'ADD', index: newIndex, newLayer});
                currentLayers.splice(newIndex, 0, newLayer);
            } else {
                actions.push({type: 'MOVE_DOWN', index: currentIndex, numSteps: currentIndex - newIndex});
                const layer = currentLayers[currentIndex];
                currentLayers.splice(currentIndex, 1);
                currentLayers.splice(newIndex, 0, layer);
                newIndex = newIndex - 1;
            }
        } else {
            if (computeChange) {
                const change = computeChange(currentLayer, newLayer);
                if (change !== null && typeof change !== 'undefined') {
                    actions.push({type: 'UPDATE', index: newIndex, oldLayer: currentLayer, newLayer, change});
                }
            } else if (!deepEqual(currentLayer, newLayer)) {
                actions.push({type: 'UPDATE', index: newIndex, oldLayer: currentLayer, newLayer});
            }
        }
    }

    return actions;
}

