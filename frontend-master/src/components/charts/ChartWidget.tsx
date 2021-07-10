import * as d3 from "d3";
import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { AppState, dispatch } from "../../store";
import { performFetchStockQuotes, StockQuotesState } from "../../slices/stockQuotes";

import "./styles/charts.css";
import {CandlestickMarks} from "./Marks/CandlestickMarks";

type Props = {
    stock_symbol: string,
    specs: {
        width: number,
        height: number
    }
};

export const ChartWidget = ({
    stock_symbol,
    specs: {
        width,
        height
    }
}: Props): React.ReactElement => {
    const quotesData = useSelector<AppState, StockQuotesState>(state => state.stockQuotes);
    const token = useSelector<AppState, string | undefined>((state) => state.user.session?.token);

    useEffect(() => {
        if (!token || !stock_symbol) return;

        dispatch(performFetchStockQuotes({
            token,
            stock_symbol
        }));

    }, [token, stock_symbol]);

    const quotesList = quotesData.quotes.hasOwnProperty(stock_symbol) ? quotesData.quotes[stock_symbol] : [];

    if (quotesList.length === 0) return <div />;
    if (!token) return <div>Unauthorised</div>;

    const xScale = d3.scaleBand<Date>()
        .domain(d3.utcDay
            .range(quotesList[0].quote_date, quotesList[quotesList.length - 1].quote_date)
            .filter(d => d.getUTCDay() !== 0 && d.getUTCDay() !== 6))
        .range([0, width])
        .padding(0.2);

    const yPriceScale = d3.scaleLinear()
        .domain([d3.min(quotesList, d => d.quote_low) || 0, d3.max(quotesList, d => d.quote_high) || 0])
        .rangeRound([height, 0]);

    return <svg width={width} height={height}>
        <g>
            <CandlestickMarks
                data={quotesList}
                xScale={xScale}
                yScale={yPriceScale}
            />
        </g>
    </svg>;
}