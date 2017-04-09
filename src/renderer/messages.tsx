import * as React from 'react';
import {NonIdealState} from "@blueprintjs/core";

export const ICON_EMPTY = "pt-icon-circle";

export const CONFIG_ERROR_MESSAGE = (
    <span>This is very likely a configuration error, please check <code>.cate/webapi.log</code> file.</span>
);

export const NO_WORKSPACE = (
    <NonIdealState
        title="No workspace"
        description={<span>Try <strong>File / New</strong> or <strong>File / Open</strong> from the main menu.</span>}
        visual={ICON_EMPTY}/>
);

export const NO_WORKSPACE_RESOURCES = (
    <NonIdealState
        title="No workspace resources"
        visual="pt-icon-database"
        description={<span>Open a dataset in DATA SOURCES panel or apply a <code>read_</code> operation from the OPERATIONS panel.</span>}
    />
);

export const NO_WORKFLOW_STEPS = (
    <NonIdealState
        title="No workflow steps"
        visual="pt-icon-flows"
        description={<span>Open a dataset in DATA SOURCES panel or apply a <code>read_</code> operation from the OPERATIONS panel.</span>}
    />
);

export const NO_DATA_STORES_FOUND = (
    <NonIdealState
        title="No data stores found"
        visual="pt-icon-offline"
        description={CONFIG_ERROR_MESSAGE}/>
);

export const NO_LOCAL_DATA_SOURCES = (
    <NonIdealState
        title="No local data sources"
        visual={ICON_EMPTY}
        description={<span>Add new local data sources using the <code>cate ds add <em>name</em> <em>files...</em></code> command-line</span>}/>
);

export const NO_DATA_SOURCES_FOUND = (
    <NonIdealState
        title="No data sources found"
        visual={ICON_EMPTY}
        description={CONFIG_ERROR_MESSAGE}/>
);

export const NO_OPERATIONS_FOUND = (
    <NonIdealState
        title="No operations found"
        description={CONFIG_ERROR_MESSAGE}
        visual={ICON_EMPTY}/>
);

export const NO_VARIABLES = (
    <NonIdealState
        title="No variables"
        visual={ICON_EMPTY}
        description={`Select a resource in the WORKSPACE panel first.`}/>
);

export const NO_VARIABLES_EMPTY_RESOURCE = (resourceName) => (
    <NonIdealState
        title="No variables"
        visual={ICON_EMPTY}
        description={`Selected resource "${resourceName}" doesn't contain any variables.`}/>
);

export const NO_ACTIVE_VIEW = (
    <NonIdealState
        title="No active view"
        description="Add a new view first."
        visual={ICON_EMPTY}/>
);
export const NO_VIEW_PROPS = (
    <NonIdealState
        title="No view properties"
        description="The type of the active view is not yet supported."
        visual={ICON_EMPTY}/>
);

export const NO_LAYERS_NO_VIEW = (
    <NonIdealState
        title="No layers"
        description="To show layers, activate a world view"
        visual={ICON_EMPTY}/>
);

export const NO_LAYERS_EMPTY_VIEW = (
    <NonIdealState
        title="No layers"
        description={<span>Press the <span className="pt-icon-add"/> button to add a layer.</span>}
        visual={ICON_EMPTY}/>
);

export const NO_LAYER_SELECTED = (
    <NonIdealState
        title="No layer selected"
        description="Select a layer to browse and edit its details."
        visual={ICON_EMPTY}/>
);

export const NO_CHARTS = (
    <NonIdealState
        title="No charts"
        description={<span>Press the <span className="pt-icon-add"/> button to add a new chart.</span>}
        visual={ICON_EMPTY}/>
);
