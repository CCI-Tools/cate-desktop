import * as React from 'react';
import {connect, DispatchProp} from 'react-redux';
import {
    ColorMapCategoryState,
    ColorMapState,
    ImageLayerState,
    LayerState,
    ResourceState,
    ResourceVectorLayerState,
    State,
    VariableImageLayerState,
    VariableState,
    VectorLayerState
} from '../state';
import {
    AnchorButton,
    Button,
    Intent,
    NumberRange,
    Popover,
    PopoverInteractionKind,
    Position,
    Radio,
    RadioGroup,
    RangeSlider,
    Slider,
    Switch,
    Tooltip
} from '@blueprintjs/core';
import {ListBox, ListBoxSelectionMode} from '../components/ListBox';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {ContentWithDetailsPanel} from '../components/ContentWithDetailsPanel';
import {NumericRangeField} from '../components/field/NumericRangeField';
import LayerSourcesDialog from './LayerSourcesDialog';
import {getLayerDisplayName, getLayerTypeIconName, SELECTED_VARIABLE_LAYER_ID} from '../state-util';
import {FieldValue} from '../components/field/Field';
import {ScrollablePanelContent} from '../components/ScrollableContent';
import {ViewState} from '../components/ViewState';
import {NO_LAYER_PROPERTIES, NO_LAYER_SELECTED, NO_LAYERS_EMPTY_VIEW, NO_LAYERS_NO_VIEW} from '../messages';
import * as Cesium from 'cesium';
import {TextField} from '../components/field/TextField';
import {NumericField} from '../components/field/NumericField';
import {SimpleStyle} from '../../common/geojson-simple-style';
import ChromePicker from 'react-color/lib/components/chrome/Chrome';
import {ColorResult} from 'react-color';

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

interface ILayersPanelProps {
    selectedResource: ResourceState | null;
    selectedVariable: VariableState | null,
    activeView: ViewState<any> | null;
    layers: Array<LayerState>;
    selectedLayerId: string | null;
    selectedLayerIndex: number;
    selectedLayer: LayerState | null;
    selectedImageLayer: ImageLayerState | null;
    selectedVariableImageLayer: VariableImageLayerState | null;
    selectedVectorLayer: VectorLayerState | null;
    selectedResourceVectorLayer: ResourceVectorLayerState | null;
    selectedEntity: Cesium.Entity | null;
    vectorStyleMode: 'entity' | 'layer';
    showLayerDetails: boolean;
    colorMapCategories: Array<ColorMapCategoryState>;
    selectedColorMap: ColorMapState | null;
    displayMinMax: [number, number];
    isComputingVariableStatistics: boolean;
    vectorStyle: SimpleStyle;
}

function mapStateToProps(state: State): ILayersPanelProps {
    return {
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        activeView: selectors.activeViewSelector(state),
        layers: selectors.layersSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedLayerIndex: selectors.selectedLayerIndexSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedImageLayer: selectors.selectedImageLayerSelector(state),
        selectedVariableImageLayer: selectors.selectedVariableImageLayerSelector(state),
        selectedVectorLayer: selectors.selectedVectorLayerSelector(state),
        selectedResourceVectorLayer: selectors.selectedResourceVectorLayerSelector(state),
        selectedEntity: selectors.selectedEntitySelector(state),
        vectorStyleMode: selectors.vectorStyleModeSelector(state),
        showLayerDetails: state.session.showLayerDetails,
        colorMapCategories: selectors.colorMapCategoriesSelector(state),
        selectedColorMap: selectors.selectedColorMapSelector(state),
        displayMinMax: selectors.selectedVariableImageLayerDisplayMinMaxSelector(state),
        isComputingVariableStatistics: selectors.isComputingVariableStatistics(state),
        vectorStyle: selectors.vectorStyleSelector(state),
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class LayersPanel extends React.Component<ILayersPanelProps & DispatchProp<State>, null> {

    static readonly SLIDER_DIV_STYLE_05 = {width: '100%', paddingLeft: '0.5em', paddingRight: '0.5em'};
    static readonly SLIDER_DIV_STYLE_10 = {width: '100%', paddingLeft: '1em', paddingRight: '1em'};
    static readonly SLIDER_DIV_STYLE_15 = {width: '100%', paddingLeft: '1.5em', paddingRight: '1.5em'};

    constructor(props: ILayersPanelProps & DispatchProp<State>) {
        super(props);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleAddLayerButtonClicked = this.handleAddLayerButtonClicked.bind(this);
        this.handleRemoveLayerButtonClicked = this.handleRemoveLayerButtonClicked.bind(this);
        this.handleMoveLayerUpButtonClicked = this.handleMoveLayerUpButtonClicked.bind(this);
        this.handleMoveLayerDownButtonClicked = this.handleMoveLayerDownButtonClicked.bind(this);
        this.handleChangedLayerSelection = this.handleChangedLayerSelection.bind(this);
        this.handleChangedLayerVisibility = this.handleChangedLayerVisibility.bind(this);
        this.handleChangedLayerOpacity = this.handleChangedLayerOpacity.bind(this);
        this.handleUpdateDisplayStatistics = this.handleUpdateDisplayStatistics.bind(this);
        this.handleChangedDisplayMinMax = this.handleChangedDisplayMinMax.bind(this);
        this.handleChangedDisplayRange = this.handleChangedDisplayRange.bind(this);
        this.handleChangedDisplayAlphaBlend = this.handleChangedDisplayAlphaBlend.bind(this);
        this.handleChangedColorMapName = this.handleChangedColorMapName.bind(this);
        this.handleChangedVectorStyleMode = this.handleChangedVectorStyleMode.bind(this);
        this.handleChangedFillColor = this.handleChangedFillColor.bind(this);
        this.handleChangedFillColorInPicker = this.handleChangedFillColorInPicker.bind(this);
        this.handleChangedFillOpacity = this.handleChangedFillOpacity.bind(this);
        this.handleChangedStrokeWidth = this.handleChangedStrokeWidth.bind(this);
        this.handleChangedStrokeColor = this.handleChangedStrokeColor.bind(this);
        this.handleChangedStrokeOpacity = this.handleChangedStrokeOpacity.bind(this);
        this.handleChangedMarkerColor = this.handleChangedMarkerColor.bind(this);
        this.handleChangedMarkerSize = this.handleChangedMarkerSize.bind(this);
        this.handleChangedMarkerSymbol = this.handleChangedMarkerSymbol.bind(this);
        this.renderLayerItem = this.renderLayerItem.bind(this);
    }

    componentDidMount(): void {
        if (!this.props.colorMapCategories) {
            this.props.dispatch(actions.loadColorMaps());
        }
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setSessionProperty('showLayerDetails', value));
    }

    private handleAddLayerButtonClicked() {
        this.props.dispatch(actions.showDialog('layerSourcesDialog'));
    }

    private handleRemoveLayerButtonClicked() {
        this.props.dispatch(actions.removeLayer(this.props.activeView.id, this.props.selectedLayerId));
    }

    private handleMoveLayerUpButtonClicked() {
        this.props.dispatch(actions.moveLayerUp(this.props.activeView.id, this.props.selectedLayerId));
    }

    private handleMoveLayerDownButtonClicked() {
        this.props.dispatch(actions.moveLayerDown(this.props.activeView.id, this.props.selectedLayerId));
    }

    private handleChangedLayerVisibility(layer: LayerState, visible: boolean) {
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {visible}));
    }

    private handleChangedLayerOpacity(opacity: number) {
        const layer = this.props.selectedLayer;
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {opacity}));
    }

    private handleChangedLayerSelection(newSelection: string[]) {
        const selectedLayerId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.setSelectedLayerId(this.props.activeView.id, selectedLayerId));
    }

    private handleChangedColorMapName(newSelection: string[]) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        const colorMapName = newSelection && newSelection.length && newSelection[0];
        if (colorMapName) {
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {colorMapName}));
        }
    }

    private handleChangedDisplayRange(displayRange: NumberRange) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {
            displayMin: displayRange[0],
            displayMax: displayRange[1]
        }));
    }

    private handleChangedDisplayMinMax(displayMinMax: FieldValue<NumberRange>) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        if (!displayMinMax.error) {
            const displayMin = displayMinMax.value[0];
            const displayMax = displayMinMax.value[1];
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {displayMin, displayMax}));
        }
    }

    private handleChangedDisplayAlphaBlend(event: any) {
        const alphaBlending = event.target.checked;
        const layer = this.props.selectedVariableImageLayer;
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {alphaBlending}));
    }

    private handleUpdateDisplayStatistics() {
        const resource = this.props.selectedResource;
        const variable = this.props.selectedVariable;
        const imageLayer = this.props.selectedVariableImageLayer;
        if (!resource || !variable || !imageLayer) {
            return;
        }
        this.props.dispatch(actions.getWorkspaceVariableStatistics(resource.name, variable.name, imageLayer.varIndex,
            (statistics) => {
                return actions.updateLayer(this.props.activeView.id, imageLayer, {
                    displayMin: statistics.min,
                    displayMax: statistics.max,
                    statistics
                });
            }
        ));
    }

    private handleChangedVectorStyleMode(event: any) {
        const vectorStyleMode = event.target.value;
        this.props.dispatch(actions.setVectorStyleMode(vectorStyleMode));
    }

    private handleChangedFillColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, fill: value.value});
    }

    private handleChangedFillColorInPicker(color: ColorResult) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, fill: color.hex});
    }

    private handleChangedFillOpacity(fillOpacity: number) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, fillOpacity});
    }

    private handleChangedStrokeWidth(value: FieldValue<number>) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, strokeWidth: value.value});
    }

    private handleChangedStrokeColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, stroke: value.value});
    }

    private handleChangedStrokeOpacity(strokeOpacity: number) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, strokeOpacity});
    }

    private handleChangedMarkerSize(event) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, markerSize: event.target.value});
    }

    private handleChangedMarkerColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, markerColor: value.value});
    }

    private handleChangedMarkerSymbol(value: FieldValue<string>) {
        this.handleChangedVectorStyle({...this.props.vectorStyle, markerSymbol: value.value});
    }

    private handleChangedVectorStyle(style: SimpleStyle) {
        if (this.props.vectorStyleMode === 'layer') {
            this.props.dispatch(actions.updateLayerStyle(this.props.activeView.id,
                this.props.selectedVectorLayer.id,
                style));
        } else {
            this.props.dispatch(actions.updateEntityStyle(this.props.activeView,
                this.props.selectedEntity,
                style));
        }
    }

    private static getLayerItemKey(layer: LayerState) {
        return layer.id;
    }

    private static stopPropagation(event) {
        event.stopPropagation();
    }

    private renderLayerItem(layer: LayerState) {
        return (
            <div>
                <input type="checkbox"
                       checked={layer.visible}
                       onClick={LayersPanel.stopPropagation}
                       onChange={(event: any) => {
                           this.handleChangedLayerVisibility(layer, event.target.checked)
                       }}
                />
                <span style={{marginLeft: '0.5em'}} className={getLayerTypeIconName(layer)}/>
                <span style={{marginLeft: '0.5em'}}>{getLayerDisplayName(layer)}</span>
            </div>
        );
    }

    render() {
        let activeView = this.props.activeView;
        if (!activeView || activeView.type !== 'world') {
            return NO_LAYERS_NO_VIEW;
        }

        return (
            <div style={{width: '100%'}}>
                <ContentWithDetailsPanel showDetails={this.props.showLayerDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged}
                                         isSplitPanel={true}
                                         initialContentHeight={160}
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
        const canRemoveLayer = selectedLayer && selectedLayer.id !== SELECTED_VARIABLE_LAYER_ID;
        const canMoveLayerUp = selectedLayerIndex > 0;
        const canMoveLayerDown = selectedLayerIndex >= 0 && selectedLayerIndex < layerCount - 1;
        return (
            <div className="pt-button-group">
                <Tooltip content="Add a new layer" position={Position.LEFT}>
                    <AnchorButton
                        className="pt-intent-primary"
                        onClick={this.handleAddLayerButtonClicked}
                        iconName="add"/>
                </Tooltip>
                <Tooltip content="Remove selected layer" position={Position.LEFT}>
                    <AnchorButton
                        disabled={!canRemoveLayer}
                        onClick={this.handleRemoveLayerButtonClicked}
                        iconName="remove"/>
                </Tooltip>
                <Tooltip content="Move layer up" position={Position.LEFT}>
                    <AnchorButton
                        disabled={!canMoveLayerUp}
                        onClick={this.handleMoveLayerUpButtonClicked}
                        iconName="arrow-up"/>
                </Tooltip>
                <Tooltip content="Move layer down" position={Position.LEFT}>
                    <AnchorButton
                        disabled={!canMoveLayerDown}
                        onClick={this.handleMoveLayerDownButtonClicked}
                        iconName="arrow-down"/>
                </Tooltip>
                <LayerSourcesDialog/>
            </div>
        );
    }

    private renderLayersList() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return null;
        }

        return (
            <ScrollablePanelContent>
                <ListBox items={layers}
                         getItemKey={LayersPanel.getLayerItemKey}
                         renderItem={this.renderLayerItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedLayerId}
                         onSelection={this.handleChangedLayerSelection}/>
            </ScrollablePanelContent>
        );
    }

    private renderLayerDetailsCard() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return NO_LAYERS_EMPTY_VIEW;
        }

        if (!this.props.selectedLayer) {
            return NO_LAYER_SELECTED;
        }

        if (this.props.selectedImageLayer) {
            return this.renderImageLayerDetails();
        } else if (this.props.selectedVectorLayer) {
            return this.renderVectorLayerDetails();
        } else {
            return NO_LAYER_PROPERTIES;
        }
    }

    private renderImageLayerDetails() {
        return (
            <div style={{width: '100%'}}>
                <label key="spacer" className="pt-label"> </label>
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
            </div>
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
            <label key="cmap" className="pt-label pt-inline">
                Colour bar
                {colorBarButton}
            </label>
        );
    }

    private renderFormDisplayMinMax() {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        if (!layer) {
            return null;
        }

        return (
            <div style={{width: '100%'}}>
                <label key="drange" className="pt-label">
                    Display range
                    <div>
                        <div style={{width: '100%', display: 'flex', alignItems: 'center'}}>
                            <NumericRangeField value={this.props.displayMinMax}
                                               style={{flex: 'auto'}}
                                               onChange={this.handleChangedDisplayMinMax}
                                               uncontrolled={true}
                            />
                            <Tooltip content="Compute valid min/max" position={Position.LEFT}>
                                <AnchorButton className="pt-intent-primary" iconName="arrows-horizontal"
                                              style={{flex: 'none'}}
                                              disabled={this.props.isComputingVariableStatistics}
                                              onClick={this.handleUpdateDisplayStatistics}/>
                            </Tooltip>
                        </div>
                    </div>
                </label>
                <div style={LayersPanel.SLIDER_DIV_STYLE_15}>
                    {this.renderDisplayRangeSlider()}
                </div>
            </div>
        );
    }

    private renderFormAlphaBlending() {
        const layer = this.props.selectedVariableImageLayer;
        if (!layer) {
            return null;
        }
        return (
            <Switch key="alpha"
                    checked={layer.alphaBlending}
                    label="Alpha blending"
                    onChange={this.handleChangedDisplayAlphaBlend}/>
        );
    }

    private renderFormVarIndex() {
        const layer = this.props.selectedVariableImageLayer;
        const variable = this.props.selectedVariable;
        if (!layer || !variable || variable.numDims <= 2) {
            return null;
        }

        const handleChangedLayerVarIndex = (i: number, value: number) => {
            const varIndex = layer.varIndex.slice();
            varIndex[i] = value;
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {varIndex}));
        };

        const n = variable.numDims - 2;
        const dimensionRows = [];
        for (let i = 0; i < n; i++) {
            const dimension = variable.dimNames[i];
            const max = variable.shape[i] - 1;
            if (max > 0) {
                const value = layer.varIndex[i];
                dimensionRows.push(
                    <label key={dimension + '_index'} className="pt-label pt-inline">
                        {'Index into ' + dimension}
                        <div style={LayersPanel.SLIDER_DIV_STYLE_05}>
                            <Slider min={0}
                                    max={max}
                                    stepSize={1}
                                    labelStepSize={max}
                                    value={value}
                                    onChange={(value: number) => handleChangedLayerVarIndex(i, value)}
                            />
                        </div>
                    </label>
                );
            }
        }
        return dimensionRows;
    }

    private renderFormImageEnhancement(key: string, label: string, min: number, max: number) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        if (!layer || (layer === this.props.selectedResourceVectorLayer && key !== 'opacity')) {
            return null;
        }

        const handleChangedImageEnhancement = (name: string, value: number) => {
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {[name]: value}));
        };

        return (
            <label key={key} className="pt-label">
                {label}
                <div style={LayersPanel.SLIDER_DIV_STYLE_05}>
                    <Slider min={min}
                            max={max}
                            stepSize={(max - min) / 10.}
                            labelStepSize={max - min}
                            renderLabel={(x) => formatNumber(x, 1)}
                            value={layer[key]}
                            onChange={(value: number) => handleChangedImageEnhancement(key, value)}/>
                </div>
            </label>
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
        const buttonContent = (selectedColorMapImage || (selectedColorMapName || 'Select Color Bar'));
        return (<AnchorButton style={{width: '100%'}} disabled={disabled}>{buttonContent}</AnchorButton>);
    }

    private renderColorBarBox(layer: VariableImageLayerState) {
        const children = [];
        for (let cat of this.props.colorMapCategories) {
            const colorMaps = cat.colorMaps;
            children.push(
                <p key={cat.name + '_head'} style={{marginTop: 2, marginBottom: 2}}>
                    <Tooltip content={cat.description}>
                        {cat.name}
                    </Tooltip>
                </p>
            );
            children.push(
                <ListBox key={cat.name + '_list'}
                         items={colorMaps}
                         getItemKey={(item: ColorMapState) => item.name}
                         renderItem={(item: ColorMapState) => this.renderColorMapImage(item)}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={layer.colorMapName ? [layer.colorMapName] : []}
                         onSelection={this.handleChangedColorMapName}
                />
            );
        }

        return <div style={{padding: 5, overflowY: 'auto'}}>{children}</div>;
    }

    //noinspection JSMethodCanBeStatic
    private renderColorMapImage(colorMap: ColorMapState) {
        if (colorMap) {
            return (
                <Tooltip content={colorMap.name}>
                    <img src={`data:image/png;base64,${colorMap.imageData}`}
                         alt={colorMap.name}
                         style={{width: '100%', height: '1em'}}/>
                </Tooltip>
            );
        }
        return null;
    }

    private renderVectorLayerDetails() {
        return (
            <div style={{width: '100%'}}>
                <label key="spacer" className="pt-label"> </label>
                {this.renderStyleContext()}
                {this.renderFillColor()}
                {this.renderFillOpacity()}
                {this.renderStrokeWidth()}
                {this.renderStrokeColor()}
                {this.renderStrokeOpacity()}
                {this.renderMarkerColor()}
                {this.renderMarkerSize()}
                {this.renderMarkerSymbol()}
            </div>
        );
    }


    private renderStyleContext() {
        const selectedVectorLayer = this.props.selectedVectorLayer;
        const selectedEntity = this.props.selectedEntity;
        let vectorStyleMode;
        let disabled = true;
        if (selectedEntity && selectedVectorLayer) {
            vectorStyleMode = this.props.vectorStyleMode;
            disabled = false;
        } else if (selectedEntity) {
            vectorStyleMode = 'entity';
        } else if (selectedVectorLayer) {
            vectorStyleMode = 'layer';
        }
        return (
            <RadioGroup
                key="vectorStyleMode"
                label="Apply styles to selected"
                disabled={disabled}
                inline={true}
                onChange={this.handleChangedVectorStyleMode}
                selectedValue={vectorStyleMode}
            >
                <Radio label="entity" value="entity"/>
                <Radio label="layer" value="layer"/>
            </RadioGroup>
        );
    }

    private renderFillColor() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Fill colour</span>
                <TextField value={this.props.vectorStyle.fill}
                           style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right'}}
                           size={8}
                           uncontrolled={true}
                           onChange={this.handleChangedFillColor}
                />
                <Popover
                    interactionKind={PopoverInteractionKind.CLICK}
                    popoverClassName="pt-minimal"
                    position={Position.LEFT_TOP}
                >
                    <Button intent={Intent.PRIMARY} style={{marginLeft: '1em'}}>
                        Pick color
                    </Button>
                    <ChromePicker
                        color={this.props.vectorStyle.fill}
                        onChange={this.handleChangedFillColorInPicker}
                    />
                </Popover>
            </label>
        );
    }

    private renderFillOpacity() {
        return (
            <label className="pt-label pt-inline">
                Fill opacity
                <div style={LayersPanel.SLIDER_DIV_STYLE_10}>
                    <Slider min={0.0}
                            max={1.0}
                            stepSize={0.05}
                            labelStepSize={0.25}
                            value={this.props.vectorStyle.fillOpacity}
                            onChange={this.handleChangedFillOpacity}
                    />
                </div>
            </label>
        );
    }

    private renderStrokeWidth() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Stroke width</span>
                <NumericField value={this.props.vectorStyle.strokeWidth}
                              style={{flex: 'auto', fontFamily: 'courier'}}
                              size={8}
                              min={0}
                              uncontrolled={true}
                              onChange={this.handleChangedStrokeWidth}
                />
            </label>
        );
    }

    private renderStrokeColor() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Stroke colour</span>
                <TextField value={this.props.vectorStyle.stroke}
                           style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right'}}
                           size={8}
                           uncontrolled={true}
                           onChange={this.handleChangedStrokeColor}
                />
            </label>
        );
    }

    private renderStrokeOpacity() {
        return (
            <label className="pt-label pt-inline">
                Stroke opacity
                <div style={LayersPanel.SLIDER_DIV_STYLE_10}>
                    <Slider min={0.0}
                            max={1.0}
                            stepSize={0.05}
                            labelStepSize={0.25}
                            value={this.props.vectorStyle.strokeOpacity}
                            onChange={this.handleChangedStrokeOpacity}
                    />
                </div>
            </label>
        );
    }

    private renderMarkerColor() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Marker colour</span>
                <TextField value={this.props.vectorStyle.markerColor}
                           style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right'}}
                           size={8}
                           uncontrolled={true}
                           onChange={this.handleChangedMarkerColor}
                />
            </label>
        );
    }

    private renderMarkerSize() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Marker size</span>
                <div className="pt-select">
                    <select value={this.props.vectorStyle.markerSize}
                            onChange={this.handleChangedMarkerSize}>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
            </label>
        );
    }

    private renderMarkerSymbol() {
        return (
            <label className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={{flexBasis: '100px'}}>Marker symbol</span>
                <TextField value={this.props.vectorStyle.markerSymbol}
                           style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right'}}
                           size={8}
                           uncontrolled={true}
                           onChange={this.handleChangedMarkerSymbol}
                />
            </label>
        );
    }
}

export default connect(mapStateToProps)(LayersPanel);

