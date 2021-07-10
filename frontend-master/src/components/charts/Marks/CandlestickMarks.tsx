import React from "react";
import {utcFormat, format, schemeSet1, ScaleBand, ScaleLinear} from 'd3';
import {Quote} from "../../../api/entities";

const formatDate = utcFormat('%B %-d, %Y');
const formatValue = format('.2f');
const formatString = format('.3s');

type Props = {
    data: Quote[],
    xScale: ScaleBand<Date>,
    yScale: ScaleLinear<number, number>,
}

export const CandlestickMarks = ({ data, xScale, yScale }: Props): React.ReactElement =>
    <>
    {
        data.map(d => (
            <g className='candlestick-mark' key={d.quote_date.getTime()} transform={`translate(${xScale(d.quote_date)},0)`}>
                <line
                    y1={yScale(d.quote_low)}
                    y2={yScale(d.quote_high)}
                />
                <line
                    y1={yScale(d.quote_open)}
                    y2={yScale(d.quote_close)}
                    strokeWidth={xScale.bandwidth()}
                    stroke={
                        d.quote_open > d.quote_close ? schemeSet1[0]
                            : d.quote_close > d.quote_open ? schemeSet1[2]
                            : schemeSet1[8]
                    }
                    data-tip={
                        `<b>${formatDate(new Date(d.quote_date))}</b><br />` +
                        `Open: $${formatValue(d.quote_open)}<br />` +
                        `Close: $${formatValue(d.quote_close)}<br />` +
                        `Low: $${formatValue(d.quote_low)}<br />` +
                        `High: $${formatValue(d.quote_high)}<br />` +
                        `Volume: ${formatString(d.quote_volume)}`
                    }
                    data-for='mark-tooltip'
                />
            </g>
        ))
    }
    </>