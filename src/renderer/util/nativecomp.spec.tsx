import {expect} from 'chai';
import * as React from 'react';
import {INativeComponentProps, NativeComponent} from './nativecomp';

const should = require('chai').should();

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

type MyNativeCompType = {
    id: string;
    container: HTMLElement;
};

interface MyNativeCompProps extends INativeComponentProps {
    foo: number;
}

class MyNativeComponent extends NativeComponent<MyNativeCompType, INativeComponentProps, any> {

    readonly trace: string[] = [];

    constructor(props) {
        super(props);
    }

    createNativeComponent(parentContainer: HTMLElement): MyNativeCompType {
        this.trace.push("create");
        let container = new HTMLElement("div");
        return {
            id: this.props.id,
            container: container,
        };
    }

    disposeNativeComponent(component: MyNativeCompType): void {
        this.trace.push("dispose");
    }

    nativeComponentMounted(parentContainer: HTMLElement, component: MyNativeCompType): void {
        this.trace.push("mount");
    }

    nativeComponentUnmounted(parentContainer: HTMLElement, component: MyNativeCompType): void {
        this.trace.push("unmount");
    }
}


describe('NativeComponent', function () {
    it('#handleRef (simulates mounting/unmounting of the React component)', function () {
        let cache = {};
        let instance1 = new MyNativeComponent({id: "P6", cache: cache});
        let instance2 = new MyNativeComponent({id: "P6", cache: cache});

        let parentContainer1 = new HTMLElement("div");
        instance1.handleRef(parentContainer1);
        expect(instance1.parentContainer).to.equal(parentContainer1);
        let component1 = instance1.nativeComponent;
        expect(component1).not.to.be.null;
        expect(component1).not.to.be.undefined;
        expect(component1.id).to.equal("P6");
        instance1.handleRef(null);
        expect(instance1.parentContainer).to.be.null;
        expect(instance1.nativeComponent).to.be.null;

        let parentContainer2 = new HTMLElement("div");
        instance2.handleRef(parentContainer2);
        expect(instance2.parentContainer).to.equal(parentContainer2);
        let component2 = instance2.nativeComponent;
        expect(component2).to.equal(component1);
        instance2.handleRef(null);
        expect(instance2.parentContainer).to.be.null;
        expect(instance2.nativeComponent).to.be.null;

        expect(Object.keys(cache).length).to.equal(1);
        expect(cache).to.contain.keys("P6");
        expect(cache["P6"]).to.equal(component1);

        instance1.dispose();
        expect(instance1.trace).to.deep.equal(["create", "mount", "unmount", "dispose"]);
    });
});
