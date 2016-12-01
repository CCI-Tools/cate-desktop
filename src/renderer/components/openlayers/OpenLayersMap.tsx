import * as React from 'react';
import * as ol from 'openlayers'
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'


type OpenLayersObject = {
    container: HTMLElement;
    map: ol.Map;
}

export interface IOpenLayersMapProps extends IPermanentComponentProps {
}

/**
 * A component that wraps an OpenLayers 2D Map.
 *
 * @author Norman Fomferra
 * @author Muhammad Bala
 */
export class OpenLayersMap extends PermanentComponent<OpenLayersObject, IOpenLayersMapProps,any> {

    constructor(props) {
        super(props)
    }

    createPermanentObject(parentContainer: HTMLElement): OpenLayersObject {
        const divElement = this.createContainer();
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

    permanentObjectMounted(permanentObject: OpenLayersObject): void {
        permanentObject.map.updateSize();
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "ol-container-" + this.props.id);
        div.setAttribute("class", "ol-container");
        return div;
    }
}
