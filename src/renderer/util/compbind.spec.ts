import {ComponentBinding} from './compbind';
import assert = require("assert");

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

class MyReactComp {
    readonly id: string;
    readonly binding: any;
    readonly trace: string[] = [];

    constructor(componentStore) {
        this.id = "P6";
        this.binding = new ComponentBinding(this.id, this.createComponent.bind(this), this.disposeComponent.bind(this), componentStore);
    }

    createComponent(parentContainer: HTMLElement) {
        this.trace.push("create");
        return {
            id: this.id,
            container: new HTMLElement("canvas"),
        };
    }

    disposeComponent(component) {
        this.trace.push("dispose");
    }

}


describe('ComponentBinding', function () {
    it('works', function () {
        let componentStore = {};
        let myReactComp1 = new MyReactComp(componentStore);
        let myReactComp2 = new MyReactComp(componentStore);

        let parentContainer1 = new HTMLElement("div");
        myReactComp1.binding.handleParentContainerRef(parentContainer1);
        assert.ok(myReactComp1.binding.parentContainer === parentContainer1);
        let component1 = myReactComp1.binding.component;
        assert.ok(component1 !== null);
        assert.equal(component1.id, "P6");
        myReactComp1.binding.handleParentContainerRef(null);
        assert.equal(myReactComp1.binding.parentContainer, null);
        assert.equal(myReactComp1.binding.component, null);

        let parentContainer2 = new HTMLElement("div");
        myReactComp2.binding.handleParentContainerRef(parentContainer2);
        assert.ok(myReactComp2.binding.parentContainer === parentContainer2);
        let component2 = myReactComp2.binding.component;
        assert.ok(component2 !== null);
        assert.ok(component2 === component1);
        assert.equal(component2.id, "P6");
        myReactComp2.binding.handleParentContainerRef(null);
        assert.equal(myReactComp2.binding.parentContainer, null);
        assert.equal(myReactComp2.binding.component, null);

        assert.equal(Object.keys(componentStore).length, 1);
        assert.equal("P6" in componentStore, true);
        assert.ok(componentStore["P6"] === component1);

        myReactComp1.binding.deleteComponent("P6");
        assert.deepEqual(myReactComp1.trace, ["create", "dispose"]);

    });
});
