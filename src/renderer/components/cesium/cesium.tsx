import * as React from 'react';

const Cesium: any = require('cesium');
// console.log(Cesium);
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');
const CesiumViewer: any = Cesium.Viewer;
const Entity: any = Cesium.Entity;
const Cartesian3: any = Cesium.Cartesian3;

// TODO: only used to get electron.app.getAppPath
const {app} = require('electron').remote;

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


export interface ICesiumComponentProps {
    id: string;
    offlineMode?: boolean;
    cities?: Array<any>
}

export class CesiumComponent extends React.Component<ICesiumComponentProps, any> {
    private static viewerCache: Object = {};
    private container: HTMLDivElement | null = null;
    private childContainer: HTMLDivElement | null = null;
    private viewer: any = null;

    constructor(props) {
        super(props);
        console.log("CesiumComponent.constructor()", props);
        if (!props.id) {
            throw new Error("can't construct CesiumComponent without id");
        }
    }

    private createViewer(container) {

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            baseLayerImageryProvider = new Cesium.UrlTemplateImageryProvider({
                url : Cesium.buildModuleUrl('node_modules/cesium/Build/Cesium/Assets/Textures/NaturalEarthII/{z}/{x}/{y}.jpg'),
                tilingScheme: new Cesium.GeographicTilingScheme(),
                minimumLevel: 0,
                maximumLevel: 2,
                credit : 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
            });
        } else {
            baseLayerImageryProvider = new Cesium.BingMapsImageryProvider({
                url: 'http://dev.virtualearth.net'
            });
        }

        const cesiumViewerOptions = {
            animation: false,
            baseLayerPicker: false,
            /* TODO: we need selectionIndicator later, but its style is currently corrupted*/
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

    componentWillReceiveProps(nextProps) {
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

    private createViewerContainer(): HTMLDivElement {
        let div = document.createElement("div");
        div.setAttribute("id", "__container" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        console.log("CesiumComponent.shouldComponentUpdate()");
        return false;
    }

    //noinspection JSMethodCanBeStatic
    componentDidMount() {
        console.log("CesiumComponent.componentDidMount()");
    }

    //noinspection JSMethodCanBeStatic
    componentWillUnmount() {
        console.log("CesiumComponent.componentWillUnmount()");
    }


    //noinspection JSMethodCanBeStatic
    componentWillUpdate(nextProps, nextState) {
        console.log("CesiumComponent.componentWillUpdate()", nextProps, nextState);
    }

    //noinspection JSMethodCanBeStatic
    componentDidUpdate(prevProps, prevState) {
        console.log("CesiumComponent.componentDidUpdate()", prevProps, prevState);
    }

    private static calculatePatches(currentState, nextState) {
        let patches = [];

        currentState.cities.forEach((currCity, index) => {
            let nextCity = nextState.cities[index];

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

    handleContainerRef(container: HTMLDivElement | null) {
        if (container) {
            let id = this.props.id;
            let childContainer;
            let viewer;
            if (id in CesiumComponent.viewerCache) {
                console.log("CesiumComponent.handleContainerRef(): reuse instance");
                viewer = CesiumComponent.viewerCache[id];
                childContainer = viewer.container;
                container.appendChild(childContainer);
            } else {
                console.log("CesiumComponent.handleContainerRef(): new instance");
                childContainer = this.createViewerContainer();
                container.appendChild(childContainer);
                viewer = this.createViewer(childContainer);
                CesiumComponent.viewerCache[id] = viewer;
            }
            this.viewer = viewer;
            this.container = container;
            this.childContainer = childContainer;
        } else if (this.container) {
            console.log("CesiumComponent.handleContainerRef(): removing child instance");
            this.container.removeChild(this.childContainer);
            this.viewer = null;
            this.childContainer = null;
            this.container = null;
        }
    }

    render() {
        console.log("CesiumComponent.render()");
        return (
            <div className="cesium-container" ref={this.handleContainerRef.bind(this)}/>
        );
    }
}
