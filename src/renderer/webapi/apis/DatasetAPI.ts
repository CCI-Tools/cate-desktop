import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";
import {DataStoreState, DataSourceState} from "../../state";


function responseToTemporalCoverage(temporalCoverageResponse: any): [string, string]|null {
    if (!temporalCoverageResponse) {
        return null;
    }
    return [temporalCoverageResponse.temporal_coverage_start, temporalCoverageResponse.temporal_coverage_end];
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
                        onProgress: (progress: JobProgress) => void): JobPromise<[string, string]|null> {
        return this.webAPIClient.call('get_ds_temporal_coverage',
            [dataStoreId, dataSourceId],
            onProgress, responseToTemporalCoverage
        );
    }

    makeDataSourceLocal(dataSourceId: string, localName: string, args: any,
                        onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('make_ds_local', [dataSourceId, localName, args], onProgress);
    }

    addLocalDataSource(dataSourceId: string, filePathPattern: string,
                       onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('add_local_datasource', [dataSourceId, filePathPattern], onProgress);
    }

    removeLocalDataSource(dataSourceId: string, removeFiles: boolean): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('remove_local_datasource', [dataSourceId, removeFiles]);
    }
}
