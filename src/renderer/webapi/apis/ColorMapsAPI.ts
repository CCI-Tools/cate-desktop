import {WebAPIClient} from "../WebAPIClient";
import {JobPromise} from "../Job";
import {ColorMapCategoryState} from "../../state";


function responseToColorMaps(colorMapsResponse: Array<Array<any>>): Array<ColorMapCategoryState> {
    if (!colorMapsResponse) {
        return null;
    }
    return colorMapsResponse.map((v1: Array<any>) => {
        return {
            name: v1[0],
            description: v1[1],
            colorMaps: v1[2].map((v2) => {
                return {
                    name: v2[0],
                    imageData: v2[1]
                };
            })
        };
    });
}

export class ColorMapsAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getColorMaps(): JobPromise {
        return this.webAPIClient.call('get_color_maps', [], null, responseToColorMaps);
    }
}
