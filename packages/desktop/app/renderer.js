if (process.env.NODE_ENV === 'development') {
    CESIUM_BASE_URL = './node_modules/cesium/Build/Cesium';
} else {
    CESIUM_BASE_URL = './cesium';
}
console.log('CESIUM_BASE_URL =', CESIUM_BASE_URL);
require('./renderer/main.js').main();
