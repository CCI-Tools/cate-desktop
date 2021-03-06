import * as React from 'react';
import { connect, DispatchProp } from 'react-redux';
import {
    ColorMapCategoryState,
    ImageLayerState,
    LayerState,
    SPLIT_MODE_LEFT,
    SPLIT_MODE_OFF,
    SPLIT_MODE_RIGHT,
    State,
    VariableImageLayerState,
    VariableState
} from '../state';
import { ButtonGroup, Checkbox, Icon, Intent, Label, Radio, RadioGroup, Slider } from '@blueprintjs/core';
import { ListBox, ListBoxSelectionMode } from '../components/ListBox';
import * as actions from '../actions';
import * as selectors from '../selectors';
import { ContentWithDetailsPanel } from '../components/ContentWithDetailsPanel';
import LayerSourcesDialog from './LayerSourcesDialog';
import { AUTO_LAYER_ID, getLayerDisplayName, getLayerTypeIconName } from '../state-util';
import { ScrollablePanelContent } from '../components/ScrollableContent';
import { ViewState } from '../components/ViewState';
import { NO_LAYER_SELECTED, NO_LAYERS_EMPTY_VIEW, NO_LAYERS_NO_VIEW } from '../messages';
import { SubPanelHeader } from '../components/SubPanelHeader';
import { ToolButton } from '../components/ToolButton';

interface ILayersPanelProps {
    selectedVariable: VariableState | null,
    activeView: ViewState<any> | null;
    layers: Array<LayerState>;
    selectedLayerId: string | null;
    selectedLayerIndex: number;
    selectedLayer: LayerState | null;
    selectedImageLayer: ImageLayerState | null;
    selectedVariableImageLayer: VariableImageLayerState | null;
    layerListHeight: number;
    showLayerDetails: boolean;
    colorMapCategories: Array<ColorMapCategoryState>;
}

function mapStateToProps(state: State): ILayersPanelProps {
    return {
        selectedVariable: selectors.selectedVariableSelector(state),
        activeView: selectors.activeViewSelector(state),
        layers: selectors.layersSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedLayerIndex: selectors.selectedLayerIndexSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedImageLayer: selectors.selectedImageLayerSelector(state),
        selectedVariableImageLayer: selectors.selectedVariableImageLayerSelector(state),
        layerListHeight: state.session.layerListHeight,
        showLayerDetails: state.session.showLayerDetails,
        colorMapCategories: selectors.colorMapCategoriesSelector(state)
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class LayersPanel extends React.Component<ILayersPanelProps & DispatchProp<State>, null> {

    static readonly SLIDER_DIV_STYLE_10 = {width: '100%', paddingLeft: '1em', paddingRight: '1em'};
    static readonly LABEL_SPAN_STYLE_100 = {flexBasis: '100px', paddingLeft: '5px'};
    static readonly LAYER_DIV_STYLE = {display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: '100%'};
    static readonly LAYER_LABEL_ELEMENT_STYLE = {marginLeft: '0.5em'};

    constructor(props: ILayersPanelProps & DispatchProp<State>) {
        super(props);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleListHeightChanged = this.handleListHeightChanged.bind(this);
        this.handleAddLayerButtonClicked = this.handleAddLayerButtonClicked.bind(this);
        this.handleRemoveLayerButtonClicked = this.handleRemoveLayerButtonClicked.bind(this);
        this.handleMoveLayerUpButtonClicked = this.handleMoveLayerUpButtonClicked.bind(this);
        this.handleMoveLayerDownButtonClicked = this.handleMoveLayerDownButtonClicked.bind(this);
        this.handleChangedLayerSelection = this.handleChangedLayerSelection.bind(this);
        this.handleChangedLayerVisibility = this.handleChangedLayerVisibility.bind(this);
        this.handleChangedLayerSplitMode = this.handleChangedLayerSplitMode.bind(this);
        this.renderLayerItem = this.renderLayerItem.bind(this);
    }

    private static getLayerItemKey(layer: LayerState) {
        return layer.id;
    }

    private static stopPropagation(event) {
        event.stopPropagation();
    }

    private static capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    componentDidMount(): void {
        if (!this.props.colorMapCategories) {
            this.props.dispatch(actions.loadColorMaps() as any);
        }
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
                                         contentHeight={this.props.layerListHeight}
                                         onContentHeightChange={this.handleListHeightChanged}
                                         actionComponent={this.renderActionButtonRow()}>
                    {this.renderLayersList()}
                    {this.renderLayerDetails()}
                </ContentWithDetailsPanel>
            </div>
        );
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.setSessionProperty('showLayerDetails', value));
    }

    private handleListHeightChanged(value: number) {
        this.props.dispatch(actions.setSessionProperty('layerListHeight', value));
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
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {visible}) as any);
    }

    private handleChangedLayerSplitMode(event) {
        this.props.dispatch(actions.setLayerSplitMode(this.props.activeView.id,
                                                      this.props.selectedLayerId,
                                                      event.target.value));
    }

    private handleChangedLayerSelection(newSelection: string[]) {
        const selectedLayerId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.setSelectedLayerId(this.props.activeView.id, selectedLayerId));
    }

    private renderLayerItem(layer: LayerState) {
        return (
            <div style={LayersPanel.LAYER_DIV_STYLE}>
                <Checkbox
                    checked={layer.visible}
                    onClick={LayersPanel.stopPropagation}
                    onChange={(event: any) => {
                        this.handleChangedLayerVisibility(layer, event.target.checked)
                    }}/>
                <Icon style={LayersPanel.LAYER_LABEL_ELEMENT_STYLE} icon={getLayerTypeIconName(layer)} iconSize={12}/>
                <span style={LayersPanel.LAYER_LABEL_ELEMENT_STYLE}>{getLayerDisplayName(layer)}</span>
            </div>
        );
    }

    private renderActionButtonRow() {
        const layerCount = this.props.layers ? this.props.layers.length : 0;
        const selectedLayerIndex = this.props.selectedLayerIndex;
        const selectedLayer = this.props.selectedLayer;
        const canRemoveLayer = selectedLayer && selectedLayer.id !== AUTO_LAYER_ID;
        const canMoveLayerUp = selectedLayerIndex > 0;
        const canMoveLayerDown = selectedLayerIndex >= 0 && selectedLayerIndex < layerCount - 1;
        return (
            <ButtonGroup>
                <ToolButton tooltipContent="Add a new layer"
                            intent={Intent.PRIMARY}
                            onClick={this.handleAddLayerButtonClicked}
                            icon="add"/>
                <ToolButton tooltipContent="Remove selected layer"
                            disabled={!canRemoveLayer}
                            onClick={this.handleRemoveLayerButtonClicked}
                            icon="remove"/>
                <ToolButton tooltipContent="Move layer up"
                            disabled={!canMoveLayerUp}
                            onClick={this.handleMoveLayerUpButtonClicked}
                            icon="arrow-up"/>
                <ToolButton tooltipContent="Move layer down"
                            disabled={!canMoveLayerDown}
                            onClick={this.handleMoveLayerDownButtonClicked}
                            icon="arrow-down"/>
                <LayerSourcesDialog/>
            </ButtonGroup>
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

    private renderLayerDetails() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return NO_LAYERS_EMPTY_VIEW;
        }

        if (!this.props.selectedLayer) {
            return (
                <React.Fragment>
                    <Label style={{height: '20px'}}> </Label>
                    {NO_LAYER_SELECTED}
                </React.Fragment>
            )
        }

        if (this.props.selectedImageLayer) {
            return (
                <div>
                    {this.renderDataSelectionSection()}
                    {this.renderSplitModeSection()}
                </div>
            )
        }
    }

    private renderDataSelectionSection() {
        const layer = this.props.selectedVariableImageLayer;
        const variable = this.props.selectedVariable;
        if (!layer || !variable || variable.numDims <= 2) {
            return null;
        }

        const handleChangedLayerVarIndex = (i: number, value: number) => {
            const varIndex = layer.varIndex.slice();
            varIndex[i] = value;
            this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {varIndex}) as any);
        };

        const n = variable.numDims - 2;
        const dimensionRows = [];
        for (let i = 0; i < n; i++) {
            const dimension = variable.dimNames[i];
            const max = variable.shape[i] - 1;
            if (max > 0) {
                const value = layer.varIndex[i];
                dimensionRows.push(
                    <Label key={dimension + '_index'} className="bp3-inline" style={{display: 'flex'}}>
                        <span
                            style={LayersPanel.LABEL_SPAN_STYLE_100}>{LayersPanel.capitalizeFirstLetter(dimension) + ' index'}</span>
                        <div style={{
                            ...LayersPanel.SLIDER_DIV_STYLE_10,
                            width: undefined,
                            flex: 'auto 1',
                            margin: 'auto 0'
                        }}>
                            <Slider min={0}
                                    max={max}
                                    stepSize={1}
                                    labelStepSize={max}
                                    value={value}
                                    onChange={(value: number) => handleChangedLayerVarIndex(i, value)}
                            />
                        </div>
                    </Label>
                );
            }
        }

        if (dimensionRows.length === 0) {
            return null;
        }

        return (
            <React.Fragment>
                <SubPanelHeader title="DATA SELECTION"/>
                {dimensionRows}
            </React.Fragment>
        );
    }

    private renderSplitModeSection() {
        const splitMode = this.props.selectedImageLayer.splitMode || SPLIT_MODE_OFF;
        return (
            <React.Fragment>
                <SubPanelHeader title="LAYER SPLIT"/>
                <RadioGroup
                    key="layerSplit"
                    inline={true}
                    onChange={this.handleChangedLayerSplitMode}
                    selectedValue={splitMode}
                >
                    <Radio label="Show left" value={SPLIT_MODE_LEFT}/>
                    <Radio label="Show right" value={SPLIT_MODE_RIGHT}/>
                    <Radio label="Off" value={SPLIT_MODE_OFF}/>
                </RadioGroup>
            </React.Fragment>
        );
    }
}

export default connect(mapStateToProps)(LayersPanel);

