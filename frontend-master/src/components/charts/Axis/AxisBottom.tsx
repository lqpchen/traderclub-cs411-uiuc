import { ScaleBand } from "d3";
import React from "react"

type Props = {
    xScale: ScaleBand<Date>,
    xLength: number,
    filterCondition: (d: Date) => boolean,
    bandwidthOffset?: number,
    yOffset: number,
    axisLine?: boolean,
    tickFormat: (x: Date) => string
}

export const AxisBottom = (props: Props): React.ReactElement => {
    const {xScale, xLength, filterCondition, bandwidthOffset, yOffset, axisLine, tickFormat} = props;
    const ticks = xScale.domain()
        .filter(v => filterCondition(new Date(v)))
        .map((tickValue) => (
            <g
                className='axis' key={tickValue.toString()}
                transform={`translate(${xScale(tickValue)},0)`}
            >
                {axisLine && <line y2={yOffset} />}
                <line
                    className='tick'
                    y1={yOffset}
                    y2={yOffset + 6}
                />
                <text
                    style={{ textAnchor: 'middle' }}
                    dy=".71em"
                    y={yOffset + 14}
                >
                    {tickFormat(tickValue)}
                </text>
            </g>
        ))

    return (
        <>
            {ticks}
            <line
                className='axis-border'
                y1={yOffset}
                y2={yOffset}
                x1={-(bandwidthOffset||0)}
                x2={xLength + (bandwidthOffset||0)}
            />
        </>
    )
}