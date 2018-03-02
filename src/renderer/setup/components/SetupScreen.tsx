import * as React from 'react';
import {Button, Intent} from "@blueprintjs/core";


interface ISetupScreenProps {
    title: string;
    panel: React.ReactChild;
    noBackButton?: boolean;
    noNextButton?: boolean;
    backButtonDisabled?: boolean;
    nextButtonDisabled?: boolean;
    nextButtonLabel?: string;
    nextButtonIcon?: string;
    nextButtonIntent?: Intent;
    onBackButtonClick?: () => void;
    onNextButtonClick?: () => void;
    onCancelClick: () => void;
}

export class SetupScreen extends React.PureComponent<ISetupScreenProps> {
    static readonly headerHeight = "34px";
    static readonly footerHeight = "52px";
    static readonly middleHeight = `calc(100% - ${SetupScreen.headerHeight} - ${SetupScreen.footerHeight})`;

    static readonly headerStyle: React.CSSProperties = {
        fontSize: "1.1em",
        fontWeight: "bold",
        height: SetupScreen.headerHeight,
        lineHeight: SetupScreen.headerHeight,
        backgroundColor: "#EEEEEE",
        paddingLeft: 10
    };

    static readonly footerStyle: React.CSSProperties = {
        height: SetupScreen.footerHeight,
        margin: 0,
        padding: 10,
        display: "flex",
        justifyContent: "flex-end"
    };

    static readonly middleStyle: React.CSSProperties = {
        height: SetupScreen.middleHeight,
        margin: 0,
        padding: 10
    };

    static readonly containerStyle: React.CSSProperties = {
        height: "100%",
        margin: 0,
        padding: 0
    };

    render(): React.ReactNode {

        let backButton;
        if (!this.props.noBackButton) {
            backButton = <Button style={{marginRight: 2}}
                                 iconName="arrow-left"
                                 text="Back"
                                 intent={Intent.PRIMARY}
                                 disabled={this.props.backButtonDisabled}
                                 onClick={this.props.onBackButtonClick}/>;
        }

        let nextButton;
        if (!this.props.noNextButton) {
            nextButton = <Button style={{marginRight: 24}}
                                 rightIconName={this.props.nextButtonIcon as any || "arrow-right"}
                                 text={this.props.nextButtonLabel || "Next"}
                                 intent={this.props.nextButtonIntent || Intent.PRIMARY}
                                 disabled={this.props.nextButtonDisabled}
                                 onClick={this.props.onNextButtonClick}/>;
        }

        const cancelButton = <Button text="Cancel"
                                     onClick={this.props.onCancelClick}/>;

        return (
            <div style={SetupScreen.containerStyle}>
                <div style={SetupScreen.headerStyle}>{this.props.title}</div>
                <div style={SetupScreen.middleStyle}>{this.props.panel}</div>
                <div style={SetupScreen.footerStyle}>{backButton}{nextButton}{cancelButton}</div>
            </div>
        );
    }
}

