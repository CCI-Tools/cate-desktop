import * as React from 'react';
import * as assert from "../../common/assert";
import {shallowEqual} from "../../common/shallow-equal";

export interface IExternalObjectComponentProps<E, ES> {
    id: string;
    externalObjectStore: ExternalObjectStore<E, ES>;
    style?: Object;
    className?: string;
    debug?: boolean;
}

export interface ExternalObjectRef<E, ES> {
    /**
     * The reference to the external object.
     */
    object: E;

    /**
     * The current state of the external object.
     */
    state?: ES;

    /**
     * The HTML element that contains the external object.
     */
    container: HTMLElement;
}

export type ExternalObjectStore<E, S> = { [id: string]: ExternalObjectRef<E, S> };

/**
 * A React component that lets the *container* DOM element of a "external object" hook into the
 * real DOM created by React once this component is mounted. When we say external object, we refer to the fact that
 * such objects are kept in an in-memory store to let them survive unmounting from the real DOM through React.
 * The *container* DOM element of a external object is the root of a DOM tree that shall not be controlled by React
 * directly.
 *
 * Furthermore:
 *
 *   - The child elements of the *container* (often a "canvas" element) are usually controlled by a dedicated
 *     JavaScript API provided by a 3rd party library.
 *   - The *container* is associated with a complex JavaScript state which is manipulated by that JavaScript API.
 *   - Both the displayed content in the DOM child elements and associated JavaScript state are expensive to regenerate
 *     from the virtual DOM when implemented as a pure React component.
 *
 * Examples for native components are the *Cesium.Viewer* of the CesiumJS library or the *ol.Map* object of the
 * OpenLayers 3 library.
 *
 * Note that this is different from React's notion of an "uncontrolled component", where form data is handled
 * by the DOM itself. While this is also true for a PermanentComponent, we still consider the React component's
 * props to be the single source of truth. Therefore changes in this component's props must be reflected in
 * the "external object" so that it stays in snc with the current props.
 *
 * When the parent container of a PermanentComponent is mounted, the following steps are performed
 *   1. lookup the external object from the store using this component's *id* property;
 *   2. if such external object cannot be found, we will create the external object by calling
 *      *createPermanentObject()* and put the external object into this component's *store* using this component's *id*
 *      property so it will survive unmounting;
 *   3. append the *container* element of the external object to the "div" element controlled by this PermanentComponent;
 *   4. call *externalObjectMounted()*;
 *   5. get the previous props using the *id*;
 *   6. call *updatePermanentObject()* with the previous and current props so a delta can be computed and applied to
 *      the external component.
 *
 * When a PermanentComponent is unmounted, the following steps are performed:
 *   1. lookup the external object from the store using this component's *id* property;
 *   2. remove the external object's *container* element from the "div" element controlled by this PermanentComponent;
 *   3. it will call "externalObjectUnmounted".
 *
 * Note that the external object is removed from the store only if the "dispose()" method is called.
 *
 * @author Norman Fomferra
 * @version 0.5
 */
export abstract class ExternalObjectComponent<E, ES, P extends IExternalObjectComponentProps<E, ES>, S>
    extends React.PureComponent<P, S> {

    private parentContainer: HTMLElement | null;

    constructor(props: P) {
        super(props);
        ExternalObjectComponent.checkProps(props);
        this.parentContainer = null;
        this.onRef = this.onRef.bind(this);
    }

    private static checkProps(props: any) {
        if (!props.id) {
            throw new Error("cannot construct ExternalObjectComponent without id");
        }
    }

    /**
     * Gets the external object reference.
     *
     * Think twice, before using this method.
     * The single source of truth should be your app's state.
     *
     * @returns the external object reference or null.
     */
    getExternalObjectRef(): ExternalObjectRef<E, ES> | null {
        return this.props.externalObjectStore[this.props.id] || null;
    }

    // TODO (forman): we can probably simplify ExternalObjectComponent by getting rid of the intermediate container
    //                created by newContainer(id), if we add the following methods to be overidden by clients,
    //                in case this is needed. The default impls would do nothing:
    //                     attachExternalObject(parentContainer, object)
    //                     detachExternalObject(parentContainer, object)

    /**
     * Create a new container for the external object.
     *
     * @param id The id.
     */
    abstract newContainer(id: string): HTMLElement;

    /**
     * Create a new external object.
     *
     * @param parentContainer The parent container HTML element which either holds *container* or the *object*.
     * @param container The HTML element created by *newContainer()*, if any.
     */
    abstract newExternalObject(parentContainer: HTMLElement, container: HTMLElement): E;

    /**
     * Called when the props of this component change and the delta between the external component's
     * state (given by *prevState*) and this components props (given by *nextState*) must be reflected in
     * the external object state.
     *
     * Clients must implement this method by computing the delta between *prevState* and *nextState* and update their
     * external object accordingly.
     *
     * @param object The external object.
     * @param prevState The previous state, may be null or undefined.
     * @param nextState The next state, never null, always defined.
     * @param parentContainer The parent container HTML element which either holds *container* or the *object*.
     * @param container The HTML element created by *newContainer()*, if any.
     */
    abstract updateExternalObject(object: E, prevState: ES, nextState: ES,
                                  parentContainer: HTMLElement, container: HTMLElement): void;

    //noinspection JSMethodCanBeStatic
    /**
     * Extract the state of the external object encoded in the given props.
     * The default implementation simply returns a shallow copy of the previous state
     * overwritten by the given props.
     *
     * @param props The props which take precedence over the previous state.
     * @param prevState The previous state.
     * @returns {{}} State of the external object extracted from props.
     */
    propsToExternalObjectState(props: Readonly<P>, prevState?: Readonly<ES>): ES {
        return {...prevState as any, ...props as any};
    }

    /**
     * Called if the *externalObject* has been mounted and is now a child of the *parentContainer*.
     *
     * @param object The external object.
     * @param props The props for the external object to be mounted.
     * @param parentContainer The parent container HTML element which either holds *container* or the *object*.
     * @param container The HTML element created by *newContainer()*, if any.
     */
    externalObjectMounted(object: E, props: Readonly<P>, parentContainer: HTMLElement, container: HTMLElement): void {
    }

    /**
     * Called if the *externalObject* has been unmounted and is no longer a child of *parentContainer*.
     *
     * @param object The external object.
     * @param props The props for the external object to be unmounted.
     * @param parentContainer The parent container HTML element which either holds *container* or the *object*.
     * @param container The HTML element created by *newContainer()*, if any.
     */
    externalObjectUnmounted(object: E, props: Readonly<P>, parentContainer: HTMLElement, container: HTMLElement): void {
    }


    // TODO (forman): optimize me: don't override componentWillUpdate(), instead override...
    // - componentWillReceiveProps() to do what componentWillUpdate() currently does AND set whether render() does need to be called
    // - shouldComponentUpdate() to return whether render() need to be called
    /**
     * Invoked by React immediately before rendering when new props or state are being received.
     * This method is not called for the initial render.
     *
     * We use this as an opportunity to synchronize the external object's state with the next props being received.
     *
     * @param nextProps the next props
     */
    componentWillUpdate(nextProps: Readonly<P & ES>) {
        if (this.props.debug) {
            console.log("ExternalObjectComponent.componentWillUpdate nextProps.id =", nextProps.id);
        }
        ExternalObjectComponent.checkProps(nextProps);
        if (this.props.id == nextProps.id) {
            this.updateExternalComponentAndSaveProps(nextProps);
        } else if (this.parentContainer) {
            this.remountExternalObject(this.parentContainer, nextProps);
        }
    }

    private onRef(parentContainer: HTMLElement | null){
        if (this.props.debug) {
            console.log("ExternalObjectComponent.onRef: this.props =", this.props);
        }
        this.remountExternalObject(parentContainer, this.props as Readonly<P & ES>);
    }

    /**
     * Renders a "div" element which serves as the parent container for this component's external object.
     * The "div" element will have the "id" attribute set to this.props.id.
     *
     * @returns {JSX.Element}
     */
    render(): JSX.Element {
        return (
            <div id={this.props.id}
                 className={this.props.className}
                 style={this.props.style}
                 ref={this.onRef}
            >
                {this.renderChildren()}
            </div>
        );
    }

    //noinspection JSMethodCanBeStatic
    protected renderChildren() {
        return null;
    }

    /**
     * Removes the current external object from cache and creates a new one with the current props.
     * Clients may call this method to force a regeneration of their external component.
     */
    forceRegeneration() {
        let externalObjectStore = this.props.externalObjectStore;
        let externalObjectRef = externalObjectStore[this.props.id];
        if (externalObjectRef) {
            delete externalObjectStore[this.props.id];
            if (this.parentContainer && externalObjectRef.container) {
                this.parentContainer.removeChild(externalObjectRef.container);
            }
            this.remountExternalObject(this.parentContainer, this.props as Readonly<P & ES>);
        }
    }

    protected remountExternalObject(parentContainer: HTMLElement | null, props: Readonly<P & ES>) {
        if (this.props.debug) {
            console.log("ExternalObjectComponent.remountExternalObject: props.id =", props && props.id);
        }
        if (parentContainer) {
            if (parentContainer.id != props.id) {
                this.unmountExternalObject(parentContainer, this.props as Readonly<P & ES>);
            }
            if (props.id in props.externalObjectStore) {
                this.mountExistingExternalObject(parentContainer, props);
            } else {
                this.mountNewExternalObject(parentContainer, props);
            }
        } else if (this.parentContainer) {
            this.unmountExternalObject(this.parentContainer, props);
        }
    }

    private mountNewExternalObject(parentContainer: HTMLElement, props: Readonly<P & ES>) {
        if (props.debug) {
            console.log("ExternalObjectComponent.mountNewExternalObject: props.id =", props.id);
        }
        const container = this.newContainer(props.id);
        if (container) {
            if (props.debug) {
                console.log("ExternalObjectComponent: attaching new external object with id =", props.id);
            }
            parentContainer.appendChild(container);
        }
        const object = this.newExternalObject(parentContainer, container);
        props.externalObjectStore[props.id] = {object, container};
        this.parentContainer = parentContainer;
        this.externalObjectMounted(object, props, parentContainer, container);
        this.updateExternalComponentAndSaveProps(props);
    }

    private mountExistingExternalObject(parentContainer: HTMLElement, props: Readonly<P & ES>) {
        if (props.debug) {
            console.log("ExternalObjectComponent.mountExistingExternalObject: props.id =", props.id);
        }
        const externalObjectRef = props.externalObjectStore[props.id];
        assert.ok(externalObjectRef);
        const container = externalObjectRef.container;
        if (container && !parentContainer.contains(container)) {
            if (props.debug) {
                console.log("ExternalObjectComponent: attaching existing external object with id =", props.id);
            }
            parentContainer.appendChild(container);
        }
        this.parentContainer = parentContainer;
        this.externalObjectMounted(externalObjectRef.object, props, parentContainer, container);
        this.updateExternalComponentAndSaveProps(props);
    }

    private unmountExternalObject(parentContainer: HTMLElement, props: Readonly<P & ES>) {
        if (this.props.debug) {
            console.log("ExternalObjectComponent.unmountExternalObject: parentContainer.id =", parentContainer.id);
        }
        const externalObjectRef = props.externalObjectStore[parentContainer.id];
        assert.ok(externalObjectRef);
        const container = externalObjectRef.container;
        if (container && parentContainer.contains(container)) {
            if (props.debug) {
                console.log("ExternalObjectComponent: detaching external object with id =", container.id);
            }
            parentContainer.removeChild(container);
        }
        this.parentContainer = null;
        this.externalObjectUnmounted(externalObjectRef.object, props, parentContainer, container);
    }

    private updateExternalComponentAndSaveProps(nextProps: Readonly<P>): void {
        const externalObjectRef = nextProps.externalObjectStore[nextProps.id];
        assert.ok(externalObjectRef);
        // Get previous props
        const prevState = externalObjectRef.state;
        const nextState = this.propsToExternalObjectState(nextProps, prevState);
        if (this.props.debug) {
            console.log("ExternalObjectComponent: updating existing external object");
            console.log("  this.props.id =", this.props.id);
            console.log("  nextProps.id  =", nextProps.id);
            console.log("  prevState     =", prevState);
            console.log("  nextState     =", nextState);
        }
        if (this.shouldExternalObjectUpdate(prevState, nextState)) {
            this.updateExternalObject(
                externalObjectRef.object,
                prevState, nextState,
                this.parentContainer,
                externalObjectRef.container
            );
        }
        // Remember new state
        externalObjectRef.state = nextState;
    }

    //noinspection JSMethodCanBeStatic
    protected shouldExternalObjectUpdate(prevState: ES, nextState: ES): boolean {
        return !shallowEqual(prevState, nextState);
    }
}
