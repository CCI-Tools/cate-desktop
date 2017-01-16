import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import FormEvent = React.FormEvent;
import {ListBox} from "../components/ListBox";
import {State, ColorMapCategoryState, ColorMapState} from "../state";
import * as actions from "../actions";
import {ExpansionPanel} from "../components/ExpansionPanel";
import {Tooltip} from "@blueprintjs/core";
//import {Tooltip} from '@blueprintjs/core';


function findColorMap(colorMaps: Array<ColorMapCategoryState>, name: string): ColorMapState {
    for (let category of colorMaps) {
        const colorMap = category.colorMaps.find(cm => cm.name === name);
        if (colorMap) {
            return colorMap;
        }
    }
    return null;
}


interface IColorBarsPanelProps {
    dispatch?: Dispatch<State>;
    colorMaps: Array<ColorMapCategoryState>;
    selectedColorMapName: string|null;
}


function mapStateToProps(state: State): IColorBarsPanelProps {
    return {
        colorMaps: state.data.colorMaps,
        selectedColorMapName: state.control.selectedColorMapName,
    };
}

/**
 * The ColorBarsPanel is used to select and browse available color bars.
 *
 * @author Norman Fomferra
 */
class ColorBarsPanel extends React.Component<IColorBarsPanelProps, any> {

    componentDidMount() {
        if (!this.props.colorMaps) {
            this.props.dispatch(actions.loadColorMaps());
        }
    }

    private getSelectedColorMap(): ColorMapState {
        return findColorMap(this.props.colorMaps, this.props.selectedColorMapName);
    }

    render() {
        console.log(this.props.colorMaps);

        let children: Array<JSX.Element> = [];
        if (this.props.colorMaps) {
            const renderItem = (colorMap: ColorMapState) => {
                const imageData = colorMap.imageData;
                return (
                    // Waiting for @blueprint/core issue #478
                    <Tooltip content={colorMap.name}>
                        <img src={`data:image/png;base64,${colorMap.imageData}`}
                             alt={colorMap.name}
                             width="100%"
                             height="16px"/>
                    </Tooltip>
                );
            };

            let k = 0;
            for (let category of this.props.colorMaps) {
                const colorMaps = category.colorMaps;
                // Waiting for @blueprint/core issue #478
                //children.push(<Tooltip content={category.description}><h5>{category.name}</h5></Tooltip>);
                children.push(
                    <p key={k++} style={{marginTop: "0.5em", marginBottom: "0.5em"}}>
                        {category.name}
                    </p>);
                children.push(<ListBox key={k++}
                                       numItems={colorMaps.length}
                                       getItemKey={i => category.colorMaps[i].name}
                                       renderItem={i => renderItem(colorMaps[i])}
                                       itemStyle={{lineHeight: 0}}
                />);
            }
        }

        return (
            <ExpansionPanel icon="pt-icon-tint" text="Colour Bars" isExpanded={true} defaultHeight={400}>
                {children}
            </ExpansionPanel>
        );
    }
}

export default connect(mapStateToProps)(ColorBarsPanel);
