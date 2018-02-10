import {expect} from 'chai';
import {simpleStyleFromFeatureProperties, featurePropertiesFromSimpleStyle} from "./geojson-simple-style";

describe('geojson-simple-style', function () {

    it('simpleStyleFromFeatureProperties', function () {
        expect(simpleStyleFromFeatureProperties({})).to.deep.equal({});
        expect(simpleStyleFromFeatureProperties({
                                                    "title": "Camping Site",
                                                    "marker-symbol": "campsite",
                                                    "marker-size": "large",
                                                    "marker-color": "#00A600",
                                                })).to.deep.equal({
                                                                      title: "Camping Site",
                                                                      markerSymbol: "campsite",
                                                                      markerSize: "large",
                                                                      markerColor: "#00A600",
                                                                  });
    });

    it('featurePropertiesFromSimpleStyle', function () {
        expect(featurePropertiesFromSimpleStyle({})).to.deep.equal({});
        expect(featurePropertiesFromSimpleStyle({
                                                    title: "Bus Stop",
                                                    markerSymbol: "bus",
                                                    markerSize: "large",
                                                    markerColor: "#0000ff",
                                                })).to.deep.equal({
                                                                      "title": "Bus Stop",
                                                                      "marker-symbol": "bus",
                                                                      "marker-size": "large",
                                                                      "marker-color": "#0000ff",
                                                                  });
    });
});
