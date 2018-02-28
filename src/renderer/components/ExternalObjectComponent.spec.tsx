import {should, expect} from 'chai';
import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from './ExternalObjectComponent';

should();

/**
 * HTMLElement mock
 */
class HTMLElementMock {
    id?: string;
    nodeName: string;
    children: Array<HTMLElement>;

    constructor(tagName: string, id: string) {
        this.nodeName = tagName;
        this.id = id;
        this.children = [];
    }

    //noinspection JSUnusedGlobalSymbols
    contains(child: HTMLElement) {
        return this.children.indexOf(child) >= 0;
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

    mount(parentContainer: HTMLElement|null, props: any) {
        this.remountExternalObject(parentContainer as any, props);
    }

    newContainer(id: string): HTMLElement {
        return new HTMLElementMock("div", 'container-' + id) as any;
    }

    newExternalObject(container: HTMLElement): MyExternalObject {
        this.trace.push({method: "create"});
        return {id: this.props.id, foo: this.props.foo};
    }

    propsToExternalObjectState(props: MyExternalComponentProps&MyExternalState, prevState?: MyExternalState): MyExternalState {
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
        let instance1 = new MyExternalComponent({id: "ID6", externalObjectStore, foo: 6});
        let instance2 = new MyExternalComponent({id: "ID6", externalObjectStore, foo: 7});

        let parentContainer1 = new HTMLElementMock("div", "ID6");

        instance1.mount(parentContainer1 as any, instance1.props);
        expect(instance1.trace).to.deep.equal([
            {
                method: "create"
            },
            {
                method: "externalObjectMounted",
                object: {
                    foo: 6,
                    id: "ID6",
                }
            },
            {
                method: "updateExternalComponent",
                object: {
                    id: "ID6",
                    foo: 6,
                },
                container: {
                    children: [
                        {
                            children: [],
                            nodeName: "div",
                            "id": "container-ID6"
                        }
                    ],
                    nodeName: "div",
                    id: "ID6"
                },
                prevState: undefined,
                nextState: {
                    foo: 6
                },
            }]);
        instance1.trace = [];

        instance1.mount(null, instance1.props);
        expect(instance1.trace).to.deep.equal([{
            method: "externalObjectUnmounted",
            object: {id: "ID6", foo: 6}
        }]);

    });
});
