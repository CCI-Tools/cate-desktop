import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";
import {DataStoreState, DataSourceState} from "../../state";

type NumberRange = [number, number];

function stringToMillis(dateString: string): number {
    if (dateString) {
        const dateInMillis = Date.parse(dateString);
        if (dateInMillis) {
            // can be NaN
            return dateInMillis;
        }
    }
    return null;
}

function responseToTemporalCoverage(temporalCoverageResponse: any): NumberRange {
    if (!temporalCoverageResponse) {
        return null;
    }
    const startDateMillis = stringToMillis(temporalCoverageResponse.temporal_coverage_start);
    const endDateMillis = stringToMillis(temporalCoverageResponse.temporal_coverage_end);
    return [startDateMillis, endDateMillis];
}

export class DatasetAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getDataStores(): JobPromise<DataStoreState[]> {
        return this.webAPIClient.call('get_data_stores', []);
    }

    getDataSources(dataStoreId: string,
                   onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('get_data_sources', [dataStoreId], onProgress);
    }

    getTemporalCoverage(dataStoreId: string, dataSourceId: string,
                        onProgress: (progress: JobProgress) => void): JobPromise<NumberRange> {
        return this.webAPIClient.call('get_ds_temporal_coverage',
            [dataStoreId, dataSourceId],
            onProgress, responseToTemporalCoverage
        );
    }
}
