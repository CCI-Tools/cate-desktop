import {should, expect} from 'chai';
import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from './ExternalObjectComponent';

should();

/**
 * HTMLElement mock
 */
class HTMLElementMock {
    nodeName: string;
    children: Array<HTMLElement>;

    constructor(tagName: string) {
        this.nodeName = tagName;
        this.children = [];
    }

    //noinspection JSUnusedGlobalSymbols
    appendChild(element: HTMLElement) {
        this.children.push(element);
    }

    //noinspection JSUnusedGlobalSymbols
    removeChild(element: HTMLElement) {
        for (let i = 0; i < this.children.length; i++) {
            let e = this.children[i];
            if (e === element) {
                delete this.children[i];
                break;
            }
        }
    }
}

type MyExternalObject = {
    id: string;
    foo: number;
};

interface MyExternalState  {
    foo: number;
}

interface MyExternalComponentProps extends IExternalObjectComponentProps<MyExternalObject, MyExternalState>, MyExternalState {
}

class MyExternalComponent extends ExternalObjectComponent<MyExternalObject, MyExternalState, MyExternalComponentProps, null> {

    trace: any[] = [];

    constructor(props: MyExternalComponentProps) {
        super(props);
    }

    mount(parentContainer: HTMLElement|null) {
        this.remountExternalObject(parentContainer as any);
    }

    newContainer(id: string): HTMLElement {
        return new HTMLElementMock("div") as any;
    }

    newExternalObject(container: HTMLElement): MyExternalObject {
        this.trace.push({method: "create"});
        return {id: this.props.id, foo: this.props.foo};
    }

    propsToExternalObjectState(props: MyExternalComponentProps&MyExternalState): MyExternalState {
        return {foo: props.foo};
    }

    updateExternalObject(object: MyExternalObject,
                         prevState: MyExternalState,
                         nextState: MyExternalState,
                         container: HTMLElement): void {
        this.trace.push({method: "updateExternalComponent", object, container, prevState, nextState});
    }

    externalObjectMounted(object: MyExternalObject): void {
        this.trace.push({method: "externalObjectMounted", object});
    }

    externalObjectUnmounted(object: MyExternalObject): void {
        this.trace.push({method: "externalObjectUnmounted", object});
    }
}


describe('PermanentComponent', function () {
    it('lets update() method correctly mount/unmount the external object', function () {
        let externalObjectStore = {};
        let instance1 = new MyExternalComponent({id: "P6", externalObjectStore, foo: 6});
        let instance2 = new MyExternalComponent({id: "P6", externalObjectStore, foo: 7});

        let parentContainer1 = new HTMLElementMock("div");

        instance1.mount(parentContainer1 as any);
        expect(instance1.trace).to.deep.equal([
            {
                method: "create"
            },
            {
                method: "externalObjectMounted",
                object: {
                    foo: 6,
                    id: "P6",
                }
            },
            {
                method: "updateExternalComponent",
                object: {
                    id: "P6",
                    foo: 6,
                },
                container: {
                    children: [
                        {
                            children: [],
                            nodeName: "div"
                        }
                    ],
                    nodeName: "div",
                },
                prevState: undefined,
                nextState: {
                    foo: 6
                },
            }]);
        instance1.trace = [];

        instance1.mount(null);
        expect(instance1.trace).to.deep.equal([{
            method: "externalObjectUnmounted",
            object: {id: "P6", foo: 6}
        }]);

        let parentContainer2 = new HTMLElementMock("div");
        instance2.mount(parentContainer2 as any);
        instance2.mount(null);
        instance2.componentWillUpdate({id: "P6", externalObjectStore, foo: 8});
        instance2.mount(parentContainer2 as any);
        instance2.componentWillUpdate({id: "P7", externalObjectStore, foo: 8});
        instance2.mount(parentContainer2 as any);
    });
});
