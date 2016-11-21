import * as React from 'react';

type ContainerType = HTMLElement|any;

export interface INativeComponentType {
    container: ContainerType;
}

export interface INativeComponentProps {
    id: string;
    cache?: Object;
    style?: Object;
    className?: string;
    debug?: boolean;
}

export abstract class NativeComponent<T extends INativeComponentType, P extends INativeComponentProps, S> extends React.Component<P, S> {
    private static readonly defaultNativeComponentCache: Object = {};

    private _parentContainer: HTMLElement|null;
    private _nativeComponent: T|null;

    constructor(props: INativeComponentProps) {
        super(props);
        if (!props.id) {
            throw new Error("can't construct NativeComponent without id");
        }
        this._parentContainer = null;
        this._nativeComponent = null;
    }

    get parentContainer(): HTMLElement|null {
        return this._parentContainer;
    }

    get nativeComponent(): T|null {
        return this._nativeComponent;
    }

    get nativeComponentCache(): Object {
        return this.props.cache || NativeComponent.defaultNativeComponentCache;
    }

    abstract createNativeComponent(parentContainer: ContainerType): T;

    disposeNativeComponent(nativeComponent: T): void {
    }

    nativeComponentMounted(parentContainer: ContainerType, nativeComponent:T): void {
    }

    nativeComponentUnmounted(parentContainer: ContainerType, nativeComponent:T): void {
    }

    dispose() {
        const id = this.props.id;
        const nativeComponentCache = this.nativeComponentCache;
        if (id in nativeComponentCache) {
            if (this.props.debug) {
                console.log("NativeComponent: disposing instance with id =", this.props.id);
            }
            let nativeComponent = nativeComponentCache[id];
            delete nativeComponentCache[id];
            this.disposeNativeComponent(nativeComponent);
        }
    }

    handleRef(parentContainer: ContainerType|null) {
        if (parentContainer) {
            if (this.props.id in this.nativeComponentCache) {
                this.mountExistingNativeComponent(parentContainer);
            } else {
                this.mountNewNativeComponent(parentContainer);
            }
        } else if (this._parentContainer) {
            this.unmountNativeComponent(this._parentContainer);
        }
    }

    //noinspection JSMethodCanBeStatic
    /**
     * Overridden to always return false.
     * @returns {boolean} false
     */
    shouldComponentUpdate() {
        return false;
    }

    /**
     * By default, returns a "div" element.
     * @returns {JSX.Element}
     */
    render(): JSX.Element {
        return <div id={this.props.id}
                    className={this.props.className}
                    style={this.props.style}
                    ref={this.handleRef.bind(this)}/>
    }

    private mountNewNativeComponent(parentContainer: ContainerType) {
        if (this.props.debug) {
            console.log("NativeComponent: mounting new instance with id =", this.props.id);
        }
        let nativeComponent = this.createNativeComponent(parentContainer);
        parentContainer.appendChild(nativeComponent.container);
        this.nativeComponentCache[this.props.id] = nativeComponent;
        this._nativeComponent = nativeComponent;
        this._parentContainer = parentContainer;
        this.nativeComponentMounted(parentContainer, nativeComponent);
    }

    private mountExistingNativeComponent(parentContainer: ContainerType) {
        if (this.props.debug) {
            console.log("NativeComponent: mounting existing instance with id =", this.props.id);
        }
        let nativeComponent = this.nativeComponentCache[this.props.id];
        parentContainer.appendChild(nativeComponent.container);
        this._nativeComponent = nativeComponent;
        this._parentContainer = parentContainer;
        this.nativeComponentMounted(parentContainer, nativeComponent);
    }

    private unmountNativeComponent(parentContainer: ContainerType) {
        if (this.props.debug) {
            console.log("NativeComponent: unmounting instance with id =", this.props.id);
        }
        parentContainer.removeChild(this._nativeComponent.container);
        let component = this._nativeComponent;
        this._nativeComponent = null;
        this._parentContainer = null;
        this.nativeComponentUnmounted(parentContainer, component);
    }
}
