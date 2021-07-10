import {area, curveNatural, ScaleBand, ScaleLinear} from 'd3';
import React from 'react';
import {Quote} from "../../../api/entities";

type Props = {
    data: Quote[],
    xScale: ScaleBand<Date>,
    yScale: ScaleLinear<number, number>
}

export const LineMarks = ({ data, xScale, yScale }: Props): React.ReactElement => {
    return <path
        className='line-mark'
        d={
            area<Quote>()
            .x(d => xScale(d.quote_date) || 0)
            .y0(yScale(0))
            .y1(d => yScale(d.quote_close))
            .curve(curveNatural)(data) || ""
        }
    />
}