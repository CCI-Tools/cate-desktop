import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent, ExternalObjectRef} from '../ExternalObjectComponent'
import * as Plotly from "plotly.js";

type Plot = any;

/**
 * Describes an image layer to be displayed on the OpenLayers map.
 */
export interface PlotState {
    id: string;
    type: "line"|"histogram"|"scatter"|"density";
    title?: string;
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
        console.log('Plotly', Plotly);

        const container = this.createContainer();

        let plot;
        if (this.props.type === 'scatter') {
            Plotly.d3.csv('https://raw.githubusercontent.com/plotly/datasets/master/wind_speed_laurel_nebraska.csv', function (rows) {
                const trace = {
                    type: 'scatter',                    // set the chart type
                    mode: 'lines',                      // connect points with lines
                    x: rows.map(function (row) {          // set the x-data
                        return row['Time'];
                    }),
                    y: rows.map(function (row) {          // set the x-data
                        return row['10 Min Sampled Avg'];
                    }),
                    line: {                             // set the width of the line.
                        width: 1
                    },
                    error_y: {
                        array: rows.map(function (row) {    // set the height of the error bars
                            return row['10 Min Std Dev'];
                        }),
                        thickness: 0.5,                   // set the thickness of the error bars
                        width: 0
                    }
                };

                const layout = {
                    yaxis: {title: "Wind Speed"},       // set the y axis title
                    xaxis: {
                        showgrid: false,                  // remove the x-axis grid lines
                        tickformat: "%B, %Y"              // customize the date format to "month, day"
                    },
                    margin: {                           // update the left, bottom, right, top margin
                        l: 40, b: 10, r: 10, t: 20
                    }
                };

                Plotly.newPlot(this.getContainerId(), [trace as any], layout, {showLink: false});
            });


            // TODO
            plot = {};
        } else if (this.props.type === 'line') {
            Plotly.newPlot(
                this.getContainerId(),
                [{
                    x: [1, 2, 3, 4, 5],
                    y: [1, 2, 4, 8, 16]
                }],
                {
                    margin: {t: 0}
                }
            );
        }
        return {object: plot, container};
    }

    updateExternalObject(plots: Plot, parentContainer: HTMLElement, prevState: PlotState, nextState: PlotState): void {
        // TODO
    }

    private createContainer(): HTMLDivElement {
        const div = document.createElement("div");
        div.setAttribute("id", this.getContainerId());
        div.setAttribute("class", "plotly-container");
        div.setAttribute("style", "height:16em;");
        return div;
    }

    private getContainerId() {
        return "plotly-container-" + this.props.id;
    }
}


