import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';

import { AxisBottom } from './Axis/AxisBottom';
import { AxisLeft } from './Axis/AxisLeft';
import { LineMarks } from './Marks/LineMarks';
import React from 'react';
import {ScaleBand} from "d3";
import {Quote} from "../../api/entities";

const yAxisLabelOffset = 60;

const leftAxisTickFormat = d3.format('$~f');
const bottomAxisTickFormat = d3.utcFormat('%Y');

const scaleBandInvert = (scale: ScaleBand<Date>) => {
    const domain = scale.domain();
    const paddingOuter = scale(domain[0]);
    const eachBand = scale.step();
    return ((value: number) => {
        const index = Math.floor(((value - (paddingOuter||0)) / eachBand));
        return domain[Math.max(0, Math.min(index, domain.length - 1))];
    })
}

type Props = {
    data: Quote[],
    specs: {
        width: number,
        brushSize: number,
        height: number,
        margin: {
            top: number,
            bottom: number,
            left: number,
            right: number
        },
        yAxisNumTicks: number
    },
    initialBrushExtent: Date[],
    setBrushExtent: (value: Date[]) => void

}

export const Brush = ({
    data,
    specs: { width, height, margin, yAxisNumTicks },
    initialBrushExtent,
    setBrushExtent
}: Props): React.ReactElement => {
    const brushRef = useRef<any>();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = useMemo(
        () => d3.scaleBand<Date>()
            .domain(
                d3.utcDay
                    .range(data[0].quote_date, data[data.length - 1].quote_date)
                    .filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
            )
            .range([0, innerWidth])
            .padding(0.2)
        , [data, innerWidth]
    );

    const yPriceScale = useMemo(
        () => d3.scaleLinear()
            .domain([0, d3.max(data, d => d.quote_high) || 0])
            .range([innerHeight, 0])
            .nice()
        , [data, innerHeight]
    );

    useEffect(() => {
        const brush = d3.brushX()
            .extent([[0, 0], [innerWidth, innerHeight]])
            .on('brush', (event) => {
                if (event.selection) {
                    setBrushExtent(event.selection && event.selection.map(scaleBandInvert(xScale)))
                }
            });
        const brushObj = d3.select(brushRef.current);
        brush(brushObj);
        brush.move(brushObj as any, [
            xScale(initialBrushExtent[0]) || 0,
            xScale(initialBrushExtent[1]) || 0
        ]);
    }, [xScale, innerWidth, innerHeight]);

    const getFirstMondayOfYear = (d: Date) => {
        return (d.getUTCDay() === 1) && (d.getUTCDate() <= 7) && (d.getUTCMonth() === 0)
    }

    return (
        <g transform={`translate(${margin.left},${margin.top})`}>
            <LineMarks
                data={data}
                xScale={xScale}
                yScale={yPriceScale}
            />
            <AxisBottom
                xScale={xScale}
                xLength={innerWidth}
                yOffset={innerHeight}
                filterCondition={getFirstMondayOfYear}
                tickFormat={bottomAxisTickFormat}
            />
            <AxisLeft
                xOffset={innerWidth}
                yScale={yPriceScale}
                yLength={innerHeight}
                numTicks={yAxisNumTicks}
                tickFormat={leftAxisTickFormat}
            />
            <text
                className='axis-label'
                textAnchor='middle'
                transform={`translate(${-yAxisLabelOffset},${innerHeight / 2}) rotate(-90)`}
            >
                Price
            </text>
            <g ref={brushRef} />
        </g>
    )
}