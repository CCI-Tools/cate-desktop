import * as React from 'react';
import {RangeSlider, NumberRange} from "@blueprintjs/core";
import {formatMillisAsISODateString} from "../../common/format";

interface ITimeRangeProps {
    coverage: NumberRange|null;
    value: NumberRange|null;
    onChange: (range: NumberRange) => void;
}

const MILLIS_A_DAY = 1000 * 60 * 60 * 24;

export function TimeRange(props: ITimeRangeProps) {
    if (props.coverage) {
        const startMillis = props.coverage[0];
        const endMillis = props.coverage[1];
        if (startMillis && endMillis && startMillis < endMillis) {
            const stepSize = (endMillis - startMillis) / 4;
            return (
                <div style={{ width: "100%", padding: 10}}>
                    <RangeSlider
                        min={startMillis}
                        max={endMillis}
                        stepSize={MILLIS_A_DAY}
                        labelStepSize={stepSize}
                        onChange={props.onChange}
                        value={props.value}
                        renderLabel={formatMillisAsISODateString}
                    />
                </div>
            );
        } else {
            return (
                <div style={{ width: "100%", padding: 10}}>
                    No time information available.
                </div>
            );
        }
    } else {
        return (
            <div style={{ width: "100%", padding: 10}}>
                Loading time coverage...
            </div>
        );
    }
}


