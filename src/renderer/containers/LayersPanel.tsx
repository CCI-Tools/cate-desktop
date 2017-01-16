import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {ExpansionPanel} from '../components/ExpansionPanel';
import {
    State, WorkspaceState, LayerState, ColorMapCategoryState, ColorMapState, ImageLayerState,
    VariableImageLayerState
} from "../state";
import {Button, Checkbox, Slider, Popover, Position, PopoverInteractionKind, Switch} from "@blueprintjs/core";
import FormEvent = React.FormEvent;
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import {Card} from "../components/Card";
import * as actions from "../actions";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";


interface ILayersPanelProps {
    dispatch?: Dispatch<State>;
    webAPIClient: any;
    workspace: WorkspaceState;
    layers: Array<LayerState>;
    selectedLayerId: string|null;
    selectedLayer: LayerState|null;
    showLayerDetails: boolean;
    colorMaps: Array<ColorMapCategoryState>;
}


function mapStateToProps(state: State): ILayersPanelProps {
    return {
        webAPIClient: state.data.appConfig.webAPIClient,
        workspace: state.data.workspace,
        layers: state.data.layers,
        selectedLayerId: state.control.selectedLayerId,
        selectedLayer: getSelectedLayer(state.data.layers, state.control.selectedLayerId),
        showLayerDetails: state.control.showLayerDetails,
        colorMaps: state.data.colorMaps,
    };
}

function getSelectedLayer(layers: Array<LayerState>|null, selectedLayerId: string|null): LayerState|null {
    return (layers || []).find(layer => layer.id === selectedLayerId);
}


/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class LayersPanel extends React.Component<ILayersPanelProps, any> {

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

        function handleChangedLayerVisibility(dispatch, itemIndex: number, show: boolean) {
            dispatch(actions.updateLayerVisibility(layers[itemIndex], show));
        }

        function handleChangedLayerSelection(dispatch, selectedLayerId: string|null) {
            dispatch(actions.setSelectedLayerId(selectedLayerId));
        }

        const renderItem = (itemIndex: number) => {
            const layer = layers[itemIndex];
            return (
                <span>
                    <Checkbox checked={layer.show}
                              onChange={(ev: FormEvent<HTMLInputElement>) => {
                                  handleChangedLayerVisibility(this.props.dispatch, itemIndex, ev.currentTarget.checked);
                                  ev.stopPropagation();
                              }}/>
                    <span className="pt-icon-layout-grid" style={{marginRight: 4}}/>
                    <span>{layer.name}</span>
                </span>
            );
        };

        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <ListBox numItems={layers.length}
                         getItemKey={index => layers[index].id}
                         renderItem={renderItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedLayerId ? [this.props.selectedLayerId] : []}
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
                        Select a layer to edit its details.
                    </p>
                </Card>
            );
        }

        return (
            <table>
                <tbody>
                {this.renderFormDisplayMinMax()}
                {this.renderFormDisplayColorBar()}
                {this.renderFormDisplayAlphaBlend()}
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
        const imageLayer = this.getSelectedVariableImageLayer();
        if (!imageLayer) {
            return null;
        }

        function handleChangedColorMapName(dispatch, colorMapName: string) {
            dispatch(actions.updateLayer(Object.assign({}, imageLayer, {colorMapName})));
        }

        const selectedColorMapName = imageLayer.colorMapName;

        let comp = null;
        if (this.props.colorMaps) {
            let selectedColorMapImage = null;
            const colorMapNames = [];
            const colorMapImages = [];
            for (let cat of this.props.colorMaps) {
                for (let cm of cat.colorMaps) {
                    const colorMapName = cm.name;
                    const colorMapImage = (
                        <img src={`data:image/png;base64,${cm.imageData}`}
                             alt={colorMapName}
                             width="100%"
                             height="14px"/>
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

    private renderFormDisplayMinMax() {
        const imageLayer = this.getSelectedVariableImageLayer();
        if (!imageLayer) {
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
            dispatch(actions.updateLayer(Object.assign({}, imageLayer, {displayMin})));
        }

        function handleChangedDisplayMax(dispatch, displayMaxText: string) {
            let displayMax;
            try {
                displayMax = parseFloat(displayMaxText);
            } catch (e) {
                // Do not change
                return;
            }
            dispatch(actions.updateLayer(Object.assign({}, imageLayer, {displayMax})));
        }

        return (
            <tr key="displayMinMax">
                <td>Value range</td>
                <td style={{width: "100%"}}>
                    <input className="pt-input" type="text" style={{width: "6em", textAlign: "right"}}
                           value={imageLayer.displayMin}
                           onChange={(ev: any) => handleChangedDisplayMin(this.props.dispatch, ev.target.value)} placeholder="From"/>
                    <input className="pt-input" type="text" style={{width: "6em", textAlign: "right"}}
                           value={imageLayer.displayMax}
                           onChange={(ev: any) => handleChangedDisplayMax(this.props.dispatch, ev.target.value)} placeholder="To"/>
                </td>
            </tr>
        );
    }

    private renderFormDisplayAlphaBlend() {
        const imageLayer = this.getSelectedVariableImageLayer();
        if (!imageLayer) {
            return null;
        }
        function handleChangedDisplayAlphaBlend(dispatch, displayAlphaBlend: boolean) {
            dispatch(actions.updateLayer(Object.assign({}, imageLayer, {displayAlphaBlend})));
        }

        return (
            <tr key="displayAlphaBlend">
                <td colSpan={2}>
                    <Switch label="Color bar alpha blending"
                            checked={imageLayer.alphaBlending}
                            onChange={(ev: any) => handleChangedDisplayAlphaBlend(this.props.dispatch, ev.target.checked)}/>
                </td>
            </tr>
        );
    }

    private renderFormImageEnhancement(key: string, label: string, min: number, max: number) {
        const imageLayer = this.getSelectedImageLayer();
        if (!imageLayer) {
            return null;
        }

        function handleChangedImageEnhancement(dispatch, name: string, value: number) {
            dispatch(actions.updateLayerImageEnhancement(imageLayer, name, value));
        }

        return (
            <tr key={key}>
                <td>{label}</td>
                <td style={{width: "100%"}}>
                    <Slider renderLabel={false}
                            min={min}
                            max={max}
                            stepSize={(max - min) / 20.}
                            value={imageLayer.imageEnhancement[key]}
                            onChange={(value: number) => handleChangedImageEnhancement(this.props.dispatch, key, value)}/>
                </td>
            </tr>
        );
    }


    private getSelectedImageLayer(): ImageLayerState|null {
        if (this.props.selectedLayer
            && (this.props.selectedLayer.type === 'Image' || this.props.selectedLayer.type === 'VariableImage')) {
            return this.props.selectedLayer as ImageLayerState;
        }
        return null;
    }

    private getSelectedVariableImageLayer(): VariableImageLayerState|null {
        if (this.props.selectedLayer
            && this.props.selectedLayer.type === 'VariableImage') {
            return this.props.selectedLayer as VariableImageLayerState;
        }
        return null;
    }
}

export default connect(mapStateToProps)(LayersPanel);
