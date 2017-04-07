import {should, expect} from 'chai';
import * as React from 'react';
import {IPermanentComponentProps, PermanentComponent} from './PermanentComponent';

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

type MyPermanentObject = {
    id: string;
    container: HTMLElement;
};

interface MyPermanentComponentProps extends IPermanentComponentProps {
    foo: number;
}

class MyPermanentComponent extends PermanentComponent<MyPermanentObject, MyPermanentComponentProps, any> {

    readonly trace: string[] = [];

    constructor(props: IPermanentComponentProps) {
        super(props);
    }

    createPermanentObject(): MyPermanentObject {
        this.trace.push("create");
        let container = new HTMLElement("div");
        return {
            id: this.props.id,
            container: container,
        };
    }

    disposePermanentObject(permanentObject: MyPermanentObject): void {
        this.trace.push("dispose");
    }

    permanentObjectMounted(permanentObject: MyPermanentObject): void {
        this.trace.push("mount");
    }

    permanentObjectUnmounted(permanentObject: MyPermanentObject): void {
        this.trace.push("unmount");
    }
}


describe('PermanentComponent', function () {
    it('#handleRef (simulates mounting/unmounting of the React component)', function () {
        let cache = {};
        let instance1 = new MyPermanentComponent({id: "P6", cache: cache});
        let instance2 = new MyPermanentComponent({id: "P6", cache: cache});

        let parentContainer1 = new HTMLElement("div");
        instance1.remountPermanentObject(parentContainer1 as any);
        expect(instance1.parentContainer).to.equal(parentContainer1);
        let component1 = instance1.permanentObject;
        expect(component1).not.to.be.null;
        expect(component1).not.to.be.undefined;
        expect(component1.id).to.equal("P6");
        instance1.remountPermanentObject(null);
        expect(instance1.parentContainer).to.be.null;
        expect(instance1.permanentObject).to.be.null;

        let parentContainer2 = new HTMLElement("div");
        instance2.remountPermanentObject(parentContainer2 as any);
        expect(instance2.parentContainer).to.equal(parentContainer2);
        let component2 = instance2.permanentObject;
        expect(component2).to.equal(component1);
        instance2.remountPermanentObject(null);
        expect(instance2.parentContainer).to.be.null;
        expect(instance2.permanentObject).to.be.null;

        expect(Object.keys(cache).length).to.equal(1);
        expect(cache).to.contain.keys("P6");
        expect(cache["P6"]).to.equal(component1);

        instance1.dispose();
        expect(instance1.trace).to.deep.equal(["create", "mount", "unmount", "dispose"]);
    });
});
