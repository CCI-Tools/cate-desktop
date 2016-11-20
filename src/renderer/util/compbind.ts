export interface IComponent {
    container: HTMLElement;
}

export type ComponentFactory<T extends IComponent> = (container: HTMLElement) => T;
export type ComponentDisposer<T extends IComponent> = (T) => void;

export class ComponentBinding<T extends IComponent> {
    private static readonly globalComponentStore: Object = {};
    private readonly id: string;
    private readonly componentStore: Object;
    private readonly componentFactory: ComponentFactory<T>;
    private readonly componentDisposer: ComponentDisposer<T>;

    private _parentContainer: HTMLElement|null = null;
    private _component: T|null = null;

    constructor(id: string, componentFactory: ComponentFactory<T>, componentDisposer: ComponentDisposer<T>, componentStore?: Object) {
        this.id = id;
        this.componentFactory = componentFactory;
        this.componentDisposer = componentDisposer;
        this.componentStore = componentStore ? componentStore : ComponentBinding.globalComponentStore;
        this.handleParentContainerRef = this.handleParentContainerRef.bind(this);
    }

    get parentContainer(): HTMLElement|null {
        return this._parentContainer;
    }

    get component(): T|null {
        return this._component;
    }

    deleteComponent(id) {
        if (id in this.componentStore) {
            let component = this.componentStore[id]
            delete this.componentStore[id];
            if (this.componentDisposer) {
                this.componentDisposer(component);
            }
        }
    }

    handleParentContainerRef(parentContainer: HTMLElement | null) {
        if (parentContainer) {
            if (this.id in this.componentStore) {
                this.mountExistingComponent(parentContainer);
            } else {
                this.mountNewComponent(parentContainer);
            }
        } else if (this._parentContainer) {
            this.removeMountedComponent(this._parentContainer);
        }
    }

    private mountNewComponent(parentContainer: HTMLElement) {
        // console.log("ComponentBinding: mounting new instance", this.id);
        let component = this.componentFactory(parentContainer);
        parentContainer.appendChild(component.container);
        this.componentStore[this.id] = component;
        this._component = component;
        this._parentContainer = parentContainer;
    }

    private mountExistingComponent(parentContainer: HTMLElement) {
        // console.log("ComponentBinding: mounting existing instance", this.id);
        let component = this.componentStore[this.id];
        parentContainer.appendChild(component.container);
        this._component = component;
        this._parentContainer = parentContainer;
    }

    private removeMountedComponent(parentContainer: HTMLElement) {
        // console.log("ComponentBinding: removing mounted component", this.id);
        parentContainer.removeChild(this._component.container);
        this._component = null;
        this._parentContainer = null;
    }
}
