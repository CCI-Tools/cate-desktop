import {
    VariableImageLayerState,
    VectorLayerState, ResourceState,
    ResourceVectorLayerState, LayerState, PlacemarkCollection
} from "../state";
import {
    ImageLayerDescriptor, VectorLayerDescriptor, LayerDescriptors,
} from "../components/cesium/CesiumGlobe";
import {
    findVariable, findResource, getTileUrl, getFeatureCollectionUrl, getGeoJSONCountriesUrl,
    SELECTED_VARIABLE_LAYER_ID, COUNTRIES_LAYER_ID, PLACEMARKS_LAYER_ID,
} from "../state-util";
import {memoize} from '../../common/memoize';
import {EMPTY_OBJECT} from "../selectors";
import * as Cesium from "cesium";
import {isNumber} from "../../common/types";
import {SimpleStyle} from "../../common/geojson-simple-style";
import {simpleStyleToCesium} from "../components/cesium/cesium-util";

export function convertLayersToLayerDescriptors(layers: LayerState[],
                                                resources: ResourceState[],
                                                placemarkCollection: PlacemarkCollection,
                                                baseUrl: string,
                                                baseDir: string): LayerDescriptors {
    if (!layers || !layers.length) {
        return EMPTY_OBJECT;
    }
    let imageLayerDescriptors: ImageLayerDescriptor[];
    let vectorLayerDescriptors: VectorLayerDescriptor[];
    for (let layer of layers) {
        let imageLayerDescriptor: ImageLayerDescriptor;
        let vectorLayerDescriptor: VectorLayerDescriptor;
        switch (layer.type) {
            case 'VariableImage': {
                imageLayerDescriptor = convertVariableImageLayerToDescriptor(layer as VariableImageLayerState,
                                                                             baseUrl, baseDir, resources);
                break;
            }
            case 'ResourceVector': {
                vectorLayerDescriptor = convertResourceVectorLayerToDescriptor(layer as ResourceVectorLayerState,
                                                                               baseUrl, baseDir, resources);
                break;
            }
            case 'Vector': {
                vectorLayerDescriptor = convertVectorLayerToDescriptor(layer as VectorLayerState,
                                                                       baseUrl, placemarkCollection);
                break;
            }
        }
        if (imageLayerDescriptor) {
            if (!imageLayerDescriptors) {
                imageLayerDescriptors = [imageLayerDescriptor];
            } else {
                // noinspection JSUnusedAssignment
                imageLayerDescriptors.push(imageLayerDescriptor);
            }
        } else if (vectorLayerDescriptor) {
            if (!vectorLayerDescriptors) {
                vectorLayerDescriptors = [vectorLayerDescriptor];
            } else {
                // noinspection JSUnusedAssignment
                vectorLayerDescriptors.push(vectorLayerDescriptor);
            }
        } else if (layer.id !== SELECTED_VARIABLE_LAYER_ID) {
            console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
        }
    }

    return {imageLayerDescriptors, vectorLayerDescriptors};
}


function convertVariableImageLayerToDescriptor(layer: VariableImageLayerState,
                                               baseUrl: string,
                                               baseDir: string,
                                               resources: ResourceState[]): ImageLayerDescriptor | null {
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

function convertResourceVectorLayerToDescriptor(layer: ResourceVectorLayerState,
                                                baseUrl: string,
                                                baseDir: string,
                                                resources: ResourceState[]): VectorLayerDescriptor | null {
    const resource = findResource(resources, layer);
    if (!resource) {
        console.warn(`globe-view-layers: resource "${layer.resId}" not found"`);
        return null;
    }
    return {
        ...layer,
        dataSource: createResourceGeoJSONDataSource,
        dataSourceOptions: {
            data: getFeatureCollectionUrl(baseUrl, baseDir, layer),
            resId: resource.id,
            style: layer.style,
        },
    } as VectorLayerDescriptor;
}

function convertVectorLayerToDescriptor(layer: VectorLayerState,
                                        baseUrl: string,
                                        placemarkCollection: PlacemarkCollection): VectorLayerDescriptor {
    let data = layer.data;
    let style = layer.style;
    if (layer.id === COUNTRIES_LAYER_ID) {
        data = getGeoJSONCountriesUrl(baseUrl);
    } else if (layer.id === PLACEMARKS_LAYER_ID) {
        data = placemarkCollection;
    }
    return {
        ...layer,
        dataSource: createGeoJsonDataSource,
        dataSourceOptions: {data, style},
    } as VectorLayerDescriptor;
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
    const style = simpleStyleToCesium(dataSourceOptions.style || EMPTY_OBJECT);
    return Cesium.GeoJsonDataSource.load(dataSourceOptions.data, style);
}

/**
 * Creates a Cesium.GeoJsonDataSource instance that loads GeoJSON features from Cate WebAPI REST call.
 *
 * @param viewer the Cesium viewer
 * @param dataSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
 */
function createResourceGeoJSONDataSource(viewer: Cesium.Viewer, dataSourceOptions) {
    return createResourceGeoJSONDataSourceImpl(dataSourceOptions.data, dataSourceOptions.resId, dataSourceOptions.style);
}

type ResourceGeoJSONDataSourceFactory = (url: string, resId: number, style: SimpleStyle) => Cesium.DataSource;

const createResourceGeoJSONDataSourceImpl: ResourceGeoJSONDataSourceFactory =
    memoize((url: string, resId: number, style: SimpleStyle) => {
        const customDataSource: Cesium.DataSource = new Cesium.CustomDataSource("Cate Resource #" + resId);
        const cStyle = simpleStyleToCesium(style);
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
            const pointColor = Cesium.Color.fromAlpha(cStyle.fill, 0.9);
            const pointOutlineColor = Cesium.Color.fromAlpha(cStyle.fill, 0.5);
            const featureCollection = {
                type: 'FeatureCollection',
                features: features
            };
            Cesium.GeoJsonDataSource.load(featureCollection, cStyle)
                  .then((geoJsonDataSource: Cesium.GeoJsonDataSource) => {

                      const featureMap = new Map();
                      features.forEach(f => featureMap.set(f.id, f));

                      // Style for points symbolizing a more complex geometry
                      const scaleByDistance = new Cesium.NearFarScalar(2e2, 1.0, 1.0e7, 0.01);
                      const translucencyByDistance = new Cesium.NearFarScalar(2e2, 1.0, 1.0e7, 0.5);

                      customDataSource.entities.suspendEvents();

                      for (let entity of geoJsonDataSource.entities.values) {
                          // console.log("entity: ", entity);
                          // TODO #477 (nf): Use of the following featureMap is probably wrong
                          // as there is no unconditional 1:1 mapping between GeoJSON features and generated entities.
                          const feature = featureMap.get(entity.id);
                          // console.log("feature: ", feature);
                          if (feature
                              && isNumber(feature._simp)
                              && isNumber(feature._resId)
                              && !!(entity.point || entity.billboard || entity.label)) {

                              // TODO #477 (nf): Generalize this code. This is for Glaciers CCI.
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

                              entity = {
                                  id: entity.id,
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
                          }

                          try {
                              entity = customDataSource.entities.add(entity);
                              // console.log("added entity: ", entity);
                          } catch (e) {
                              console.error("failed to add entity: ", entity, e);
                          }
                      }

                      geoJsonDataSource.entities.removeAll();
                      customDataSource.entities.resumeEvents();
                      console.log(`Added another ${features.length} feature(s) to Cesium custom data source`);
                  });
        };
        return customDataSource;
    });

const entityGeometryPropertyNames = ["billboard", "label", "point", "corridor", "polyline", "polygon"];

export function reloadEntityWithOriginalGeometry(oldEntity: Cesium.Entity, featureUrl: string, style: SimpleStyle) {
    // TODO #477 (nf): We don't correctly handle multi-geometries here.
    const cStyle = simpleStyleToCesium(style);
    Cesium.GeoJsonDataSource.load(featureUrl, cStyle)
          .then((geoJsonDataSource: Cesium.GeoJsonDataSource) => {
              const entities = geoJsonDataSource.entities.values;
              if (entities && entities.length) {
                  const entity = entities[0];
                  transferEntityGeometry(entity, oldEntity);
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

export function getEntityByEntityId(viewer: Cesium.Viewer, entityId: string | number): Cesium.Entity | null {
    for (let i = 0; i < viewer.dataSources.length; i++) {
        const dataSource = viewer.dataSources.get(i);
        const entity = dataSource.entities.getById(entityId);
        if (entity) {
            return entity;
        }
    }
    return null;
}
