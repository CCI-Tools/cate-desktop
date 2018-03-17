import * as React from 'react';
import {connect, DispatchProp} from 'react-redux';
import {
    ColorMapCategoryState,
    ImageLayerState,
    LayerState,
    State,
    VariableImageLayerState,
    VariableState
} from '../state';
import {Position, Radio, RadioGroup, Slider} from '@blueprintjs/core';
import {ListBox, ListBoxSelectionMode} from '../components/ListBox';
import * as actions from '../actions';
import * as selectors from '../selectors';
import {ContentWithDetailsPanel} from '../components/ContentWithDetailsPanel';
import LayerSourcesDialog from './LayerSourcesDialog';
import {getLayerDisplayName, getLayerTypeIconName, AUTO_LAYER_ID} from '../state-util';
import {ScrollablePanelContent} from '../components/ScrollableContent';
import {ViewState} from '../components/ViewState';
import {NO_LAYER_SELECTED, NO_LAYERS_EMPTY_VIEW, NO_LAYERS_NO_VIEW} from '../messages';
import {SubPanelHeader} from '../components/SubPanelHeader';
import {ToolButton} from "../components/ToolButton";

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

    componentDidMount(): void {
        if (!this.props.colorMapCategories) {
            this.props.dispatch(actions.loadColorMaps());
        }
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
        this.props.dispatch(actions.updateLayer(this.props.activeView.id, layer, {visible}));
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

    private static getLayerItemKey(layer: LayerState) {
        return layer.id;
    }

    private static stopPropagation(event) {
        event.stopPropagation();
    }

    private static capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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
                                         contentHeight={this.props.layerListHeight}
                                         onContentHeightChange={this.handleListHeightChanged}
                                         actionComponent={this.renderActionButtonRow()}>
                    {this.renderLayersList()}
                    {this.renderLayerDetails()}
                </ContentWithDetailsPanel>
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
            <div className="pt-button-group">
                <ToolButton tooltipContent="Add a new layer" tooltipPosition={Position.LEFT}
                            className="pt-intent-primary"
                            onClick={this.handleAddLayerButtonClicked}
                            iconName="add"/>
                <ToolButton tooltipContent="Remove selected layer" tooltipPosition={Position.LEFT}
                            disabled={!canRemoveLayer}
                            onClick={this.handleRemoveLayerButtonClicked}
                            iconName="remove"/>
                <ToolButton tooltipContent="Move layer up" tooltipPosition={Position.LEFT}
                            disabled={!canMoveLayerUp}
                            onClick={this.handleMoveLayerUpButtonClicked}
                            iconName="arrow-up"/>
                <ToolButton tooltipContent="Move layer down" tooltipPosition={Position.LEFT}
                            disabled={!canMoveLayerDown}
                            onClick={this.handleMoveLayerDownButtonClicked}
                            iconName="arrow-down"/>
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

    private renderLayerDetails() {
        const layers = this.props.layers;
        if (!layers || !layers.length) {
            return NO_LAYERS_EMPTY_VIEW;
        }

        if (!this.props.selectedLayer) {
            return (
                <React.Fragment>
                    <label className="pt-label" style={{height: '20px'}}> </label>
                    {NO_LAYER_SELECTED}
                </React.Fragment>
            )
        }

        if (this.props.selectedImageLayer) {
            return (
                <div>
                    <SubPanelHeader title="DATA SELECTION"/>
                    {this.renderVariableIndexers()}
                    <SubPanelHeader title="LAYER SPLIT"/>
                    {this.renderSplitMode()}
                </div>
            )
        }
    }

    private renderVariableIndexers() {
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
                    <label key={dimension + '_index'} className="pt-label pt-inline" style={{display: 'flex'}}>
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
                    </label>
                );
            }
        }
        return dimensionRows;
    }

    private renderSplitMode() {
        const splitMode = this.props.selectedImageLayer.splitMode || null;
        return (
            <RadioGroup
                key="layerSplit"
                label="Split mode"
                onChange={this.handleChangedLayerSplitMode}
                selectedValue={splitMode}
            >
                <Radio label="No split" value={null}/>
                <Radio label="Left" value="left"/>
                <Radio label="Right" value="right"/>
            </RadioGroup>
        );
    }
}

export default connect(mapStateToProps)(LayersPanel);

