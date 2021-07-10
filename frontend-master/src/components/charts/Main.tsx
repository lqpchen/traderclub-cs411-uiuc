import * as d3 from "d3";
import React from "react";

import { AxisBottom } from './Axis/AxisBottom';
import { AxisLeft } from './Axis/AxisLeft';
import { AxisRight } from './Axis/AxisRight';
import { CandlestickMarks } from './Marks/CandlestickMarks';
import { EventMarks } from './Marks/EventMarks';
import { VolumeMarks } from './Marks/VolumeMarks';
import {Quote, StockArticle} from "../../api/entities";

const yAxisLabelOffset = 60;

const leftAxisTickFormat = d3.format('$~f');
const rightAxisTickFormat = d3.format('~s');
const bottomAxisTickFormat = d3.utcFormat('%-m/%-d');

export type MainSpecs = {
    width: number,
    height: number,
    margin: {
        left: number,
        right: number,
        top: number,
        bottom: number
    }
}

type Props = {
    slicedData: Quote[],
    articles: StockArticle[],
    specs: MainSpecs
}

export function Main(props: Props): React.ReactElement {
    const {slicedData, articles, specs: { width, height, margin }} = props;
    const innerWidth = width- margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleBand<Date>()
        .domain(d3.utcDay
            .range(slicedData[0].quote_date, slicedData[slicedData.length - 1].quote_date)
            .filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6))
        .range([0, innerWidth])
        .padding(0.2);

    const yPriceScale = d3.scaleLinear()
        .domain([d3.min(slicedData, d => d.quote_low) || 0, d3.max(slicedData, d => d.quote_high) || 0 ])
        .rangeRound([innerHeight, 0])
        .nice();

    const yVolumeScale = d3.scaleLinear()
        .domain([0, d3.max(slicedData, d => d.quote_volume) || 0])
        .rangeRound([innerHeight, 0])
        .nice();

    const getOnlyMonday = (d: Date) => d.getUTCDay() === 1;

    return (
        <g transform={`translate(${margin.left},${margin.top})`}>
            <AxisBottom
                xScale={xScale}
                xLength={innerWidth}
                filterCondition={getOnlyMonday}
                yOffset={innerHeight}
                bandwidthOffset={xScale.bandwidth() / 2}
                axisLine={true}
                tickFormat={bottomAxisTickFormat}
            />
            <AxisLeft
                numTicks={1}
                yScale={yPriceScale}
                yLength={innerHeight}
                xOffset={-xScale.bandwidth() / 2}
                tickFormat={leftAxisTickFormat}
            />
            <text
                className='axis-label'
                textAnchor='middle'
                transform={`translate(${-yAxisLabelOffset},${innerHeight / 2}) rotate(-90)`}
            >
                Price
            </text>
            <AxisRight
                yScale={yVolumeScale}
                yLength={innerHeight}
                xOffset={innerWidth + xScale.bandwidth() / 2}
                tickFormat={rightAxisTickFormat}
            />
            <text
                className='axis-label'
                textAnchor='middle'
                transform={`translate(${innerWidth + yAxisLabelOffset},${innerHeight / 2}) rotate(90)`}
            >
                Volume
            </text>
            <VolumeMarks
                data={slicedData}
                xScale={xScale}
                yScale={yVolumeScale}
                innerHeight={innerHeight}
            />
            <CandlestickMarks
                data={slicedData}
                xScale={xScale}
                yScale={yPriceScale}
            />
            <EventMarks
                data={articles}
                xScale={xScale}
                innerHeight={innerHeight}
            />
        </g>
    )
}