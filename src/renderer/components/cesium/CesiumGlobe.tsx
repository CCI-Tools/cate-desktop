import * as React from 'react';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'

const Cesium: any = require('cesium');
// console.log(Cesium);
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');
const CesiumViewer: any = Cesium.Viewer;
const Entity: any = Cesium.Entity;
const Cartesian3: any = Cesium.Cartesian3;

/**
 * Interface representing API subset of the CesiumViewer we are using in CesiumGlobe.
 */
interface CesiumViewerMin {
    container: HTMLElement;
    entities: any;
}

// TODO: only used to get electron.app.getAppPath
const {app} = require('electron').remote;

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


export interface ICesiumGlobeProps extends IPermanentComponentProps {
    id: string;
    offlineMode?: boolean;
    pins?: Array<any>;
}

/**
 * A component that wraps a Cesium 3D Globe.
 *
 * @author Norman Fomferra
 */
export class CesiumGlobe extends PermanentComponent<CesiumViewerMin, ICesiumGlobeProps, any> {

    constructor(props: ICesiumGlobeProps) {
        super(props);
    }

    get viewer(): CesiumViewerMin {
        return this.permanentObject;
    }

    createPermanentObject(): CesiumViewerMin {
        const container = this.createContainer();

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            const baseUrl = Cesium.buildModuleUrl('');
            const imageryProviderOptions = {
                url: baseUrl + 'Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg',
                tilingScheme: new Cesium.GeographicTilingScheme(),
                minimumLevel: 0,
                maximumLevel: 2,
                credit: 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
            };
            console.log('imageryProviderOptions: ', imageryProviderOptions);
            baseLayerImageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
        } else {
            baseLayerImageryProvider = new Cesium.BingMapsImageryProvider({
                url: 'http://dev.virtualearth.net'
            });
        }

        const cesiumViewerOptions = {
            animation: false,
            baseLayerPicker: false,
            selectionIndicator: true,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: 'creditContainer',
            imageryProvider: baseLayerImageryProvider,
            navigationInstructionsInitiallyVisible: false,
            automaticallyTrackDataSourceClocks: false,
        };

        // Create the Cesium Viewer
        let viewer = new CesiumViewer(container, cesiumViewerOptions);

        // Add the initial points
        this.props.pins.forEach((point) => {
            //noinspection JSFileReferences
            let billboard = {
                image: app.getAppPath() + '/resources/images/pin.svg',
                width: 30,
                height: 30
            };
            viewer.entities.add(new Entity({
                id: point.id,
                show: point.visible,
                position: new Cartesian3.fromDegrees(point.longitude, point.latitude),
                billboard: billboard
            }));
        });

        return viewer;
    }

    componentWillReceiveProps(nextProps: ICesiumGlobeProps) {
        const patches = CesiumGlobe.calculatePatches(this.props, nextProps);
        const viewer = this.viewer;
        // Map patch operations to Cesium's Entity API
        patches.forEach((patch) => {
            if (patch.attribute === 'visible') {
                this.viewer.entities.getById(patch.id).show = patch.nextValue;
            }
            // else if (patch.attribute === 'name') { .. and so on .. }
        });
    }

    private static calculatePatches(currentProps: ICesiumGlobeProps, nextProps: ICesiumGlobeProps) {
        const patches = [];

        currentProps.pins.forEach((currCity, index) => {
            let nextCity = nextProps.pins[index];

            if (currCity.visible !== nextCity.visible) {
                patches.push({
                    id: currCity.id,
                    attribute: 'visible',
                    nextValue: nextCity.visible
                });
            }
            // else if (currCity.name !== nextCity.name) { .. and so on .. }
        });

        return patches;
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }
}
