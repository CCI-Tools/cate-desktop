import {WebAPIClient} from "../WebAPIClient";
import {JobPromise, JobProgress} from "../Job";
import {DataStoreState, DataSourceState} from "../../state";


function responseToTemporalCoverage(response: any): [string, string]|null {
    if (response && response.temporal_coverage_start && response.temporal_coverage_end) {
        return [response.temporal_coverage_start, response.temporal_coverage_end];
    }
    return null;
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

    getDataSourceTemporalCoverage(dataStoreId: string, dataSourceId: string,
                                  onProgress: (progress: JobProgress) => void): JobPromise<[string, string]|null> {
        return this.webAPIClient.call('get_data_source_temporal_coverage',
            [dataStoreId, dataSourceId],
            onProgress, responseToTemporalCoverage
        );
    }

    addLocalDataSource(dataSourceId: string, filePathPattern: string,
                       onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('add_local_data_source',
                                      [dataSourceId, filePathPattern],
                                      onProgress);
    }

    removeLocalDataSource(dataSourceId: string, removeFiles: boolean,
                          onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('remove_local_data_source',
                                      [dataSourceId, removeFiles],
                                      onProgress);
    }
}
