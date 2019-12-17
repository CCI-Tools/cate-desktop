import {connect, DispatchProp} from 'react-redux';
import {
    ColorMapCategoryState,
    ColorMapState,
    ImageLayerState,
    LayerState, Placemark,
    ResourceState,
    ResourceVectorLayerState,
    State, STYLE_CONTEXT_ENTITY, STYLE_CONTEXT_LAYER,
    VariableImageLayerState,
    VariableState,
    VectorLayerState
} from '../state';
import * as React from 'react';
import {NO_ENTITY_FOR_STYLE, NO_LAYER_FOR_STYLE} from '../messages';
import {SubPanelHeader} from '../components/SubPanelHeader';
import {
    AnchorButton,
    Button, Colors,
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
import * as actions from '../actions';
import * as selectors from '../selectors';
import {NumericRangeField} from '../components/field/NumericRangeField';
import {FieldValue} from '../components/field/Field';
import {ListBox, ListBoxSelectionMode} from '../components/ListBox';
import {TextField} from '../components/field/TextField';
import SketchPicker from 'react-color/lib/components/sketch/Sketch';
import {ColorResult} from 'react-color';
import {SimpleStyle} from '../../common/geojson-simple-style';
import {NumericField} from '../components/field/NumericField';
import {ViewState} from '../components/ViewState';
import * as Cesium from 'cesium';
import {getLayerDisplayName} from "../state-util";
import {ToolButton} from "../components/ToolButton";

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

interface IStylesPanelProps {
    selectedResource: ResourceState | null;
    selectedVariable: VariableState | null,
    activeView: ViewState<any> | null;
    layers: Array<LayerState>;
    selectedLayer: LayerState | null;
    selectedImageLayer: ImageLayerState | null;
    selectedVariableImageLayer: VariableImageLayerState | null;
    selectedVectorLayer: VectorLayerState | null;
    selectedResourceVectorLayer: ResourceVectorLayerState | null;
    selectedEntity: Cesium.Entity | null;
    selectedPlacemark: Placemark | null;
    styleContext: 'entity' | 'layer';
    showLayerDetails: boolean;
    colorMapCategories: Array<ColorMapCategoryState>;
    selectedColorMap: ColorMapState | null;
    displayMinMax: [number, number];
    isComputingVariableStatistics: boolean;
    vectorStyle: SimpleStyle;
}

function mapStateToProps(state: State) {
    return {
        selectedResource: selectors.selectedResourceSelector(state),
        selectedVariable: selectors.selectedVariableSelector(state),
        activeView: selectors.activeViewSelector(state),
        layers: selectors.layersSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedImageLayer: selectors.selectedImageLayerSelector(state),
        selectedVariableImageLayer: selectors.selectedVariableImageLayerSelector(state),
        selectedVectorLayer: selectors.selectedVectorLayerSelector(state),
        selectedResourceVectorLayer: selectors.selectedResourceVectorLayerSelector(state),
        selectedEntity: selectors.selectedEntitySelector(state),
        selectedPlacemark: selectors.selectedPlacemarkSelector(state),
        styleContext: selectors.styleContextSelector(state),
        showLayerDetails: state.session.showLayerDetails,
        colorMapCategories: selectors.colorMapCategoriesSelector(state),
        selectedColorMap: selectors.selectedColorMapSelector(state),
        displayMinMax: selectors.selectedVariableImageLayerDisplayMinMaxSelector(state),
        isComputingVariableStatistics: selectors.isComputingVariableStatistics(state),
        vectorStyle: selectors.vectorStyleSelector(state),
    };
}

class StylesPanel extends React.Component<IStylesPanelProps & DispatchProp<State>, null> {
    static readonly SLIDER_DIV_STYLE_05 = {width: '100%', paddingLeft: '0.5em', paddingRight: '0.5em'};
    static readonly SLIDER_DIV_STYLE_10 = {width: '100%', paddingLeft: '1em', paddingRight: '1em'};
    static readonly SLIDER_DIV_STYLE_15 = {width: '100%', paddingLeft: '1.5em', paddingRight: '1.5em'};

    static readonly LABEL_SPAN_STYLE_100 = {flexBasis: '100px', paddingLeft: '5px'};

    static readonly LABEL_BOTTOM_MARGIN = {display: 'flex', margin: '0 0 5px'};

    constructor(props: IStylesPanelProps) {
        super(props);
        this.handleUpdateDisplayStatistics = this.handleUpdateDisplayStatistics.bind(this);
        this.handleChangedDisplayMinMax = this.handleChangedDisplayMinMax.bind(this);
        this.handleChangedDisplayRange = this.handleChangedDisplayRange.bind(this);
        this.handleChangedDisplayAlphaBlend = this.handleChangedDisplayAlphaBlend.bind(this);
        this.handleChangedColorMapName = this.handleChangedColorMapName.bind(this);
        this.handleChangedStyleContext = this.handleChangedStyleContext.bind(this);
        this.handleChangedFillColor = this.handleChangedFillColor.bind(this);
        this.handleChangedFillColorFromPicker = this.handleChangedFillColorFromPicker.bind(this);
        this.handleChangedFillOpacity = this.handleChangedFillOpacity.bind(this);
        this.handleChangedStrokeWidth = this.handleChangedStrokeWidth.bind(this);
        this.handleChangedStrokeColor = this.handleChangedStrokeColor.bind(this);
        this.handleChangedStrokeColorFromPicker = this.handleChangedStrokeColorFromPicker.bind(this);
        this.handleChangedStrokeOpacity = this.handleChangedStrokeOpacity.bind(this);
        this.handleChangedMarkerColor = this.handleChangedMarkerColor.bind(this);
        this.handleChangedMarkerColorFromPicker = this.handleChangedMarkerColorFromPicker.bind(this);
        this.handleChangedMarkerSize = this.handleChangedMarkerSize.bind(this);
        this.handleChangedMarkerSymbol = this.handleChangedMarkerSymbol.bind(this);
    }

    public render() {
        return (
            <React.Fragment>
                {this.renderLayerDetails()}
            </React.Fragment>
        )
    }

    private renderLayerDetails() {

        let detailsPanel;
        if (this.props.styleContext === STYLE_CONTEXT_ENTITY) {
            if (this.props.selectedEntity) {
                detailsPanel = this.renderVectorLayerDetails();
            } else {
                detailsPanel = NO_ENTITY_FOR_STYLE;
            }
        } else /*if (this.props.styleContext === STYLE_CONTEXT_LAYER)*/ {
            if (this.props.selectedVectorLayer) {
                detailsPanel = this.renderVectorLayerDetails();
            } else if (this.props.selectedImageLayer) {
                detailsPanel = this.renderImageLayerDetails();
            } else {
                detailsPanel = NO_LAYER_FOR_STYLE;
            }
        }

        return (
            <div style={{width: '100%'}}>
                {this.renderStyleContext()}
                {detailsPanel}
            </div>
        );
    }

    private renderImageLayerDetails() {
        return (
            <React.Fragment>
                <SubPanelHeader title="COLOUR MAPPING"/>
                {this.renderFormAlphaBlending()}
                {this.renderFormDisplayMinMax()}
                {this.renderFormDisplayColorBar()}
                <SubPanelHeader title="IMAGE ENHANCEMENTS"/>
                {this.renderFormImageEnhancement('opacity', 'Opacity', 0., 1.)}
                {this.renderFormImageEnhancement('brightness', 'Brightness', 0., 2.)}
                {this.renderFormImageEnhancement('contrast', 'Contrast', 0., 2.)}
                {this.renderFormImageEnhancement('hue', 'Hue', 0., 1.)}
                {this.renderFormImageEnhancement('saturation', 'Saturation', 0., 2.)}
                {this.renderFormImageEnhancement('gamma', 'Gamma', 1., 2.)}
            </React.Fragment>
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

    private renderFormDisplayMinMax() {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        if (!layer) {
            return null;
        }

        return (
            <div style={{width: '100%', marginBottom: '20px'}}>
                <label key="drange" className="pt-label" style={{display: 'flex'}}>
                    <span style={{...StylesPanel.LABEL_SPAN_STYLE_100, margin: 'auto 0'}}>Display range</span>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <NumericRangeField value={this.props.displayMinMax}
                                           style={{flex: 'auto'}}
                                           onChange={this.handleChangedDisplayMinMax}
                                           uncontrolled={true}
                        />
                        <ToolButton tooltipContent="Compute valid min/max" tooltipPosition={Position.LEFT}
                                    className="pt-intent-primary" iconName="arrows-horizontal"
                                    style={{flex: 'none', marginTop: '5px'}}
                                    disabled={this.props.isComputingVariableStatistics}
                                    onClick={this.handleUpdateDisplayStatistics}/>
                    </div>
                </label>
                <div style={StylesPanel.SLIDER_DIV_STYLE_15}>
                    {this.renderDisplayRangeSlider()}
                </div>
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
            <label key="cmap" className="pt-label pt-inline" style={{display: 'flex'}}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Colour bar</span>
                {colorBarButton}
            </label>
        );
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
            <label key={key} className="pt-label" style={{display: 'flex'}}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>{label}</span>
                <div style={{...StylesPanel.SLIDER_DIV_STYLE_10, width: undefined, flex: 'auto 1', margin: 'auto 0'}}>
                    <Slider min={min}
                            max={max}
                            stepSize={(max - min) / 10.}
                            renderLabel={false}
                            value={layer[key]}
                            onChange={(value: number) => handleChangedImageEnhancement(key, value)}/>
                </div>
            </label>
        );
    }

    private renderVectorLayerDetails() {
        return (
            <React.Fragment>
                <SubPanelHeader title="FILL"/>
                {this.renderFillColor()}
                {this.renderFillOpacity()}
                <SubPanelHeader title="STROKE"/>
                {this.renderStrokeWidth()}
                {this.renderStrokeColor()}
                {this.renderStrokeOpacity()}
                <SubPanelHeader title="MARKER"/>
                {this.renderMarkerColor()}
                {this.renderMarkerSize()}
                {this.renderMarkerSymbol()}
            </React.Fragment>
        );
    }

    private renderStyleContext() {
        const selectedEntity = this.props.selectedEntity;
        const selectedPlacemark = this.props.selectedPlacemark;
        const selectedLayer = this.props.selectedLayer;

        let entityDisplayName;
        let layerDisplayName;

        if (selectedPlacemark) {
            const title = selectedPlacemark.properties && selectedPlacemark.properties.title;
            if (title && title !== "") {
                entityDisplayName = `My place ${title}`;
            } else {
                entityDisplayName = "Selected place";
            }
        } else if (selectedEntity) {
            entityDisplayName = "Selected entity";
        } else {
            entityDisplayName = "Selected entity (none)";
        }

        if (selectedLayer) {
            layerDisplayName = `Layer ${getLayerDisplayName(selectedLayer)}`;
        } else {
            layerDisplayName = "Selected layer";
        }

        return (
            <RadioGroup
                key="styleContext"
                label="Style context"
                onChange={this.handleChangedStyleContext}
                selectedValue={this.props.styleContext}
            >
                <Radio label={entityDisplayName} value={STYLE_CONTEXT_ENTITY}/>
                <Radio label={layerDisplayName} value={STYLE_CONTEXT_LAYER}/>
            </RadioGroup>
        );
    }

    private renderFillColor() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Colour</span>
                <div className="pt-input-group" style={{lineHeight: '0', flex: 'auto 1'}}>
                    <TextField value={this.props.vectorStyle.fill}
                               style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right', paddingRight: '40px'}}
                               size={8}
                               uncontrolled={true}
                               onChange={this.handleChangedFillColor}
                    />
                    <Popover
                        interactionKind={PopoverInteractionKind.CLICK}
                        popoverClassName="pt-minimal"
                        position={Position.LEFT}
                        className="pt-input-action"
                    >
                        <Button style={{backgroundColor: this.props.vectorStyle.fill}}/>
                        <SketchPicker
                            color={this.props.vectorStyle.fill}
                            onChange={this.handleChangedFillColorFromPicker}
                            disableAlpha={true}
                        />
                    </Popover>
                </div>
            </label>
        );
    }

    private renderFillOpacity() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Opacity</span>
                <div style={{...StylesPanel.SLIDER_DIV_STYLE_05, width: undefined, flex: 'auto 1', margin: 'auto 0'}}>
                    <Slider min={0.0}
                            max={1.0}
                            stepSize={0.05}
                            renderLabel={false}
                            value={this.props.vectorStyle.fillOpacity}
                            onChange={this.handleChangedFillOpacity}
                    />
                </div>
            </label>
        );
    }

    private renderStrokeWidth() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Width</span>
                <NumericField value={this.props.vectorStyle.strokeWidth}
                              style={{flex: 'auto 1', fontFamily: 'courier'}}
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
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Colour</span>
                <div className="pt-input-group" style={{lineHeight: '0', flex: 'auto 1'}}>
                    <TextField value={this.props.vectorStyle.stroke}
                               style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right', paddingRight: '40px'}}
                               size={8}
                               uncontrolled={true}
                               onChange={this.handleChangedStrokeColor}
                    />
                    <Popover
                        interactionKind={PopoverInteractionKind.CLICK}
                        popoverClassName="pt-minimal"
                        position={Position.LEFT}
                        className="pt-input-action"
                    >
                        <Button style={{backgroundColor: this.props.vectorStyle.stroke}}/>
                        <SketchPicker
                            color={this.props.vectorStyle.stroke}
                            onChange={this.handleChangedStrokeColorFromPicker}
                            disableAlpha={true}
                        />
                    </Popover>
                </div>
            </label>
        );
    }

    private renderStrokeOpacity() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Opacity</span>
                <div style={{...StylesPanel.SLIDER_DIV_STYLE_05, width: undefined, flex: 'auto 1', margin: 'auto 0'}}>
                    <Slider min={0.0}
                            max={1.0}
                            stepSize={0.05}
                            renderLabel={false}
                            value={this.props.vectorStyle.strokeOpacity}
                            onChange={this.handleChangedStrokeOpacity}
                    />
                </div>
            </label>
        );
    }

    private renderMarkerColor() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Colour</span>
                <div className="pt-input-group" style={{lineHeight: '0', flex: 'auto 1'}}>
                    <TextField value={this.props.vectorStyle.markerColor}
                               style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right', paddingRight: '40px'}}
                               size={8}
                               uncontrolled={true}
                               onChange={this.handleChangedMarkerColor}
                    />
                    <Popover
                        interactionKind={PopoverInteractionKind.CLICK}
                        popoverClassName="pt-minimal"
                        position={Position.LEFT}
                        className="pt-input-action"
                    >
                        <Button style={{backgroundColor: this.props.vectorStyle.markerColor}}/>
                        <SketchPicker
                            color={this.props.vectorStyle.markerColor}
                            onChange={this.handleChangedMarkerColorFromPicker}
                            disableAlpha={true}
                        />
                    </Popover>
                </div>
            </label>
        );
    }

    private renderMarkerSize() {
        return (
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Size</span>
                <div className="pt-select" style={{flex: 'auto 1'}}>
                    <select value={this.props.vectorStyle.markerSize}
                            onChange={this.handleChangedMarkerSize}
                    >
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
            <label className="pt-label pt-inline" style={StylesPanel.LABEL_BOTTOM_MARGIN}>
                <span style={StylesPanel.LABEL_SPAN_STYLE_100}>Symbol</span>
                <TextField value={this.props.vectorStyle.markerSymbol}
                           style={{flex: 'auto', fontFamily: 'courier', textAlign: 'right'}}
                           size={8}
                           uncontrolled={true}
                           onChange={this.handleChangedMarkerSymbol}
                />
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
            return <span style={{color: Colors.ORANGE3}}>Missing data min/max</span>;
        }

        let min = statistics.min;
        let max = statistics.max;

        if (isNaN(min) || isNaN(max)){
            return <span style={{color: Colors.ORANGE3}}>All values are NaN</span>;
        }

        if (min === max) {
            return <span style={{color: Colors.ORANGE3}}>All values are {min}</span>;
        }

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
        return (<AnchorButton className="pt-minimal" style={{width: '100%'}}
                              disabled={disabled}>{buttonContent}</AnchorButton>);
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

    private handleChangedDisplayAlphaBlend(event: any) {
        const alphaBlending = event.target.checked;
        const layer = this.props.selectedVariableImageLayer;
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {alphaBlending}));
    }

    private handleChangedDisplayMinMax(displayMinMax: FieldValue<NumberRange>) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        if (!displayMinMax.error) {
            const displayMin = displayMinMax.value[0];
            const displayMax = displayMinMax.value[1];
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {displayMin, displayMax}));
        }
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

    private handleChangedDisplayRange(displayRange: NumberRange) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {
            displayMin: displayRange[0],
            displayMax: displayRange[1]
        }));
    }

    private handleChangedColorMapName(newSelection: string[]) {
        const layer = this.props.selectedVariableImageLayer || this.props.selectedResourceVectorLayer;
        const colorMapName = newSelection && newSelection.length && newSelection[0];
        if (colorMapName) {
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {colorMapName}));
        }
    }

    private handleChangedStyleContext(event: any) {
        this.props.dispatch(actions.setStyleContext(event.target.value));
    }

    private handleChangedFillColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({fill: value.value});
    }

    private handleChangedFillColorFromPicker(color: ColorResult) {
        this.handleChangedVectorStyle({fill: color.hex});
    }

    private handleChangedFillOpacity(fillOpacity: number) {
        this.handleChangedVectorStyle({fillOpacity});
    }

    private handleChangedStrokeWidth(value: FieldValue<number>) {
        this.handleChangedVectorStyle({strokeWidth: value.value});
    }

    private handleChangedStrokeColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({stroke: value.value});
    }

    private handleChangedStrokeColorFromPicker(color: ColorResult) {
        this.handleChangedVectorStyle({stroke: color.hex});
    }

    private handleChangedStrokeOpacity(strokeOpacity: number) {
        this.handleChangedVectorStyle({strokeOpacity});
    }

    private handleChangedMarkerSize(event) {
        this.handleChangedVectorStyle({markerSize: event.target.value});
    }

    private handleChangedMarkerColor(value: FieldValue<string>) {
        this.handleChangedVectorStyle({markerColor: value.value});
    }

    private handleChangedMarkerColorFromPicker(color: ColorResult) {
        this.handleChangedVectorStyle({markerColor: color.hex});
    }

    private handleChangedMarkerSymbol(value: FieldValue<string>) {
        this.handleChangedVectorStyle({markerSymbol: value.value});
    }

    private handleChangedVectorStyle(style: SimpleStyle) {
        //style = {...this.props.vectorStyle, ...style};
        if (this.props.styleContext === STYLE_CONTEXT_ENTITY) {
            this.props.dispatch(actions.updateEntityStyle(this.props.activeView,
                                                          this.props.selectedEntity,
                                                          style));
        } else {
            this.props.dispatch(actions.updateLayerStyle(this.props.activeView.id,
                                                         this.props.selectedVectorLayer.id,
                                                         style));
        }
    }
}

export default connect(mapStateToProps)(StylesPanel);
