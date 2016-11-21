import * as React from 'react';
import * as ol from 'openlayers'
import {INativeComponentProps, NativeComponent} from '../../util/nativecomp'


type OpenLayersType = {
    container: HTMLElement;
    map: ol.Map;
}

export interface OpenLayersProps extends INativeComponentProps {
}

export class OpenLayersComponent extends NativeComponent<OpenLayersType, OpenLayersProps,any> {
    constructor(props) {
        super(props)
    }

    createNativeComponent(parentContainer: HTMLElement): OpenLayersType {
        const divElement = document.createElement("div");
        divElement.setAttribute("id", "container_" + this.props.id);
        divElement.setAttribute("style", "width:100%; height:100%;");
        const options = {
            target: divElement,
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([37.41, 8.82]),
                zoom: 4
            })
        };
        return {
            container: divElement,
            map: new ol.Map(options)
        };
    }

    nativeComponentMounted(parentContainer: HTMLElement, nativeComponent: OpenLayersType): void {
        nativeComponent.map.updateSize();
    }
}
