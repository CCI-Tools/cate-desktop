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

// TODO: enable this by configuration, e.g. a switch -ccitbxui-offline-mode
let offlineMode = false;

let baseLayerImageryProvider;
if (offlineMode) {
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
    /* TODO: we need selectionIndicator, but its style is currently corrupted*/
    selectionIndicator: false,
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

export class CesiumComponent extends React.Component<any, any> {
    viewer: any;

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {

        // Create the Cesium Viewer
        this.viewer = new CesiumViewer(this.refs["map"], cesiumViewerOptions);

        // Add the initial points
        this.props.cities.forEach((city) => {
            //noinspection JSFileReferences
            let billboard = {
                image: app.getAppPath() + '/resources/images/pin.svg',
                width: 30,
                height: 30
            };
            this.viewer.entities.add(new Entity({
                id: city.id,
                show: city.visible,
                position: new Cartesian3.fromDegrees(city.longitude, city.latitude),
                billboard: billboard
            }));
        });
    }

    componentWillReceiveProps(nextProps) {
        let patches = CesiumComponent.calculatePatches(this.props, nextProps);

        // Map patch operations to Cesium's Entity API
        patches.forEach((patch) => {
            if (patch.attribute === 'visible') {
                this.viewer.entities.getById(patch.id).show = patch.nextValue;
            }
            // else if (patch.attribute === 'name') { .. and so on .. }
        });
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

    render() {
        return (
            <div className="cesium-container" ref="map">
            </div>
    );
    }
}
