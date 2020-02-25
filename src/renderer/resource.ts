/*
 * IMPORTANT NOTE: This is experimental code not used so far.
 */

export interface Element {
    type: any;
    attributeMap?: AttributeMap | {};
}

export interface ElementGroup<E extends Element> extends Element {
    type: 'ElementGroup';
    elements: E[];
}

export interface DataElement extends Element {
    dataType: string;
}

export interface GroupElement<E extends Element> extends Element {
    rootGroup?: ElementGroup<E>;
}

export interface DataArray extends DataElement {
    type: 'DataArray';
    name: string;
    numDims?: number;
    dimNames?: string[];
    shape?: number[];
    chunkSizes?: number[];
    units?: string;
    validMin?: number;
    validMax?: number;
    data?: any[];
    isCoord?: boolean;
    isYFlipped?: boolean;
    imageLayout?: ImageLayout;
    imageStyle?: ImageStyle;
}

export interface Dataset extends GroupElement<DataArray> {
    type: 'Dataset';
}

export interface Series extends DataElement {
    type: 'Series';
    name: string;
    shape?: number[];
    units?: string;
    validMin?: number;
    validMax?: number;
    data?: any[];
}

export interface DataFrame extends GroupElement<Series> {
    type: 'DataFrame';
}

/**
 * A generic data resource.
 */
export interface DataResource<E extends Element> {
    /**
     * An ID that stays the same during the lifetime of a workspace.
     */
    id: number;

    /**
     * An editable name.
     */
    name: string;

    /**
     * Whether to persists the resource for faster loading.
     */
    persistent: boolean;

    /**
     * Represents the actual data (in Python).
     */
    element: E;
}


export interface ImageLayout {
}

export interface ImageStyle {
    colorMapName?: string;
    displayMin?: number;
    displayMax?: number;
}

export type AttributeValue = any;

export interface AttributeMap {
    [attributeName: string]: AttributeValue;
}

