import * as React from 'react';
import * as assert from "../../common/assert";

type ContainerType = HTMLElement|any;

export interface IPermanentObjectType {
    container: ContainerType;
}

export interface IPermanentComponentProps {
    id: string;
    cache?: Object;
    style?: Object;
    className?: string;
    debug?: boolean;
}

/**
 * An uncontrolled React component that lets the *container* DOM element of a "permanent object" hook into the
 * real DOM created by React once this component is mounted. When we say permanent object, we refer to the fact that
 * such objects are kept in a store to let them survive unmounting through React. The *container* DOM element of
 * a permanent object is the root of a DOM tree that shall not be controlled by React directly.
 *
 * Furthermore:
 *
 *   - The child elements of the *container* (often a "canvas" element) are usually controlled by a dedicated
 *     JavaScript API provided by a 3rd party library.
 *   - The *container* is associated with a complex JavaScript state which is manipulated by that JavaScript API.
 *   - Both the displayed content in the DOM child elements and associated JavaScript state are expensive to regenerate
 *     from the virtual DOM when implemented as a pure React component.
 *
 * Examples for native components are the *Cesium.View* of the CesiumJS library or the *ol.Map* object of the
 * OpenLayers 3 library.
 *
 * When a PermanentComponent is mounted,
 *   1. it will lookup the permanent object from the store using this component's *id* property.
 *   2. If such permanent object cannot be found this PermanentComponent will create the permanent object by calling
 *      "createPermanentObject" and put the permanent object into this component's *store* using this component's *id*
 *      property so it will survive unmounting.
 *   3. it will append the *container* element of the permanent object to the "div" element controlled by this PermanentComponent;
 *   4. it will call "permanentObjectMounted".
 *
 * When a PermanentComponent is unmounted,
 *   1. it will lookup the permanent object from the store using this component's *id* property;
 *   2. it will remove the permanent object's *container* element from the "div" element controlled by this PermanentComponent;
 *   3. it will call "permanentObjectUnmounted".
 *
 * Note that the permanent object is removed from the store only if the "dispose()" method is called.
 *
 * @author Norman Fomferra
 * @version 0.2
 */
export abstract class PermanentComponent<T extends IPermanentObjectType, P extends IPermanentComponentProps, S> extends React.PureComponent<P, S> {
    private static readonly defaultPermanentObjectStore: Object = {};

    private _parentContainer: HTMLElement|null;
    private _permanentObject: T|null;
    private _prevPropsMap: {[id: string]: P};

    constructor(props: IPermanentComponentProps) {
        super(props);
        if (!props.id) {
            throw new Error("cannot construct PermanentComponent without id");
        }
        this._parentContainer = null;
        this._permanentObject = null;
        this._prevPropsMap = {};
    }

    abstract createPermanentObject(parentContainer?: HTMLElement|any): T;

    permanentObjectMounted(permanentObject: T, parentContainer: HTMLElement): void {
    }

    permanentObjectUnmounted(permanentObject: T, parentContainer: HTMLElement): void {
    }

    componentWillReceiveProps(nextProps: P) {
        this.saveCurrentProps();
        this.maybeUpdatePermanentComponent(nextProps);
    }

    /**
     * By default, returns a "div" element.
     * @returns {JSX.Element}
     */
    render(): JSX.Element {
        const onRef = (element: any) => {
            this.remountPermanentObject(element);
        };

        return <div id={this.props.id}
                    className={this.props.className}
                    style={this.props.style}
                    ref={onRef}/>
    }

    private remountPermanentObject(parentContainer: HTMLElement|null) {
        if (parentContainer) {
            if (this.props.id in this.permanentObjectStore) {
                this.mountOldPermanentObject(parentContainer);
            } else {
                this.mountNewPermanentObject(parentContainer);
            }
        } else if (this._parentContainer) {
            this.unmountPermanentObject(this._parentContainer);
        }
    }

    get parentContainer(): HTMLElement|null {
        return this._parentContainer;
    }

    get permanentObject(): T|null {
        return this._permanentObject;
    }

    get permanentObjectStore(): Object {
        return this.props.cache || PermanentComponent.defaultPermanentObjectStore;
    }

    private saveCurrentProps() {
        let props = this.props;
        if (props)
            this._prevPropsMap[props.id] = props;
    }

    private getPrevProps(id: string) {
        return this._prevPropsMap[id];
    }

    private maybeUpdatePermanentComponent(nextProps: P) {
        let permanentObject = this._permanentObject;
        if (permanentObject) {
            this.updatePermanentComponent(permanentObject, this._parentContainer,
                this.getPrevProps(nextProps.id), nextProps);
        }
    }

    /**
     * Clients must compute the delta between *prevProps* and *nextProps* and update their
     * permanent object accordingly.
     *
     * @param permanentComponent
     * @param parentContainer
     * @param prevProps
     * @param nextProps
     */
    updatePermanentComponent(permanentComponent: T, parentContainer: HTMLElement, prevProps: P, nextProps: P) {
    }

    dispose() {
        /*
        const id = this.props.id;
        const permanentObjectStore = this.permanentObjectStore;
        if (id in permanentObjectStore) {
            if (this.props.debug) {
                console.log("PermanentComponent: disposing permanent object with id =", this.props.id);
            }
            let permanentObject = permanentObjectStore[id];
            delete permanentObjectStore[id];
            if (id in this._prevPropsMap) {
                delete this._prevPropsMap[id];
            }
            this.disposePermanentObject(permanentObject);
        }
        */
    }

    /**
     * Removes the current permanent object from cache and creates a new one.
     * Clients may call this method to force a regeneration of their permanent component.
     */
    forceRegeneration() {
        let permanentObjectStore = this.permanentObjectStore;
        let permanentObject = permanentObjectStore[this.props.id];
        if (permanentObject) {
            delete permanentObjectStore[this.props.id];
            delete this._prevPropsMap[this.props.id];
            if (this.parentContainer && permanentObject.container) {
                this.parentContainer.removeChild(permanentObject.container);
            }
            this.remountPermanentObject(this.parentContainer);
        }
    }

    private mountNewPermanentObject(parentContainer: HTMLElement) {
        if (this.props.debug) {
            console.log("PermanentComponent: mounting new permanent object with id =", this.props.id);
        }
        let permanentObject = this.createPermanentObject(parentContainer);
        assert.ok(permanentObject);
        parentContainer.appendChild(permanentObject.container);
        this.permanentObjectStore[this.props.id] = permanentObject;
        this._permanentObject = permanentObject;
        this._parentContainer = parentContainer;
        this.permanentObjectMounted(permanentObject, parentContainer);
        this.updatePermanentComponent(permanentObject, parentContainer,
            this.getPrevProps(this.props.id), this.props);
    }

    private mountOldPermanentObject(parentContainer: HTMLElement) {
        if (this.props.debug) {
            console.log("PermanentComponent: mounting existing permanent object with id =", this.props.id);
        }
        let permanentObject = this.permanentObjectStore[this.props.id];
        assert.ok(permanentObject);
        parentContainer.appendChild(permanentObject.container);
        this._permanentObject = permanentObject;
        this._parentContainer = parentContainer;
        this.saveCurrentProps();
        this.permanentObjectMounted(permanentObject, parentContainer);
        this.updatePermanentComponent(permanentObject, parentContainer,
            this.getPrevProps(this.props.id), this.props);
    }

    private unmountPermanentObject(parentContainer: HTMLElement) {
        if (this.props.debug) {
            console.log("PermanentComponent: unmounting permanent object with id =", this.props.id);
        }
        parentContainer.removeChild(this._permanentObject.container);
        let permanentObject = this._permanentObject;
        this._permanentObject = null;
        this._parentContainer = null;
        this.saveCurrentProps();
        this.permanentObjectUnmounted(permanentObject, parentContainer);
    }
}
