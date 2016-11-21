import {expect} from 'chai';
import {ComponentBinding} from './compbind';

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
        expect(myReactComp1.binding.parentContainer).to.equal(parentContainer1);
        let component1 = myReactComp1.binding.component;
        expect(component1).not.to.be.null;
        expect(component1).not.to.be.undefined;
        expect(component1.id).to.equal("P6");
        myReactComp1.binding.handleParentContainerRef(null);
        expect(myReactComp1.binding.parentContainer).to.be.null;
        expect(myReactComp1.binding.component).to.be.null;

        let parentContainer2 = new HTMLElement("div");
        myReactComp2.binding.handleParentContainerRef(parentContainer2);
        expect(myReactComp2.binding.parentContainer).to.equal(parentContainer2);
        let component2 = myReactComp2.binding.component;
        expect(component2).to.equal(component1);
        myReactComp2.binding.handleParentContainerRef(null);
        expect(myReactComp2.binding.parentContainer).to.be.null;
        expect(myReactComp2.binding.component).to.be.null;

        expect(Object.keys(componentStore).length).to.equal(1);
        expect(componentStore).to.contain.keys("P6");
        expect(componentStore["P6"]).to.equal(component1);

        myReactComp1.binding.deleteComponent("P6");
        expect(myReactComp1.trace).to.deep.equal(["create", "dispose"]);

    });
});
