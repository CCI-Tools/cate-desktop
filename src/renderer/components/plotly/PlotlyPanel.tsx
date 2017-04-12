import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent, ExternalObjectRef} from '../ExternalObjectComponent'

type Plot = any;

/**
 * Describes an image layer to be displayed on the OpenLayers map.
 */
export interface PlotState {
    id: string;
    type: "line"|"histogram"|"scatter"|"density";
    title: string;
    data: any;
    layout: any;
}


interface IPlotPanelProps extends IExternalObjectComponentProps<Plot, PlotState>, PlotState {
}

/**
 * A component that wraps a div that holds a plotly plot.
 *
 * @author Norman Fomferra
 */
export class PlotPanel extends ExternalObjectComponent<Plot, PlotState, IPlotPanelProps, null> {

    newExternalObject(): ExternalObjectRef<Plot, PlotState> {
        const container = this.createContainer();

        let plot;
        if (this.props.type === 'line') {
            // TODO
            plot = {};
        }

        return {object: plot, container};
    }

    updateExternalObject(plots: Plot, parentContainer: HTMLElement, prevState: PlotState, nextState: PlotState): void {
        // TODO
    }

    private createContainer(): HTMLDivElement {
        const div = document.createElement("div");
        div.setAttribute("id", "plotly-container-" + this.props.id);
        div.setAttribute("class", "plotly-container");
        return div;
    }
}


