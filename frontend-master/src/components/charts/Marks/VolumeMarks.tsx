import React from "react";
import {ScaleBand, ScaleLinear} from "d3";
import {Quote} from "../../../api/entities";

type Props = {
    data: Quote[],
    xScale: ScaleBand<Date>,
    yScale: ScaleLinear<number, number>,
    innerHeight: number
}

export const VolumeMarks = ({ data, xScale, yScale, innerHeight }: Props): React.ReactElement =>
    <>
        {
            data.map(d => (
                <rect
                    className='volume-mark'
                    key={d.quote_date.getTime()}
                    x={(xScale(d.quote_date) || 0) - xScale.bandwidth() / 2}
                    y={yScale(d.quote_volume)}
                    width={xScale.bandwidth()}
                    height={innerHeight - yScale(d.quote_volume)}
                />
            ))
        }
    </>;