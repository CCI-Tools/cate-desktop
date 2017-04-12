import {should, expect} from 'chai';
import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent, ExternalObjectRef} from './ExternalObjectComponent';

should();

/**
 * HTMLElement mock
 */
class HTMLElement {
    nodeName: string;
    children: Array<HTMLElement>;

    constructor(tagName: string) {
        this.nodeName = tagName;
        this.children = [];
    }

    appendChild(element: HTMLElement) {
        this.children.push(element);
    }

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

type MyExternalState = {
    foo: number;
};

interface MyExternalComponentProps extends IExternalObjectComponentProps<MyExternalObject, MyExternalState> {
    foo: number;
}

class MyExternalComponent extends ExternalObjectComponent<MyExternalObject, MyExternalState, MyExternalComponentProps, any> {

    trace: any[] = [];

    constructor(props: MyExternalComponentProps) {
        super(props);
    }

    mount(parentContainer: HTMLElement|null) {
        this.remountExternalObject(parentContainer as any);
    }

    newExternalObject(): ExternalObjectRef<MyExternalObject, MyExternalComponentProps> {
        this.trace.push({method: "create"});
        let container = new HTMLElement("div");
        return {
            object: {id: this.props.id, foo: this.props.foo},
            container: container as any,
        };
    }


    propsToExternalObjectState(props: MyExternalComponentProps&MyExternalState): MyExternalState {
        return {foo: props.foo};
    }

    updateExternalObject(object: MyExternalObject,
                         parentContainer: any,
                         prevProps: MyExternalComponentProps,
                         nextProps: MyExternalComponentProps) {
        this.trace.push({method: "updateExternalComponent", object, parentContainer, prevProps, nextProps});
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

        let parentContainer1 = new HTMLElement("div");

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
                parentContainer: {
                    children: [
                        {
                            children: [],
                            nodeName: "div"
                        }
                    ],
                    nodeName: "div",
                },
                prevProps: undefined,
                nextProps: {
                    foo: 6
                },
            }]);
        instance1.trace = [];

        instance1.mount(null);
        expect(instance1.trace).to.deep.equal([{
            method: "externalObjectUnmounted",
            object: {id: "P6", foo: 6}
        }]);

        let parentContainer2 = new HTMLElement("div");
        instance2.mount(parentContainer2 as any);
        instance2.mount(null);
        instance2.componentWillUpdate({id: "P6", externalObjectStore, foo: 8});
        instance2.mount(parentContainer2 as any);
        instance2.componentWillUpdate({id: "P7", externalObjectStore, foo: 8});
        instance2.mount(parentContainer2 as any);
    });
});
