import {
    VariableImageLayerState,
    VectorLayerState, ResourceState,
    ResourceVectorLayerState, LayerState
} from "../state";
import {
    ImageLayerDescriptor, VectorLayerDescriptor, LayerDescriptors,
    DataSource, ImageryProvider, GeoJsonDataSource, Viewer, Entity
} from "../components/cesium/CesiumGlobe";
import {
    findVariable, findResource, getTileUrl, getFeatureCollectionUrl, getGeoJSONCountriesUrl,
    SELECTED_VARIABLE_LAYER_ID, COUNTRIES_LAYER_ID,
} from "../state-util";
import {memoize} from '../../common/memoize';
import {EMPTY_OBJECT} from "../selectors";

const Cesium: any = require('cesium');


export function convertLayersToLayerDescriptors(layers: LayerState[],
                                                resources: ResourceState[],
                                                baseUrl: string,
                                                baseDir: string): LayerDescriptors {
    if (!layers || !layers.length) {
        return EMPTY_OBJECT;
    }
    let layerDescriptors: ImageLayerDescriptor[];
    let dataSourceDescriptors: VectorLayerDescriptor[];
    for (let layer of layers) {
        let layerDescriptor: ImageLayerDescriptor;
        let dataSourceDescriptor: VectorLayerDescriptor;
        switch (layer.type) {
            case 'VariableImage': {
                layerDescriptor = convertVariableImageLayerToDescriptor(baseUrl, baseDir, resources,
                                                                        layer as VariableImageLayerState);
                break;
            }
            case 'ResourceVector': {
                dataSourceDescriptor = convertResourceVectorLayerToDescriptor(baseUrl, baseDir, resources,
                                                                              layer as ResourceVectorLayerState);
                break;
            }
            case 'Vector': {
                dataSourceDescriptor = convertVectorLayerToDescriptor(baseUrl,
                                                                      layer as VectorLayerState);
                break;
            }
        }
        if (layerDescriptor) {
            if (!layerDescriptors) {
                layerDescriptors = [layerDescriptor];
            } else {
                // noinspection JSUnusedAssignment
                layerDescriptors.push(layerDescriptor);
            }
        } else if (dataSourceDescriptor) {
            if (!dataSourceDescriptors) {
                dataSourceDescriptors = [dataSourceDescriptor];
            } else {
                // noinspection JSUnusedAssignment
                dataSourceDescriptors.push(dataSourceDescriptor);
            }
        } else if (layer.id !== SELECTED_VARIABLE_LAYER_ID) {
            console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
        }
    }

    return {imageLayerDescriptors: layerDescriptors, vectorLayerDescriptors: dataSourceDescriptors};
}


function convertVariableImageLayerToDescriptor(baseUrl: string,
                                               baseDir: string,
                                               resources: ResourceState[],
                                               layer: VariableImageLayerState): ImageLayerDescriptor | null {
    const variable = findVariable(resources, layer);
    if (!variable) {
        console.warn(`GlobeView: variable "${layer.varName}" not found in resource "${layer.resId}"`);
        return null;
    }
    const imageLayout = variable.imageLayout;
    if (!variable.imageLayout) {
        console.warn(`GlobeView: variable "${layer.varName}" of resource "${layer.resId}" has no imageLayout`);
        return null;
    }
    const url = getTileUrl(baseUrl, baseDir, layer);
    let rectangle = Cesium.Rectangle.MAX_VALUE;
    if (imageLayout.extent) {
        const extent = imageLayout.extent;
        rectangle = Cesium.Rectangle.fromDegrees(extent.west, extent.south, extent.east, extent.north);
    }
    return Object.assign({}, layer, {
        imageryProvider: createImageryProvider,
        imageryProviderOptions: {
            url,
            rectangle,
            minimumLevel: 0,
            maximumLevel: imageLayout.numLevels - 1,
            tileWidth: imageLayout.tileWidth,
            tileHeight: imageLayout.tileHeight,
            tilingScheme: new Cesium.GeographicTilingScheme({
                                                                rectangle,
                                                                numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                                                                numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
                                                            }),
        },
    });
}

function convertResourceVectorLayerToDescriptor(baseUrl: string,
                                                baseDir: string,
                                                resources: ResourceState[],
                                                layer: ResourceVectorLayerState): VectorLayerDescriptor | null {
    const resource = findResource(resources, layer);
    if (!resource) {
        console.warn(`globe-view-desc: resource "${layer.resId}" not found"`);
        return null;
    }
    return {
        ...layer,
        dataSource: (viewer: Viewer, dataSourceOptions) => {
            return createResourceGeoJSONDataSource(dataSourceOptions.url, dataSourceOptions.resName);
        },
        dataSourceOptions: {
            url: getFeatureCollectionUrl(baseUrl, baseDir, layer),
            resId: resource.id,
            resName: resource.name
        },
    } as VectorLayerDescriptor;
}

function convertVectorLayerToDescriptor(baseUrl: string,
                                        layer: VectorLayerState): VectorLayerDescriptor | null {
    let url = layer.url;
    if (layer.id === COUNTRIES_LAYER_ID) {
        url = getGeoJSONCountriesUrl(baseUrl);
    }
    return {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        dataSource: createGeoJsonDataSource,
        dataSourceOptions: {url},
    };
}

/**
 * Creates a Cesium.UrlTemplateImageryProvider instance.
 *
 * @param viewer the Cesium viewer
 * @param imageryProviderOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
 */
function createImageryProvider(viewer: Viewer, imageryProviderOptions): ImageryProvider {
    const imageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
    imageryProvider.errorEvent.addEventListener((event) => {
        console.error('GlobeView:', event);
    });
    return imageryProvider;
}

/**
 * Creates a Cesium.GeoJsonDataSource instance.
 *
 * @param viewer the Cesium viewer
 * @param dataSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
 */
function createGeoJsonDataSource(viewer: Viewer, dataSourceOptions): DataSource {
    return Cesium.GeoJsonDataSource.load(dataSourceOptions.url, {
        stroke: Cesium.Color.ORANGE,
        fill: new Cesium.Color(0, 0, 0, 0),
        strokeWidth: 5,
        markerSymbol: '?'
    });
}

function getDefaultStyle() {
    const colors = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE, Cesium.Color.YELLOW];
    const defaultStyle = {
        stroke: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 0.5),
        strokeWidth: 2,
        fill: Cesium.Color.fromAlpha(colors[Math.floor(colors.length * Math.random()) % colors.length], 0.5),
        // outline stroke  is only visible when polygon.height is 0, which is only set when clampToGround is false (default)
        // clampToGround: true,
    };
    return defaultStyle;
}

const createResourceGeoJSONDataSource = memoize((url: string, name: string) => {
    const customDataSource: DataSource = new Cesium.CustomDataSource(name);
    let numFeatures = 0;
    const worker = new Worker("common/stream-geojson.js");
    worker.postMessage(url);
    worker.onmessage = function (event: MessageEvent) {

        const features = event.data;
        if (!features) {
            console.log(`Received ${numFeatures} feature(s) in total from ${url}`);
            return;
        }

        numFeatures += features.length;
        console.log(`Received another ${features.length} feature(s) from ${url}`);

        const pointColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.9);
        const pointOutlineColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.5);

        Cesium.GeoJsonDataSource.load({type: 'FeatureCollection', features: features}, getDefaultStyle())
            .then((geoJsonDataSource: GeoJsonDataSource) => {

                const featureMap = new Map();
                features.forEach(f => featureMap.set(f.id, f));

                const scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.1);
                const translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.25);

                geoJsonDataSource.entities.suspendEvents();
                customDataSource.entities.suspendEvents();
                for (let entity of geoJsonDataSource.entities.values) {
                    //console.log('entity: ', entity);

                    // TODO (nf/mz): Generalize this code. This is for Glaciers CCI.
                    // See #491: use a special style for feature geometries that are expandable/collapsible.
                    const pixelSizeMin = 10;
                    const pixelSizeMax = 50;
                    const areaMin = 20.;
                    const areaMax = 500.;
                    const feature = featureMap.get(entity.id);
                    let ratio = 0.5;
                    let description;
                    let isPoint = !!(entity.point || entity.billboard || entity.label);
                    if (feature && feature.properties) {
                        let area = feature.properties['area_npl43'];
                        if (area) {
                            ratio = (area - areaMin) / (areaMax - areaMin);
                            if (ratio < 0.) {
                                ratio = 0.;
                            }
                            if (ratio > 1.) {
                                ratio = 1.;
                            }
                        }

                        description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>';
                        Object.getOwnPropertyNames(feature.properties)
                            .map(n => `<tr><th>${n}</th><td>${feature.properties[n]}</td></tr>`)
                            .forEach(d => description += d);
                        description += '</tbody></table>';
                    }
                    const pixelSize = pixelSizeMin + ratio * (pixelSizeMax - pixelSizeMin);

                    if (isPoint) {
                        customDataSource.entities.add({
                                                          id: 'ds-' + entity.id,
                                                          name: entity.id,
                                                          position: entity.position,
                                                          description,
                                                          point: {
                                                              color: pointColor,
                                                              outlineColor: pointOutlineColor,
                                                              outlineWidth: 5,
                                                              // pixelSize will multiply by the scale factor, so in this
                                                              // example the size will range from pixelSize (near) to 0.1*pixelSize (far).
                                                              pixelSize,
                                                              scaleByDistance,
                                                              translucencyByDistance,
                                                          }
                                                      });
                    } else {
                        customDataSource.entities.add(entity);
                    }
                }

                geoJsonDataSource.entities.removeAll();
                customDataSource.entities.resumeEvents();
                console.log(`Added another ${features.length} feature(s) to Cesium custom data source`);
            });
    };
    return customDataSource;
});

export function loadDetailedGeometry(entity: Entity, featureUrl: string) {

    console.log("loadDetailedGeometry", entity, featureUrl);

    Cesium.GeoJsonDataSource.load(featureUrl, getDefaultStyle())
        .then((geoJsonDataSource: GeoJsonDataSource) => {
            if (geoJsonDataSource.entities.values) {
                const detailedEntity = geoJsonDataSource.entities.values[0];
                entity.point = undefined;
                entity.polygon = detailedEntity.polygon;
            }
        });
}

