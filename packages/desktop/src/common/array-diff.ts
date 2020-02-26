import * as assert from './assert';
import deepEqual = require('deep-equal');

type ObjectWithId = { id: any; }

/**
 * An action on an array of objects.
 */
export interface ArrayAction<T extends ObjectWithId> {
    /**
     * Action type, must be one of:  'ADD', 'REMOVE', 'UPDATE', 'MOVE'
     */
    type: 'ADD' | 'REMOVE' | 'UPDATE' | 'MOVE';
    /**
     * For type 'ADD': the insertion index.
     * For type 'UPDATE': the index of the element to be updated.
     * For type 'MOVE': the index from where to move.
     */
    index: number;
    /**
     * For type 'ADD' and 'UPDATE': the new element.
     */
    newElement?: T;
    /**
     * For type 'REMOVE' and 'UPDATE': the old element.
     */
    oldElement?: T;
    /**
     * For type 'UPDATE': the object containing change information.
     */
    change?: any;
    /**
     * For type 'MOVE': number of steps to move. May be negative to move an element down.
     */
    numSteps?: number;
}

/**
 * A diff for arrays whose elements are unique objects with an "id" property of any type.
 * An "id" property is considered equal to another if it shallow-equals the other i.e. element.id === other.id.
 *
 * By default, if the computeChange function is not provided, the "change" object between two elements
 * with same "id" property is computed by deepEqual from the "deep-equal" package.
 *
 * @param oldArray The first array, whose elements are all defined an non-null.
 * @param newArray The second array, whose elements are all defined an non-null.
 * @param computeChange An optional function used to compute an application-specific "change"
 *        between two elements with equal "id" properties.
 *        Signature: (element1, element2) => any
 * @returns {ArrayAction<T>[]} An array of actions to be performed to make oldArray equal to newArray.
 */
export function arrayDiff<T extends ObjectWithId>(oldArray: T[], newArray: T[], computeChange?): ArrayAction<T>[] {

    const actions = <ArrayAction<T>[]>[];
    const currentArray = oldArray.slice();

    // REMOVE first, so we have less actions afterwards
    const newIds = new Set<string>(newArray.map(l => l.id));
    for (let oldIndex = oldArray.length - 1; oldIndex >= 0; oldIndex--) {
        const oldElement = oldArray[oldIndex];
        if (!newIds.has(oldElement.id)) {
            actions.push({type: 'REMOVE', index: oldIndex, oldElement});
            currentArray.splice(oldIndex, 1);
        }
    }

    assert.ok(currentArray.length <= newArray.length);

    for (let newIndex = 0; newIndex < newArray.length; newIndex++) {
        const newElement = newArray[newIndex];
        assert.ok(!!newElement);
        const currentElement = currentArray[newIndex];
        if (!currentElement) {
            actions.push({type: 'ADD', index: newIndex, newElement});
            currentArray.push(newElement);
        } else if (newElement.id !== currentElement.id) {
            let currentIndex = -1;
            for (let i = newIndex + 1; i < currentArray.length; i++) {
                if (currentArray[i].id === newElement.id) {
                    currentIndex = i;
                    break;
                }
            }
            if (currentIndex === -1) {
                actions.push({type: 'ADD', index: newIndex, newElement});
                currentArray.splice(newIndex, 0, newElement);
            } else {
                // Note: the current algorithm will only produce negative values for numSteps (= MOVE down)
                actions.push({type: 'MOVE', index: currentIndex, numSteps: newIndex - currentIndex});
                const layer = currentArray[currentIndex];
                currentArray.splice(currentIndex, 1);
                currentArray.splice(newIndex, 0, layer);
                newIndex = newIndex - 1;
            }
        } else {
            if (computeChange) {
                const change = computeChange(currentElement, newElement);
                if (change !== null && typeof change !== 'undefined') {
                    actions.push({type: 'UPDATE', index: newIndex, oldElement: currentElement, newElement, change});
                }
            } else if (!deepEqual(currentElement, newElement)) {
                actions.push({type: 'UPDATE', index: newIndex, oldElement: currentElement, newElement});
            }
        }
    }

    return actions;
}

