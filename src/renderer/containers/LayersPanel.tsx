import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {ExpansionPanel} from '../components/ExpansionPanel';
import {
    State, LayerState, ColorMapCategoryState, ImageLayerState,
    VariableImageLayerState, VariableState, ResourceState
} from "../state";
import {
    Button, Checkbox, Slider, Popover, Position, PopoverInteractionKind, Switch,
    RangeSlider, NumberRange, Tooltip
} from "@blueprintjs/core";
import FormEvent = React.FormEvent;
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";

function getDisplayFractionDigits(min: number, max: number) {
    const n = Math.round(Math.log10(max - min));
    if (n < 0) {
        return 1 - n;
    } else if (n <= 2) {
        return 2;
    } else if (n <= 3) {
        return 1;
    } else {
        return 0;
    }
}

function formatNumber(x: number, fractionDigits: number) {
    return fractionDigits < 3 ? x.toFixed(fractionDigits) : x.toExponential(1);
}

interface ILayersPanelDispatch {
    dispatch: Dispatch<State>;
}

interface ILayersPanelProps {
    selectedResource: ResourceState|null;
    selectedVariable: VariableState|null,
    layers: Array<LayerState>;
    selectedLayer: LayerState|null;
    selectedImageLayer: ImageLayerState|null;
    selectedVariableImageLayer: VariableImageLayerState|null;
    showLayerDetails: boolean;
    colorMaps: Array<ColorMapCategoryState>;
}

function mapStateToProps(state: State): ILayersPanelProps {
    return {
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        layers: selectors.layersSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedImageLayer: selectors.selectedImageLayerSelector(state),
        selectedVariableImageLayer: selectors.selectedVariableImageLayerSelector(state),
        showLayerDetails: state.control.showLayerDetails,
        colorMaps: state.data.colorMaps,
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class LayersPanel extends React.Component<ILayersPanelProps & ILayersPanelDispatch, any> {

    componentDidMount() {
        if (!this.props.colorMaps) {
            this.props.dispatch(actions.loadColorMaps());
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlState('showLayerDetails', value));
    }

    //noinspection JSMethodCanBeStatic
    private handleAddLayerButtonClicked() {
        // TODO
        console.log('handleAddLayerButtonClicked');
    }

    //noinspection JSMethodCanBeStatic
    private handleRemoveLayerButtonClicked() {
        // TODO
        console.log('handleAddLayerButtonClicked');
    }

    render() {
        return (
            <ExpansionPanel icon="pt-icon-layers" text="Layers" isExpanded={true} defaultHeight={300}>
                <ContentWithDetailsPanel showDetails={this.props.showLayerDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged.bind(this)}
                                         isSplitPanel={true}
                                         initialContentHeight={200}
                                         actionComponent={this.renderActionButtonRow()}>
                    {this.renderLayersList()}
                    {this.renderLayerDetailsCard()}
                </ContentWithDetailsPanel>
            </ExpansionPanel>
        );
    }

    private renderActionButtonRow() {
        const selectedLayer = this.props.selectedLayer;
        return (
            <div style={{display: 'inline', padding: '0.2em'}}>
                <Button className="pt-intent-primary"
                        style={{marginRight: '0.1em'}}
                        onClick={this.handleAddLayerButtonClicked.bind(this)}
                        iconName="add"/>
                <Button style={{marginRight: '0.1em'}}
                        disabled={!selectedLayer}
                        onClick={this.handleRemoveLayerButtonClicked.bind(this)}
                        iconName="remove"/>
                <Button style={{marginRight: '0.1em'}}
                        disabled={!selectedLayer}
                        onClick={this.handleRemoveLayerButtonClicked.bind(this)}
                        iconName="arrow-up"/>
                <Button disabled={!selectedLayer}
                        onClick={this.handleRemoveLayerButtonClicked.bind(this)}
                        iconName="pt-icon-arrow-down"/>
            </div>
        );
    }

    private renderLayersList() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return null;
        }

        function handleChangedLayerVisibility(dispatch, layer: LayerState, show: boolean) {
            dispatch(actions.updateLayer(layer, {show}));
        }

        function handleChangedLayerSelection(dispatch, selectedLayerId: string|null) {
            dispatch(actions.setSelectedLayerId(selectedLayerId));
        }

        const renderItem = (itemIndex: number) => {
            const layer = layers[itemIndex];
            return (
                <div>
                    <input type="checkbox"
                           checked={layer.show}
                           onChange={(ev: any) => {
                                    handleChangedLayerVisibility(this.props.dispatch, layer, ev.target.checked);
                                    ev.stopPropagation();
                            }}
                    />
                    <span style={{marginLeft: "0.5em"}} className="pt-icon-layout-grid"/>
                    <span style={{marginLeft: "0.5em"}}>{layer.name}</span>
                </div>
            );
        };

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={layers.length}
                         getItemKey={index => layers[index].id}
                         renderItem={renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedLayer ? [this.props.selectedLayer.id] : []}
                         onSelection={(oldSelection, newSelection) => handleChangedLayerSelection(this.props.dispatch, newSelection.length ? newSelection[0] as string : null)}/>
            </div>
        );
    }

    private renderLayerDetailsCard() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return (
                <Card>
                    <p><strong>No layer added.</strong></p>
                    <p>
                        Press the <span className="pt-icon-add"/> button to add a layer.
                    </p>
                </Card>);
        }

        if (!this.props.selectedLayer) {
            return (
                <Card>
                    <p><strong>No layer selected.</strong></p>
                    <p>
                        Select a layer to browse and edit its details.
                    </p>
                </Card>
            );
        }

        return (
            <table className="pt-condensed pt-bordered">
                <tbody>
                {this.renderFormDisplayMinMax()}
                {this.renderFormDisplayRange()}
                {this.renderFormDisplayColorBar()}
                {this.renderFormAlphaBlending()}
                {this.renderFormVarIndex()}
                {this.renderFormImageEnhancement('alpha', 'Alpha', 0., 1.)}
                {this.renderFormImageEnhancement('brightness', 'Brightness', 0., 2.)}
                {this.renderFormImageEnhancement('contrast', 'Contrast', 0., 2.)}
                {this.renderFormImageEnhancement('hue', 'Hue', 0., 1.)}
                {this.renderFormImageEnhancement('saturation', 'Saturation', 0., 2.)}
                {this.renderFormImageEnhancement('gamma', 'Gamma', 1., 2.)}
                </tbody>
            </table>
        );
    }

    private renderFormDisplayColorBar() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }

        function handleChangedColorMapName(dispatch, colorMapName: string) {
            dispatch(actions.updateLayer(layer, {colorMapName}));
        }

        const selectedColorMapName = layer.colorMapName;

        let comp = null;
        if (this.props.colorMaps) {
            let selectedColorMapImage = null;
            const colorMapNames = [];
            const colorMapImages = [];
            for (let cat of this.props.colorMaps) {
                for (let cm of cat.colorMaps) {
                    const colorMapName = cm.name;
                    const colorMapImage = (
                        <Tooltip content={colorMapName}>
                            <img src={`data:image/png;base64,${cm.imageData}`}
                                 alt={colorMapName}
                                 width="100%"
                                 height="14px"/>
                        </Tooltip>
                    );
                    colorMapNames.push(colorMapName);
                    colorMapImages.push(colorMapImage);
                    if (selectedColorMapName === colorMapName) {
                        selectedColorMapImage = colorMapImage;
                    }
                }
            }

            let popoverContent = <ListBox numItems={colorMapNames.length}
                                          getItemKey={(i) => colorMapNames[i]}
                                          renderItem={(i) => colorMapImages[i]}
                                          selectionMode={ListBoxSelectionMode.SINGLE}
                                          selection={selectedColorMapName ? [selectedColorMapName] : null}
                                          onSelection={(oldSelection, newSelection) => {
                                              if (newSelection.length > 0) {
                                                  handleChangedColorMapName(this.props.dispatch, newSelection[0] as string);
                                              }
                                          }}/>;

            comp = (
                <Popover content={popoverContent}
                         interactionKind={PopoverInteractionKind.CLICK}
                         popoverClassName="pt-popover-content-sizing cate-color-bars-popover"
                         position={Position.LEFT}>
                    <Button>{selectedColorMapImage ? selectedColorMapImage : "Select Color Bar"}</Button>
                </Popover>
            );
        } else {
            comp = <p>{selectedColorMapName ? selectedColorMapName : "No color bars available"}</p>;
        }

        return (
            <tr key="colorMapName">
                <td>Color bar</td>
                <td style={{width: "100%"}}>{comp}</td>
            </tr>
        );
    }

    private renderFormDisplayRange() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }

        function handleUpdateDisplayStatistics() {
            const resource = this.props.selectedResource;
            const variable = this.props.selectedVariable;
            const layer = this.props.selectedVariableImageLayer;
            if (!resource || !variable || !layer) {
                return;
            }
            this.props.dispatch(actions.getWorkspaceVariableStatistics(resource.name, variable.name, layer.varIndex,
                (statistics) => {
                    return actions.updateLayer(layer, {statistics})
                }
            ));
        }

        const statistics = layer.statistics;
        let rangeSlider;
        if (statistics) {

            function handleChangedDisplayRange(dispatch, displayRange: NumberRange) {
                dispatch(actions.updateLayer(layer, {
                    displayMin: displayRange[0],
                    displayMax: displayRange[1]
                }));
            }

            let min = statistics.min;
            let max = statistics.max;
            const fractionDigits = getDisplayFractionDigits(min, max);

            rangeSlider = (
                <RangeSlider
                    min={min}
                    max={max}
                    stepSize={(max - min) / 100.}
                    labelStepSize={max - min}
                    renderLabel={(x: number) => formatNumber(x, fractionDigits)}
                    onChange={(displayRange: NumberRange) => handleChangedDisplayRange(this.props.dispatch, displayRange)}
                    value={[layer.displayMin, layer.displayMax]}
                />
            );
        } else {
            rangeSlider = (
                <RangeSlider
                    min={0}
                    max={1}
                    stepSize={0.1}
                    labelStepSize={1}
                    disabled={true}
                />
            );
        }

        return (
            <tr key="displayRange">
                <td/>
                <td>
                    <div>
                        {rangeSlider}
                        <Tooltip content="Compute valid min/max">
                            <Button iconName="arrows-horizontal"
                                    onClick={handleUpdateDisplayStatistics.bind(this)}/>
                        </Tooltip>
                    </div>
                </td>
            </tr>
        );
    }

    private renderFormDisplayMinMax() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }

        function handleChangedDisplayMin(dispatch, displayMinText: string) {
            let displayMin;
            try {
                displayMin = parseFloat(displayMinText);
            } catch (e) {
                // Do not change
                return;
            }
            dispatch(actions.updateLayer(layer, {displayMin}));
        }

        function handleChangedDisplayMax(dispatch, displayMaxText: string) {
            let displayMax;
            try {
                displayMax = parseFloat(displayMaxText);
            } catch (e) {
                // Do not change
                return;
            }
            dispatch(actions.updateLayer(layer, {displayMax}));
        }

        let fractionDigits = 1;
        if (layer.statistics) {
            fractionDigits = getDisplayFractionDigits(layer.statistics.min, layer.statistics.max);
        }

        return (
            <tr key="displayMinMax">
                <td>Value range</td>
                <td>
                    <input className="pt-input" type="text" style={{width: "6em", textAlign: "right"}}
                           value={formatNumber(layer.displayMin, fractionDigits)}
                           onChange={(ev: any) => handleChangedDisplayMin(this.props.dispatch, ev.target.value)}
                           placeholder="From"/>
                    <span style={{width: "0.5em"}}/>
                    <input className="pt-input" type="text" style={{width: "6em", textAlign: "right"}}
                           value={formatNumber(layer.displayMax, fractionDigits)}
                           onChange={(ev: any) => handleChangedDisplayMax(this.props.dispatch, ev.target.value)}
                           placeholder="To"/>
                </td>
            </tr>
        );
    }

    private renderFormAlphaBlending() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }

        function handleChangedDisplayAlphaBlend(dispatch, alphaBlending: boolean) {
            dispatch(actions.updateLayer(layer, {alphaBlending}));
        }

        return (
            <tr key="alphaBlending">
                <td>Alpha blending</td>
                <td>
                    <Switch checked={layer.alphaBlending}
                            onChange={(ev: any) => handleChangedDisplayAlphaBlend(this.props.dispatch, ev.target.checked)}/>
                </td>
            </tr>
        );
    }

    private renderFormVarIndex() {
        const layer = this.props.selectedVariableImageLayer;
        const variable = this.props.selectedVariable;
        if (!layer || !variable || variable.ndim <= 2) {
            return null;
        }

        function handleChangedLayerVarIndex(dispatch, i: number, value: number) {
            const varIndex = layer.varIndex.slice();
            varIndex[i] = value;
            dispatch(actions.updateLayer(layer, {varIndex}));
        }

        const n = variable.ndim - 2;
        const dimensionRows = [];
        for (let i = 0; i < n; i++) {
            const dimension = variable.dimensions[i];
            const max = variable.shape[i] - 1;
            const value = layer.varIndex[i];
            dimensionRows.push(<tr key={dimension + "_index"}>
                <td>{"Index into " + dimension}</td>
                <td>
                    <Slider min={0}
                            max={max}
                            stepSize={1}
                            labelStepSize={max}
                            value={value}
                            onChange={(value: number) => handleChangedLayerVarIndex(this.props.dispatch, i, value)}
                    />
                </td>
            </tr>);
        }
        return dimensionRows;
    }

    private renderFormImageEnhancement(key: string, label: string, min: number, max: number) {
        const layer = this.props.selectedImageLayer;
        if (!layer) {
            return null;
        }

        function handleChangedImageEnhancement(dispatch, name: string, value: number) {
            dispatch(actions.updateLayerImageEnhancement(layer, name, value));
        }

        return (
            <tr key={key}>
                <td>{label}</td>
                <td>
                    <Slider min={min}
                            max={max}
                            stepSize={(max - min) / 10.}
                            labelStepSize={max - min}
                            renderLabel={(x) => formatNumber(x, 1)}
                            value={layer.imageEnhancement[key]}
                            onChange={(value: number) => handleChangedImageEnhancement(this.props.dispatch, key, value)}/>
                </td>
            </tr>
        );
    }

}

export default connect(mapStateToProps)(LayersPanel);
