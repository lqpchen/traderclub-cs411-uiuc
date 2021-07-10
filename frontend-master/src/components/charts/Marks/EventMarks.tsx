import React from "react";
import {ScaleBand} from "d3";
import {StockArticle} from "../../../api/entities";

type Props = {
    data: StockArticle[],
    xScale: ScaleBand<Date>,
    innerHeight: number
};

export const EventMarks = ({ data, xScale, innerHeight }: Props): React.ReactElement => {
    return <>
        {
            data.filter(v => !!v.headline)
                .map((d, k) => {
                    const xOffset = xScale(d.release_date);
                    if (!xOffset) return <></>;

                    return <g
                        key={k}
                        transform={`translate(${xOffset},${innerHeight}) scale(0.025,-0.025)`}
                        fill="#000000"
                        stroke="none"
                        data-tip={d.headline}
                        data-for='mark-tooltip'
                        onClick={() => window.open(d.url, "_blank")}
                    >
                        <path
                            d="M500 1394 c-132 -35 -260 -153 -334 -306 -65 -136 -80 -207 -80 -368 0 -161 15 -232 80 -368 95 -197 266 -322 444 -322 220 0 427 193 502 468 30 110 30 334 0 445 -46 166 -161 330 -284 404 -99 60 -217 77 -328 47z m260 -490 c0 -27 -4 -43 -10 -39 -5 3 -10 11 -10 17 0 6 -7 20 -17 30 -13 14 -31 18 -95 18 l-78 0 0 -90 0 -91 67 3 c64 3 69 5 83 33 l15 30 3 -37 c2 -21 2 -55 0 -75 l-3 -38 -15 30 c-14 28 -19 30 -83 33 l-68 3 3 -93 3 -93 55 -3 c90 -5 117 4 147 49 14 22 28 37 30 35 3 -3 -3 -27 -12 -55 l-17 -51 -171 1 c-125 1 -163 3 -139 10 l32 10 0 194 0 194 -32 10 c-24 7 14 9 140 10 l172 1 0 -46z"/>
                    </g>
                })
        }
    </>
}