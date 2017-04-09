import * as React from 'react';
import * as ol from 'openlayers';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../../../common/layer-diff";
import * as assert from "../../../common/assert";

const EMPTY_ARRAY = [];

type PlotlyPanelObject = {
    container: HTMLElement;
}

/**
 * Describes an image layer to be displayed on the OpenLayers map.
 */
export interface ChartState {
    id: string;
    type: "line"|"histogram"|"scatter"|"density";
    title: string;
    data: any;
    layout: any;
}

interface IPlotlyPanelProps extends IPermanentComponentProps {
    charts: ChartState[];
}

interface LastState {
    id: string;
    charts: ChartState[];
}

type LastStateMap = {[id: string]: LastState};

/**
 * A component that wraps a div that holds plotly plots.
 *
 * @author Norman Fomferra
 */
export class PlotlyPanel extends PermanentComponent<PlotlyPanelObject, IPlotlyPanelProps,any> {

    private lastStateMap: LastStateMap;

    constructor(props) {
        super(props);
        this.lastStateMap = {};
    }

    createPermanentObject(): PlotlyPanelObject {
        const container = this.createParentContainer();

        for (let i = 0; i < this.props.charts.length; i++) {
            let chart = this.props.charts[i];
            let childElement = PlotlyPanel.createChildContainer(chart.id);
            container.appendChild(childElement);

            if (chart.type === 'line') {

            }
        }

        return {container};
    }

    componentWillReceiveProps(nextProps: IPlotlyPanelProps) {
        this.saveCurrentState();
        if (this.permanentObject) {
            this.updateChart(nextProps);
        }
    }

    permanentObjectMounted(): void {
        this.updateChart(this.props);
    }

    permanentObjectUnmounted(): void {
        this.saveCurrentState();
    }

    private saveCurrentState() {
        const currentId = this.props.id;
        const currentCharts = this.props.charts || EMPTY_ARRAY;
        this.lastStateMap[currentId] = {id: currentId, charts: currentCharts};
    }

    private updateChart(props: IPlotlyPanelProps) {
        const nextId = props.id;
        const nextCharts = props.charts || EMPTY_ARRAY;

        const lastState = this.lastStateMap[nextId];
        const lastCharts = (lastState && lastState.charts) || EMPTY_ARRAY;

        this.updateMapLayers(lastCharts, nextCharts);
    }

    private updateMapLayers(currentCharts: ChartState[], nextCharts: ChartState[]) {
        if (this.props.debug) {
            console.log('PlotlyPanel: updating layers');
        }
        const actions = getLayerDiff<ChartState>(currentCharts, nextCharts);
        let olLayer: ol.layer.Layer;
        let newChart: ChartState;
        let oldChart: ChartState;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('PlotlyPanel: next layer action', action);
            }
            // olIndex is +1 because of its base layer at olIndex=0
            const olIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    olLayer = this.addChart(action.newLayer, olIndex);
                    assert.ok(olLayer);
                    PlotlyPanel.setChartProps(olLayer, action.newLayer);
                    break;
                case 'REMOVE':
                    this.removeChart(olIndex);
                    break;
                case 'UPDATE':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Tile;
                    assert.ok(olLayer);
                    oldChart = action.oldLayer;
                    newChart = action.newLayer;
                    if (oldChart.layerSourceOptions.url !== newChart.layerSourceOptions.url) {
                        if (oldChart.name === newChart.name && typeof((olLayer.getSource() as any).setUrl) === 'function') {
                            if (this.props.debug) {
                                console.log('OpenLayersMap: reusing layer source');
                            }
                            // Reusable source: See http://openlayers.org/en/latest/examples/reusable-source.html?q=url
                            (olLayer.getSource() as ol.source.UrlTile).setUrl(newChart.layerSourceOptions.url);
                        } else {
                            if (this.props.debug) {
                                console.log('OpenLayersMap: exchanging layer');
                            }
                            // Replace layer
                            this.removeChart(olIndex);
                            olLayer = this.addChart(newChart, olIndex);
                        }
                    }
                    OpenLayersMap.setLayerProps(olLayer, action.newLayer, action.oldLayer);
                    break;
                case 'MOVE_DOWN':
                    olLayer = this.map.getLayers().item(olIndex) as ol.layer.Layer;
                    assert.ok(olLayer);
                    this.map.getLayers().removeAt(olIndex);
                    this.map.getLayers().insertAt(olIndex - action.numSteps, olLayer);
                    break;
                default:
                    console.error(`OpenLayersMap: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private addChart(layerDescriptor: ChartState, layerIndex: number): ol.layer.Layer {
        const olLayer = layerDescriptor.layerFactory(layerDescriptor.layerSourceOptions);
        this.map.getLayers().insertAt(layerIndex, olLayer);
        if (this.props.debug) {
            console.log(`OpenLayersMap: added layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return olLayer;
    }

    private removeChart(layerIndex: number): void {
        this.map.getLayers().removeAt(layerIndex);
        if (this.props.debug) {
            console.log(`OpenLayersMap: removed layer #${layerIndex}`);
        }
    }

    private static setChartProps(olLayer: ol.layer.Layer, newLayer: ChartState, oldLayer?: ChartState) {
        if (!oldLayer || oldLayer.visible !== newLayer.visible) {
            olLayer.setVisible(newLayer.visible);
        }
        if (!oldLayer || oldLayer.opacity !== newLayer.opacity) {
            olLayer.setOpacity(newLayer.opacity);
        }
    }

    private createParentContainer(): HTMLDivElement {
        const div = document.createElement("div");
        div.setAttribute("id", "PlotlyPanel-parent-container-" + this.props.id);
        div.setAttribute("class", "PlotlyPanel-parent-container");
        return div;
    }

    private static createChildContainer(chartId): HTMLDivElement {
        const div = document.createElement("div");
        div.setAttribute("id", chartId);
        div.setAttribute("class", "PlotlyPanel-child-container");
        return div;
    }

}


