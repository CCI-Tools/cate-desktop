import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress, JobResponse} from "../Job";
import {NumberRange} from "@blueprintjs/core";

function responseToTemporalCoverage(temporalCoverageResponse: JobResponse): NumberRange {
    if (!temporalCoverageResponse) {
        return null;
    }
    const start = temporalCoverageResponse.temporal_coverage_start;
    const end = temporalCoverageResponse.temporal_coverage_end;
    return [Date.parse(start), Date.parse(end)];
}

export class DatasetAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getDataStores(): JobPromise {
        return this.webAPIClient.call('get_data_stores', []);
    }

    getDataSources(dataStoreId: string, onProgress: (progress: JobProgress) => void): JobPromise {
        return this.webAPIClient.call('get_data_sources', [dataStoreId], onProgress);
    }

    getTemporalCoverage(dataStoreId: string, dataSourceId: string): JobPromise {
        return this.webAPIClient.call('get_ds_temporal_coverage', [dataStoreId, dataSourceId], null, responseToTemporalCoverage);
    }
}
