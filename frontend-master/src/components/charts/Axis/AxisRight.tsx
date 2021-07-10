import React from "react";
import {ScaleLinear} from "d3";

type Props = {
    yScale: ScaleLinear<number, number>,
    yLength: number,
    xOffset: number,
    numTicks?: number,
    tickFormat: (x: number) => string
}

export const AxisRight = ({ yScale, yLength, xOffset = 0, numTicks, tickFormat }: Props): React.ReactElement => {
    const ticks = yScale.ticks(numTicks).map(tickValue => (
        <g
            className='axis'
            key={tickValue}
            transform={`translate(0,${yScale(tickValue)})`}
        >
            <line
                className='tick'
                x1={xOffset + 6}
                x2={xOffset}
            />
            <text
                style={{ textAnchor: 'start' }}
                x={xOffset + 12}
                dy=".32em"
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
                x1={xOffset}
                x2={xOffset}
                y2={yLength}
            />
        </>
    )
}