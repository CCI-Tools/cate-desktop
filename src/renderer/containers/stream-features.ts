importScripts('../../node_modules/oboe/dist/oboe-browser.js');
const oboe = (self as any).oboe;

onmessage = function (event: MessageEvent) {
    // console.log('Message received from main script:', event);
    streamFeatures(event.data);
};

function sendData(data) {
    (postMessage as any)(data);
}

function streamFeatures(url) {
    const featurePackCount = 10;
    let features = [];

    oboe(url)
        .node('features.*', function (feature) {
            if (features.length === featurePackCount) {
                sendData(features);
                features = [];
            }
            features.push(feature);
            // returning oboe.drop means to oboe, it should forget the feature and thus save memory.
            return oboe.drop;
        })
        .done(function (featureCollection) {
            if (features.length) {
                sendData(features);
            }
        });
}