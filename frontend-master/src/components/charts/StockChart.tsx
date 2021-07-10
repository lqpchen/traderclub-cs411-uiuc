import { useState, useEffect } from "react";
import ReactTooltip from "react-tooltip";

import "./styles/charts.css";
import {Main, MainSpecs} from "./Main"
import { Brush } from "./Brush"
import React from "react";
import {useSelector} from "react-redux";
import {AppState, dispatch} from "../../store";
import {performFetchStockQuotes, StockQuotesState} from "../../slices/stockQuotes";
import {StockArticlesState} from "../../slices/stockArticles";

type Props = {
    stock_symbol: string,
    specs: {
        totalWidth: number,
        totalHeight: number,
        separationRatio: number,
        brushSpecs: {
            brushSize: number,
            margin: { top: number, right: number, bottom: number, left: number },
            yAxisNumTicks: number
        },
        mainChartSpecs: MainSpecs
    }
};

export const StockChart = ({
    stock_symbol,
    specs: {
        totalWidth,
        totalHeight,
        separationRatio,
        brushSpecs,
        mainChartSpecs
    }
}: Props): React.ReactElement => {
    const quotesData = useSelector<AppState, StockQuotesState>(state => state.stockQuotes);
    const stockArticlesData = useSelector<AppState, StockArticlesState>(state => state.stockArticles);
    const [brushExtent, setBrushExtent] = useState<Date[]>([]);
    const token = useSelector<AppState, string|undefined>((state) => state.user.session?.token);

    useEffect(() => {
        if (!token || !stock_symbol) return;

        dispatch(performFetchStockQuotes({
            token,
            stock_symbol
        }));

        ReactTooltip.rebuild();
    }, [token, stock_symbol]);

    const quotesList = quotesData.quotes.hasOwnProperty(stock_symbol) ? quotesData.quotes[stock_symbol] : [];

    if (quotesList.length === 0) return <div/>;
    if (!token) return <div>Unauthorised</div>;

    const initialBrushExtent: Date[] = [
        quotesList[quotesList.length - brushSpecs.brushSize].quote_date,
        quotesList[quotesList.length - 1].quote_date
    ];

    const slicedData = brushExtent && brushExtent.length > 0 ?
        quotesList.filter(d => (d.quote_date > brushExtent[1]) && (d.quote_date < brushExtent[0])) :
        quotesList.filter(d => (d.quote_date > initialBrushExtent[0]) && (d.quote_date < initialBrushExtent[1]));

    return (
        <>
            <svg width={totalWidth} height={totalHeight}>
                <Main
                    articles={stockArticlesData.paginated?.results || []}
                    slicedData={slicedData}
                    specs={{
                        ...mainChartSpecs,
                        width: totalWidth,
                        height: totalHeight * separationRatio
                    }}
                />
                <g transform={`translate(0,${totalHeight * separationRatio})`}>
                    <Brush
                        data={quotesList}
                        specs={{
                            ...brushSpecs,
                            width: totalWidth,
                            height: totalHeight * (1 - separationRatio)
                        }}
                        initialBrushExtent={initialBrushExtent}
                        setBrushExtent={setBrushExtent}
                    />
                </g>
            </svg>
            <ReactTooltip id="mark-tooltip" place="right" effect="solid" html={true} />
        </>
    )
}