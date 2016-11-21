import * as React from 'react';
import {INativeComponentProps, NativeComponent} from '../../util/nativecomp'

const Cesium: any = require('cesium');
// console.log(Cesium);
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');
const CesiumViewer: any = Cesium.Viewer;
const Entity: any = Cesium.Entity;
const Cartesian3: any = Cesium.Cartesian3;

type CesiumViewer = {container: HTMLElement, entities: any};

// TODO: only used to get electron.app.getAppPath
const {app} = require('electron').remote;

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


export interface ICesiumComponentProps extends INativeComponentProps {
    id: string;
    offlineMode?: boolean;
    cities?: Array<any>;
}

export class CesiumComponent extends NativeComponent<CesiumViewer, ICesiumComponentProps, any> {
    private viewer: CesiumViewer;

    constructor(props: ICesiumComponentProps) {
        super(props);
        console.log("CesiumComponent.constructor()", props);
        this.viewer = null;
    }

    createNativeComponent(parentContainer: HTMLElement): CesiumViewer {
        let container = this.createViewerContainer();

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            baseLayerImageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: Cesium.buildModuleUrl('node_modules/cesium/Build/Cesium/Assets/Textures/NaturalEarthII/{z}/{x}/{y}.jpg'),
                tilingScheme: new Cesium.GeographicTilingScheme(),
                minimumLevel: 0,
                maximumLevel: 2,
                credit: 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
            });
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
        this.props.cities.forEach((city) => {
            //noinspection JSFileReferences
            let billboard = {
                image: app.getAppPath() + '/resources/images/pin.svg',
                width: 30,
                height: 30
            };
            viewer.entities.add(new Entity({
                id: city.id,
                show: city.visible,
                position: new Cartesian3.fromDegrees(city.longitude, city.latitude),
                billboard: billboard
            }));
        });
        return viewer;
    }

    nativeComponentMounted(parentContainer: HTMLElement, component: CesiumViewer): void {
        console.log("CesiumComponent.nativeComponentMounted():", parentContainer, component);
        this.viewer = component;
    }

    nativeComponentUnmounted(parentContainer: HTMLElement, component: CesiumViewer): void {
        console.log("CesiumComponent.nativeComponentUnmounted():", parentContainer, component);
        this.viewer = null;
    }

    componentWillReceiveProps(nextProps: ICesiumComponentProps) {
        console.log("CesiumComponent.componentWillReceiveProps()");
        let patches = CesiumComponent.calculatePatches(this.props, nextProps);

        // Map patch operations to Cesium's Entity API
        patches.forEach((patch) => {
            if (patch.attribute === 'visible') {
                this.viewer.entities.getById(patch.id).show = patch.nextValue;
            }
            // else if (patch.attribute === 'name') { .. and so on .. }
        });
    }

    //noinspection JSMethodCanBeStatic

    private static calculatePatches(currentProps: ICesiumComponentProps, nextProps: ICesiumComponentProps) {
        let patches = [];

        currentProps.cities.forEach((currCity, index) => {
            let nextCity = nextProps.cities[index];

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

    private createViewerContainer(): HTMLDivElement {
        let div = document.createElement("div");
        div.setAttribute("id", "__container" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }
}
