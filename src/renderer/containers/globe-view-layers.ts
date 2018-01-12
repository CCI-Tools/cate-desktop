import {
    VariableImageLayerState,
    VectorLayerState, ResourceState,
    ResourceVectorLayerState, LayerState
} from "../state";
import {
    ImageLayerDescriptor, VectorLayerDescriptor, LayerDescriptors,
} from "../components/cesium/CesiumGlobe";
import {
    findVariable, findResource, getTileUrl, getFeatureCollectionUrl, getGeoJSONCountriesUrl,
    SELECTED_VARIABLE_LAYER_ID, COUNTRIES_LAYER_ID,
} from "../state-util";
import {memoize} from '../../common/memoize';
import {EMPTY_OBJECT} from "../selectors";
import * as Cesium from "cesium";
import {isDefined, isNumber} from "../../common/types";

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
        console.warn(`globe-view-layers: resource "${layer.resId}" not found"`);
        return null;
    }
    return {
        ...layer,
        dataSource: (viewer: Cesium.Viewer, dataSourceOptions) => {
            return createResourceGeoJSONDataSource(dataSourceOptions.url, dataSourceOptions.resId);
        },
        dataSourceOptions: {
            url: getFeatureCollectionUrl(baseUrl, baseDir, layer),
            resId: resource.id,
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
function createImageryProvider(viewer: Cesium.Viewer, imageryProviderOptions): Cesium.ImageryProvider {
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
function createGeoJsonDataSource(viewer: Cesium.Viewer, dataSourceOptions): Cesium.DataSource {
    return Cesium.GeoJsonDataSource.load(dataSourceOptions.url, DEFAULT_GEOJSON_FEATURE_STYLE);
}

/**
 * Style must follow simplestyle-spec 1.1, see https://github.com/mapbox/simplestyle-spec
 */
const DEFAULT_GEOJSON_FEATURE_STYLE = {
    strokeWidth: 2,
    stroke: colorWithAlpha(Cesium.Color.WHITE, 0.75),
    fill: colorWithAlpha(Cesium.Color.WHITE, 0.25),
    markerSymbol: '?'
};

const COLORS = [
    Cesium.Color.RED,
    Cesium.Color.GREEN,
    Cesium.Color.BLUE,
    Cesium.Color.YELLOW,
    Cesium.Color.ORANGE,
    Cesium.Color.CYAN,
    Cesium.Color.MAGENTA,
    Cesium.Color.BLANCHEDALMOND,
    Cesium.Color.BURLYWOOD,
    Cesium.Color.CHOCOLATE,
    Cesium.Color.DARKBLUE,
    Cesium.Color.DARKORCHID,
    Cesium.Color.DARKORCHID,
    Cesium.Color.DARKRED,
    Cesium.Color.DIMGRAY,
    Cesium.Color.GHOSTWHITE,
    Cesium.Color.WHITE,
    Cesium.Color.LEMONCHIFFON,
    Cesium.Color.LIME,
];

function getRandomColor() {
    return COLORS[Math.floor(COLORS.length * Math.random())];
}

function colorWithAlpha(color: Cesium.Color, alpha: number) {
    return Cesium.Color.fromAlpha(color, alpha);
}

const getEntityStyleMap = memoize((resId: number) => {
    return {};
});

function styleEntity(entity, entityStyles) {

    let style = entityStyles[entity.id];
    let newStyle;
    if (!style) {
        newStyle = style = {};
        entityStyles[entity.id] = newStyle;
    }

    if (Cesium.defined(entity.polygon)) {
        if (newStyle) {
            const color = getRandomColor();
            newStyle.material = colorWithAlpha(color, 0.5);
            newStyle.outlineColor = colorWithAlpha(color, 0.9);
        }
        entity.polygon.material = style.material;
        entity.polygon.outlineColor = style.outlineColor;
    } else if (Cesium.defined(entity.polyline)) {
        if (newStyle) {
            const color = getRandomColor();
            newStyle.width = 2;
            newStyle.followSurface = true;
            newStyle.material = colorWithAlpha(color, 0.9);
        }
        entity.polyline.width = style.width;
        entity.polyline.followSurface = style.followSurface;
        entity.polyline.material = style.material;
    }
    // TODO (nf,mz): handle billboard, label, point, etc here...

}

const createResourceGeoJSONDataSource = memoize((url: string, resId: number) => {
    const customDataSource: Cesium.DataSource = new Cesium.CustomDataSource("Cate Resource #" + resId);
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

        // Style for points symbolizing a more complex geometry
        const pixelSizeMin = 10;
        const pixelSizeMax = 100;
        const areaMin = 20.;
        const areaMax = 500.;
        const defaultRatio = 0.2;
        const pointColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.9);
        const pointOutlineColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.5);

        let entityStyles = getEntityStyleMap(resId);

        Cesium.GeoJsonDataSource.load({type: 'FeatureCollection', features: features})
            .then((geoJsonDataSource: Cesium.GeoJsonDataSource) => {

                const featureMap = new Map();
                features.forEach(f => featureMap.set(f.id, f));

                // Style for points symbolizing a more complex geometry
                const scaleByDistance = new Cesium.NearFarScalar(2e2, 1.0, 1.0e7, 0.01);
                const translucencyByDistance = new Cesium.NearFarScalar(2e2, 1.0, 1.0e7, 0.5);

                customDataSource.entities.suspendEvents();

                for (let entity of geoJsonDataSource.entities.values) {
                    // console.log("entity: ", entity);
                    // TODO #477 (nf/mz): Use of the following featureMap is probably wrong
                    // as there is no unconditional 1:1 mapping between GeoJSON features and generated entities.
                    const feature = featureMap.get(entity.id);
                    // console.log("feature: ", feature);
                    if (feature
                        && isNumber(feature._simp)
                        && isNumber(feature._resId)
                        && !!(entity.point || entity.billboard || entity.label)) {

                        // TODO #477 (nf/mz): Generalize this code. This is for Glaciers CCI.
                        // See #491: use a special style for feature geometries that are expandable/collapsible.
                        let ratio = defaultRatio;

                        if (feature.properties) {
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
                        }

                        const pixelSize = pixelSizeMin + ratio * (pixelSizeMax - pixelSizeMin);

                        // TODO #477 (mz): marco, please review following comments.

                        // Note that Cesium refers to the
                        // following as an entity "template" which is very distinct from the actual entity created.
                        // The latter is composed of Cesium.Property objects and
                        // ES6 Properties (getter/setter functions).
                        //
                        entity = {
                            id: entity.id,
                            // When setting "name" in Cesium 1.41,
                            // I get Cesium.DeveloperError("name is a reserved property name.")
                            //name: entity.name,
                            position: entity.position,
                            description: entity.description,
                            properties: entity.properties,
                            // Cesium will turn _simp and _resId into ES6 Property instances (get/set).
                            _simp: feature._simp,
                            _resId: feature._resId,
                            point: {
                                // Style for points symbolizing a more complex geometry
                                color: pointColor,
                                outlineColor: pointOutlineColor,
                                outlineWidth: 10,
                                // pixelSize will multiply by the scale factor, so in this
                                // example the size will range from pixelSize (near) to 0.1*pixelSize (far).
                                pixelSize,
                                scaleByDistance,
                                translucencyByDistance,
                            }
                        };
                    } else {
                        styleEntity(entity, entityStyles);
                    }

                    try {
                        entity = customDataSource.entities.add(entity);
                        // console.log("added entity: ", entity);
                    } catch (e) {
                        console.error("failed to add entity: ", entity, e);
                    }

                    // TODO #477 (mz): marco, FYI, we now set _simp and _resId in the back-end!
                    // customDataSource.entities.add(
                    //     {
                    //         ...entity,
                    //         _simp: isGeometrySimplified,
                    //         _resId: resId
                    //     });
                }

                geoJsonDataSource.entities.removeAll();
                customDataSource.entities.resumeEvents();
                console.log(`Added another ${features.length} feature(s) to Cesium custom data source`);
            });
    };
    return customDataSource;
});

const entityGeometryPropertyNames = ["billboard", "label", "point", "corridor", "polyline", "polygon"];

export function reloadEntityWithOriginalGeometry(oldEntity: Cesium.Entity, featureUrl: string) {
    // TODO #477 (nf/mz): We don't correctly handle multi-geometries here.
    Cesium.GeoJsonDataSource.load(featureUrl)
        .then((geoJsonDataSource: Cesium.GeoJsonDataSource) => {
            const entities = geoJsonDataSource.entities.values;
            if (entities && entities.length) {
                const entity = entities[0];
                transferEntityGeometry(entity, oldEntity);
                if (isNumber(oldEntity._resId)) {
                    styleEntity(oldEntity, getEntityStyleMap(oldEntity._resId));
                }
            }
        });
}

export function transferEntityGeometry(fromEntity: Cesium.Entity, toEntity: Cesium.Entity): void {
    const newGeomPropertyName = entityGeometryPropertyNames.find(name => Cesium.defined(fromEntity[name]));
    const oldGeomPropertyName = entityGeometryPropertyNames.find(name => Cesium.defined(toEntity[name]));
    if (oldGeomPropertyName && newGeomPropertyName && oldGeomPropertyName !== newGeomPropertyName) {
        toEntity[oldGeomPropertyName] = undefined;
    }
    if (newGeomPropertyName) {
        toEntity[newGeomPropertyName] = fromEntity[newGeomPropertyName];
        if (isNumber(toEntity._simp)) {
            // clear geometry simplification flag
            toEntity._simp &= ~0x01;
        }
    }
}

