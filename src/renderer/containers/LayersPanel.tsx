import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {ExpansionPanel} from '../components/ExpansionPanel';
import {
    State, LayerState, ColorMapCategoryState, ImageLayerState,
    VariableImageLayerState, VariableState, ResourceState, ColorMapState
} from "../state";
import {
    Button, Slider, Popover, Position, PopoverInteractionKind, Switch,
    RangeSlider, NumberRange, Tooltip
} from "@blueprintjs/core";
import FormEvent = React.FormEvent;
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {NumericRangeField} from "../components/NumericRangeField";

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
    colorMapCategories: Array<ColorMapCategoryState>;
    selectedColorMap: ColorMapState|null;
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
        colorMapCategories: selectors.colorMapCategoriesSelector(state),
        selectedColorMap: selectors.selectedColorMapSelector(state)
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class LayersPanel extends React.Component<ILayersPanelProps & ILayersPanelDispatch, any> {

    componentDidMount() {
        if (!this.props.colorMapCategories) {
            this.props.dispatch(actions.loadColorMaps());
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlState('showLayerDetails', value));
    }

    //noinspection JSMethodCanBeStatic
    private handleAddLayerButtonClicked() {
        console.log('LayersPanel: add layer (TODO!)');
    }

    //noinspection JSMethodCanBeStatic
    private handleRemoveLayerButtonClicked() {
        console.log('LayersPanel: remove layer (TODO!)');
    }

    //noinspection JSMethodCanBeStatic
    private handleMoveLayerUpButtonClicked() {
        console.log('LayersPanel: move layer up (TODO!)');
    }

    //noinspection JSMethodCanBeStatic
    private handleMoveLayerDownButtonClicked() {
        console.log('LayersPanel: move layer down (TODO!)');
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
                        onClick={this.handleMoveLayerUpButtonClicked.bind(this)}
                        iconName="arrow-up"/>
                <Button disabled={!selectedLayer}
                        onClick={this.handleMoveLayerDownButtonClicked.bind(this)}
                        iconName="arrow-down"/>
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
                         onSelection={(newSelection) => handleChangedLayerSelection(this.props.dispatch, newSelection.length ? newSelection[0] as string : null)}/>
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
            <table cellPadding={4}>
                <tbody>
                {this.renderFormDisplayMinMax()}
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

        let colorBarButton = null;
        if (this.props.colorMapCategories) {
            const popoverContent = this.renderColorBarBox(layer);
            colorBarButton = (
                <Popover content={popoverContent}
                         interactionKind={PopoverInteractionKind.CLICK}
                         popoverClassName="pt-popover-content-sizing cate-color-bars-popover"
                         position={Position.LEFT}>
                    {this.renderColorBarButton(layer, false)}
                </Popover>
            );
        } else {
            colorBarButton = this.renderColorBarButton(layer, true);
        }

        return (
            <tr key="colorMapName">
                <td>Colour bar</td>
                <td style={{width: "100%"}}>{colorBarButton}</td>
            </tr>
        );
    }

    private renderFormDisplayMinMax() {
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
                    return actions.updateLayer(layer, {
                        displayMin: statistics.min,
                        displayMax: statistics.max,
                        statistics
                    });
                }
            ));
        }

        function handleChangedDisplayMinMax(dispatch, displayMin: number, displayMax: number) {
            dispatch(actions.updateLayer(layer, {displayMin, displayMax}));
        }

        let fractionDigits = 2;
        if (layer.statistics) {
            fractionDigits = getDisplayFractionDigits(layer.statistics.min, layer.statistics.max);
        }

        return (
            <tr key="displayMinMax">
                <td>Display range</td>
                <td>
                    <div className="pt-control-group">
                        <NumericRangeField value={[layer.displayMin, layer.displayMax]}
                                           onChange={(value: [number, number]) => handleChangedDisplayMinMax(this.props.dispatch, value[0], value[1])}
                                           exponential={fractionDigits > 3}
                                           fractionDigits={fractionDigits > 3 ? 2 : fractionDigits}
                        />
                        <Tooltip content="Compute valid min/max">
                            <Button className="pt-intent-primary" iconName="arrows-horizontal"
                                    onClick={handleUpdateDisplayStatistics.bind(this)}/>
                        </Tooltip>
                    </div>
                    <div>
                        {this.renderDisplayRangeSlider()}
                    </div>
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
            if (max > 0) {
                const value = layer.varIndex[i];
                dimensionRows.push(
                    <tr key={dimension + "_index"}>
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
                    </tr>
                );
            }
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


    private renderDisplayRangeSlider() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }

        const statistics = layer.statistics;
        if (!statistics) {
            return null;
        }

        function handleChangedDisplayRange(dispatch, displayRange: NumberRange) {
            dispatch(actions.updateLayer(layer, {
                displayMin: displayRange[0],
                displayMax: displayRange[1]
            }));
        }

        let min = statistics.min;
        let max = statistics.max;
        const fractionDigits = getDisplayFractionDigits(min, max);

        return (
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
    }

    private renderColorBarButton(layer: VariableImageLayerState, disabled: boolean) {
        const selectedColorMapName = layer.colorMapName;
        const selectedColorMapImage = this.renderColorMapImage(this.props.selectedColorMap);
        const buttonContent = (selectedColorMapImage || (selectedColorMapName || "Select Color Bar"));
        return (<Button style={{width: "100%"}} disabled={disabled}>{buttonContent}</Button>);
    }

    private renderColorBarBox(layer: VariableImageLayerState) {
        function handleChangedColorMapName(dispatch, colorMapName: string) {
            dispatch(actions.updateLayer(layer, {colorMapName}));
        }

        const children = [];
        for (let cat of this.props.colorMapCategories) {
            const colorMaps = cat.colorMaps;
            children.push(
                <p key={cat.name + "_head"} style={{marginTop: 2, marginBottom: 2}}>
                    <Tooltip content={cat.description}>
                        {cat.name}
                    </Tooltip>
                </p>
            );
            children.push(
                <ListBox key={cat.name + "_list"}
                         numItems={colorMaps.length}
                         getItemKey={(i) => colorMaps[i].name}
                         renderItem={(i) => this.renderColorMapImage(colorMaps[i])}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={layer.colorMapName ? [layer.colorMapName] : []}
                         onSelection={(newSelection) => {
                            if (newSelection.length > 0) {
                                handleChangedColorMapName(this.props.dispatch, newSelection[0] as string);
                            }
                         }}
                />
            );
        }

        return <div style={{padding: 5, overflowY: "auto"}}>{children}</div>;
    }

    //noinspection JSMethodCanBeStatic
    private renderColorMapImage(colorMap: ColorMapState) {
        if (colorMap) {
            return (
                <Tooltip content={colorMap.name}>
                    <img src={`data:image/png;base64,${colorMap.imageData}`}
                         alt={colorMap.name}
                         style={{width:"100%", height: "1em"}}/>
                </Tooltip>
            );
        }
        return null;
    }
}

export default connect(mapStateToProps)(LayersPanel);

