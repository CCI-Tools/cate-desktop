export const OBJECT_TYPE = 'object';
export const BOOL_TYPE = 'bool';
export const INT_TYPE = 'int';
export const FLOAT_TYPE = 'float';
export const STR_TYPE = 'str';

export const ND_ARRAY_TYPE = 'numpy.ndarray';

export const DATASET_TYPE = 'xarray.core.dataset.Dataset';
export const DATA_ARRAY_TYPE = 'xarray.core.dataarray.DataArray';
export const DATA_FRAME_TYPE = 'pandas.core.frame.DataFrame';
export const GEO_DATA_FRAME_TYPE = 'geopandas.geodataframe.GeoDataFrame';
export const GEO_SERIES_TYPE = 'geopandas.geoseries.GeoSeries';
export const SERIES_TYPE = 'pandas.core.series.Series';

export const DATASET_LIKE_TYPE = 'cate.core.types.DatasetLike';
export const DATA_FRAME_LIKE_TYPE = 'cate.core.types.DataFrameLike';
export const POINT_LIKE_TYPE = 'cate.core.types.PointLike';
export const POLYGON_LIKE_TYPE = 'cate.core.types.PolygonLike';
export const GEOMETRY_LIKE_TYPE = 'cate.core.types.GeometryLike';
export const GEO_DATA_FRAME_PROXY_TYPE = 'cate.core.types.GeoDataFrame';
export const TIME_LIKE_TYPE = 'cate.core.types.TimeLike';
export const TIME_RANGE_LIKE_TYPE = 'cate.core.types.TimeRangeLike';
export const VAR_NAME_LIKE_TYPE = 'cate.core.types.VarName';
export const VAR_NAMES_LIKE_TYPE = 'cate.core.types.VarNamesLike';
export const DIM_NAME_LIKE_TYPE = 'cate.core.types.DimName';
export const DIM_NAMES_LIKE_TYPE = 'cate.core.types.DimNamesLike';
export const DICT_LIKE_TYPE = 'cate.core.types.DictLike';
export const FILE_LIKE_TYPE = 'cate.core.types.FileLike';
export const ARBITRARY_TYPE = 'cate.core.types.Arbitrary';
export const LITERAL_TYPE = 'cate.core.types.Literal';

export const GEOMETRY_TYPE = 'shapely.geometry.base.BaseGeometry';
export const POINT_TYPE = 'shapely.geometry.point.Point';
export const MULTI_POINT_TYPE = 'shapely.geometry.multipoint.MultiPoint';
export const LINE_STRING_TYPE = 'shapely.geometry.linestring.LineString';
export const MULTI_LINE_STRING_TYPE = 'shapely.geometry.multilinestring.MultiLineString';
export const POLYGON_TYPE = 'shapely.geometry.polygon.Polygon';
export const MULTI_POLYGON_TYPE = 'shapely.geometry.multipolygon.multiPolygon';
export const GEOMETRY_COLLECTION_TYPE = 'shapely.geometry.collection.GeometryCollection';



/**
 * Naive test if a targetDataType is assignable from a given sourceDataType.
 *
 * @param targetDataType The name of the target data type used in Cate's Python API
 * @param sourceDataType The name of the source data type used in Cate's Python API
 * @returns {boolean} true, if so.
 */
export function isAssignableFrom(targetDataType: string, sourceDataType: string) {
    if (!targetDataType || !sourceDataType) {
        return false;
    }
    if (targetDataType === sourceDataType) {
        return true;
    }
    switch (targetDataType) {
        case OBJECT_TYPE:
        case ARBITRARY_TYPE:
            return true;
        case LITERAL_TYPE:
            return sourceDataType === STR_TYPE;
        case BOOL_TYPE:
            return sourceDataType !== ND_ARRAY_TYPE; // Non-empty numpy arrays don't work as booleans
        case INT_TYPE:
            return sourceDataType === BOOL_TYPE;
        case FLOAT_TYPE:
            return sourceDataType === BOOL_TYPE || sourceDataType === INT_TYPE;
        case ND_ARRAY_TYPE:
            return sourceDataType === DATA_ARRAY_TYPE;
        case DATA_FRAME_TYPE:
            return sourceDataType === DATA_FRAME_LIKE_TYPE || sourceDataType === GEO_DATA_FRAME_TYPE
                || sourceDataType === GEO_DATA_FRAME_PROXY_TYPE;
        case DATA_FRAME_LIKE_TYPE:
            return sourceDataType === DATA_FRAME_TYPE || sourceDataType === GEO_DATA_FRAME_TYPE
                || sourceDataType === GEO_DATA_FRAME_PROXY_TYPE;
        case GEO_DATA_FRAME_TYPE:
            return sourceDataType === GEO_DATA_FRAME_PROXY_TYPE;
        case DATASET_TYPE:
            return sourceDataType === DATASET_LIKE_TYPE;
        case DATASET_LIKE_TYPE:
            return sourceDataType === DATASET_TYPE || sourceDataType === DATA_FRAME_TYPE;
        case SERIES_TYPE:
            return sourceDataType === GEO_SERIES_TYPE;
        case VAR_NAME_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case VAR_NAMES_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case DIM_NAME_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case DIM_NAMES_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case DICT_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case FILE_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case TIME_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case TIME_RANGE_LIKE_TYPE:
            return sourceDataType === STR_TYPE;
        case POINT_LIKE_TYPE:
            return sourceDataType === STR_TYPE || sourceDataType === POINT_TYPE;
        case POLYGON_LIKE_TYPE:
            return sourceDataType === STR_TYPE || sourceDataType === POLYGON_TYPE;
        case GEOMETRY_LIKE_TYPE:
            return sourceDataType === STR_TYPE
                || sourceDataType === POINT_LIKE_TYPE
                || sourceDataType === POLYGON_LIKE_TYPE
                || sourceDataType === GEOMETRY_TYPE
                || sourceDataType === POINT_TYPE
                || sourceDataType === MULTI_POINT_TYPE
                || sourceDataType === LINE_STRING_TYPE
                || sourceDataType === MULTI_LINE_STRING_TYPE
                || sourceDataType === POLYGON_TYPE
                || sourceDataType === MULTI_POLYGON_TYPE
                || sourceDataType === GEOMETRY_COLLECTION_TYPE;
    }
    return false;
}


