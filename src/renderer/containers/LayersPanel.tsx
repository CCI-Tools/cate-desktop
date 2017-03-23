import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {ExpansionPanel} from '../components/ExpansionPanel';
import {
    State, LayerState, ColorMapCategoryState, ImageLayerState,
    VariableImageLayerState, VariableState, ResourceState, ColorMapState, VariableVectorLayerState
} from "../state";
import {
    Button, Slider, Popover, Position, PopoverInteractionKind, Switch,
    RangeSlider, NumberRange, Tooltip
} from "@blueprintjs/core";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import {NumericRangeField} from "../components/field/NumericRangeField";
import LayerSourcesDialog from "./LayerSourcesDialog";
import ProjectionsDialog from "./ProjectionsDialog";

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
    selectedLayerId: string|null;
    selectedLayerIndex: number;
    selectedLayer: LayerState|null;
    selectedImageLayer: ImageLayerState|null;
    selectedVariableImageLayer: VariableImageLayerState|null;
    selectedVariableVectorLayer: VariableVectorLayerState|null;
    showLayerDetails: boolean;
    colorMapCategories: Array<ColorMapCategoryState>;
    selectedColorMap: ColorMapState|null;
}

function mapStateToProps(state: State): ILayersPanelProps {
    return {
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        layers: selectors.layersSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedLayerIndex: selectors.selectedLayerIndexSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedImageLayer: selectors.selectedImageLayerSelector(state),
        selectedVariableImageLayer: selectors.selectedVariableImageLayerSelector(state),
        selectedVariableVectorLayer: selectors.selectedVariableVectorLayerSelector(state),
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

    constructor(props: ILayersPanelProps&ILayersPanelDispatch, context: any) {
        super(props, context);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleAddLayerButtonClicked = this.handleAddLayerButtonClicked.bind(this);
        this.handleRemoveLayerButtonClicked = this.handleRemoveLayerButtonClicked.bind(this);
        this.handleMoveLayerUpButtonClicked = this.handleMoveLayerUpButtonClicked.bind(this);
        this.handleMoveLayerDownButtonClicked = this.handleMoveLayerDownButtonClicked.bind(this);
        this.handleProjectionButtonClicked = this.handleProjectionButtonClicked.bind(this);
        this.handleChangedLayerSelection = this.handleChangedLayerSelection.bind(this);
        this.handleChangedLayerVisibility = this.handleChangedLayerVisibility.bind(this);
        this.handleChangedLayerOpacity = this.handleChangedLayerOpacity.bind(this);
        this.handleUpdateDisplayStatistics = this.handleUpdateDisplayStatistics.bind(this);
        this.handleChangedDisplayMinMax = this.handleChangedDisplayMinMax.bind(this);
        this.handleChangedDisplayRange = this.handleChangedDisplayRange.bind(this);
        this.handleChangedDisplayAlphaBlend = this.handleChangedDisplayAlphaBlend.bind(this);
        this.handleChangedColorMapName = this.handleChangedColorMapName.bind(this);
        this.renderLayerItem = this.renderLayerItem.bind(this);
    }

    componentDidMount() {
        if (!this.props.colorMapCategories) {
            this.props.dispatch(actions.loadColorMaps());
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setControlProperty('showLayerDetails', value));
    }

    private handleAddLayerButtonClicked() {
        this.props.dispatch(actions.showDialog('layerSourcesDialog'));
    }

    private handleRemoveLayerButtonClicked() {
        this.props.dispatch(actions.removeLayer(this.props.selectedLayerId));
    }

    private handleMoveLayerUpButtonClicked() {
        this.props.dispatch(actions.moveLayerUp(this.props.selectedLayerId));
    }

    private handleMoveLayerDownButtonClicked() {
        this.props.dispatch(actions.moveLayerDown(this.props.selectedLayerId));
    }

    private handleProjectionButtonClicked() {
        this.props.dispatch(actions.showDialog('projectionsDialog'));
    }

    private handleChangedLayerVisibility(layer: LayerState, visible: boolean) {
        this.props.dispatch(actions.updateLayer(layer, {visible}));
    }

    private handleChangedLayerOpacity(opacity: number) {
        const layer = this.props.selectedLayer;
        this.props.dispatch(actions.updateLayer(layer, {opacity}));
    }

    private handleChangedLayerSelection(newSelection: string[]) {
        const selectedLayerId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.setSelectedLayerId(selectedLayerId));
    }

    private handleChangedColorMapName(newSelection: string[]) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
        const colorMapName = newSelection && newSelection.length && newSelection[0];
        if (colorMapName) {
            this.props.dispatch(actions.updateLayer(layer, {colorMapName}));
        }
    }

    private handleChangedDisplayRange(displayRange: NumberRange) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
        this.props.dispatch(actions.updateLayer(layer, {
            displayMin: displayRange[0],
            displayMax: displayRange[1]
        }));
    }


    private handleChangedDisplayMinMax(value: [number, number]) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
        const displayMin = value[0];
        const displayMax = value[1];
        this.props.dispatch(actions.updateLayer(layer, {displayMin, displayMax}));
    }

    private handleChangedDisplayAlphaBlend(event: any) {
        const alphaBlending = event.target.checked;
        const layer = this.props.selectedVariableImageLayer;
        this.props.dispatch(actions.updateLayer(layer, {alphaBlending}));
    }


    private handleUpdateDisplayStatistics() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
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

    private static getLayerItemKey(layer: LayerState) {
        return layer.id;
    }

    private renderLayerItem(layer: LayerState) {
        return (
            <div>
                <input type="checkbox"
                       checked={layer.visible}
                       onChange={(event:any) => this.handleChangedLayerVisibility(layer, event.target.checked)}
                />
                <span style={{marginLeft: "0.5em"}} className="pt-icon-layout-grid"/>
                <span style={{marginLeft: "0.5em"}}>{actions.getLayerName(layer)}</span>
            </div>
        );
    }

    render() {
        // return (
        //     <ExpansionPanel icon="pt-icon-layers" text="Layers" isExpanded={true} defaultHeight={300}>
        //         <ContentWithDetailsPanel showDetails={this.props.showLayerDetails}
        //                                  onShowDetailsChange={this.handleShowDetailsChanged}
        //                                  isSplitPanel={true}
        //                                  initialContentHeight={200}
        //                                  actionComponent={this.renderActionButtonRow()}>
        //             {this.renderLayersList()}
        //             {this.renderLayerDetailsCard()}
        //         </ContentWithDetailsPanel>
        //     </ExpansionPanel>
        // );
        return (
            <div>
                <ContentWithDetailsPanel showDetails={this.props.showLayerDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged}
                                         isSplitPanel={true}
                                         initialContentHeight={200}
                                         actionComponent={this.renderActionButtonRow()}>
                    {this.renderLayersList()}
                    {this.renderLayerDetailsCard()}
                </ContentWithDetailsPanel>
            </div>
        );
    }

    private renderActionButtonRow() {
        const layerCount = this.props.layers ? this.props.layers.length : 0;
        const selectedLayerIndex = this.props.selectedLayerIndex;
        const selectedLayer = this.props.selectedLayer;
        const canRemoveLayer = selectedLayer && selectedLayer.id !== actions.SELECTED_VARIABLE_LAYER_ID;
        const canMoveLayerUp = selectedLayerIndex > 0;
        const canMoveLayerDown = selectedLayerIndex >= 0 && selectedLayerIndex < layerCount - 1;
        return (
            <div style={{display: 'inline', padding: '0.2em'}}>
                <Button className="pt-intent-primary"
                        style={{marginRight: '0.1em'}}
                        onClick={this.handleAddLayerButtonClicked}
                        iconName="add"/>
                <Button style={{marginRight: '0.1em'}}
                        disabled={!canRemoveLayer}
                        onClick={this.handleRemoveLayerButtonClicked}
                        iconName="remove"/>
                <Button style={{marginRight: '0.1em'}}
                        disabled={!canMoveLayerUp}
                        onClick={this.handleMoveLayerUpButtonClicked}
                        iconName="arrow-up"/>
                <Button disabled={!canMoveLayerDown}
                        onClick={this.handleMoveLayerDownButtonClicked}
                        iconName="arrow-down"/>
                <Button disabled={false}
                        onClick={this.handleProjectionButtonClicked}
                        iconName="map"/>
                <LayerSourcesDialog/>
                <ProjectionsDialog/>
            </div>
        );
    }

    private renderLayersList() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return null;
        }

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox items={layers}
                         getItemKey={LayersPanel.getLayerItemKey}
                         renderItem={this.renderLayerItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedLayerId}
                         onSelection={this.handleChangedLayerSelection}/>
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
                {this.renderFormImageEnhancement('opacity', 'Opacity', 0., 1.)}
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
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
        if (!layer) {
            return null;
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
                                           onChange={this.handleChangedDisplayMinMax}
                        />
                        <Tooltip content="Compute valid min/max">
                            <Button className="pt-intent-primary" iconName="arrows-horizontal"
                                    onClick={this.handleUpdateDisplayStatistics}/>
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

        return (
            <tr key="alphaBlending">
                <td>Alpha blending</td>
                <td>
                    <Switch checked={layer.alphaBlending}
                            onChange={this.handleChangedDisplayAlphaBlend}/>
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
        const layer = this.props.selectedVariableImageLayer || this.props.selectedVariableVectorLayer;
        if (!layer || (layer === this.props.selectedVariableVectorLayer && key !== 'opacity')) {
            return null;
        }

        function handleChangedImageEnhancement(dispatch, name: string, value: number) {
            dispatch(actions.updateLayer(layer,  {[name]: value}));
        }

        return (
            <tr key={key}>
                <td>{label}</td>
                <td style={{padding: 2}}>
                    <Slider min={min}
                            max={max}
                            stepSize={(max - min) / 10.}
                            labelStepSize={max - min}
                            renderLabel={(x) => formatNumber(x, 1)}
                            value={layer[key]}
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
                onChange={this.handleChangedDisplayRange}
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
                         items={colorMaps}
                         getItemKey={(item: ColorMapState) => item.name}
                         renderItem={(item: ColorMapState) => this.renderColorMapImage(item)}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={layer.colorMapName ? [layer.colorMapName] : []}
                         onSelection={this.handleChangedColorMapName}
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

