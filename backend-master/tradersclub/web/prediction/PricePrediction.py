"""
simplified logic fit into the stoc-proc-like script
need to pip install all the packages listed in the import section
need to fill in some code in the place marked by 'to do' from line 74
"""
import logging

import numpy as np
import pandas as pd
from sklearn import preprocessing
from sklearn.linear_model import LinearRegression

# =============================================================================
# import packages
# =============================================================================
from tradersclub.web.daos.QuoteDAO import QuoteDAO
from tradersclub.web.prediction.PricePredictionResult import PricePredictionResult


# =============================================================================
# parameters passed into stoc proc
# =============================================================================


class PricePrediction:
    @staticmethod
    def features():
        return ['adj_sma',
                'bb_val',
                'rsi',
                'std',
                'momentum',
                'dow_2', 'dow_3', 'dow_4',
                'dow_5',
                'rel_vol',
                # 'range',
                'oc_diff',
                'green_rate',
                'col',
                'dret'
                ]

    @staticmethod
    def get_data_frame(stock_symbol: str, quotes):

        quotes_dictionary = {
            "Date": list(map(lambda quote: quote.quote_date, quotes)),
            "Open": list(map(lambda quote: quote.quote_open, quotes)),
            "High": list(map(lambda quote: quote.quote_high, quotes)),
            "Low": list(map(lambda quote: quote.quote_low, quotes)),
            "Close": list(map(lambda quote: quote.quote_close, quotes)),
            "Volume": list(map(lambda quote: quote.quote_high, quotes))
        }
        df = pd.DataFrame.from_dict(quotes_dictionary)
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.set_index('Date')
        if 'Adj Close' not in df.columns:
            df['Adj Close'] = df['Close']

        # Debug code:
        # print(df.info())
        # csv_df = pd.read_csv(PROJECT_ROOT + '/data/ohlc/{}.csv'.format(stock_symbol),
        #                      index_col='Date', parse_dates=True)
        # if 'Adj Close' not in csv_df.columns:
        #     csv_df['Adj Close'] = csv_df['Close']
        # print(csv_df.info())
        return df

    @staticmethod
    def fill_missing_values(df):
        df.fillna(method='ffill', inplace=True)
        df.fillna(method='bfill', inplace=True)

    @staticmethod
    def get_rolling_mean(df, window):
        return df.rolling(window).mean()

    @staticmethod
    def get_rolling_std(df, window):
        return df.rolling(window).std()

    @staticmethod
    def get_bollinger_bands(rm, rstd):
        upper_band = rm + 2 * rstd
        lower_band = rm - 2 * rstd
        return upper_band, lower_band

    @staticmethod
    def data_preparation(sym, quotes, ylab='dret', yr=4, pred_date='2000-01-01'):
        '''
        ylab can take value from 'dret' (daily return) or 'oc_diff' (intra day return / open close difference) %
        yr is the number of years of the trading data to read
        pred_date is the date we want to predict the ylab
        '''

        df = PricePrediction.get_data_frame(sym, quotes)[-yr * 252:]
        PricePrediction.fill_missing_values(df)

        # df = df[['Adj Close', 'Volume']]
        df = df.rename(columns={'Adj Close': 'price', 'Volume': 'vol'})
        df['sma'] = PricePrediction.get_rolling_mean(df, 20)['price']
        df['std'] = PricePrediction.get_rolling_std(df, 20)['price']

        upperb, lowerb = PricePrediction.get_bollinger_bands(df['sma'], df['std'])
        df['upperb'] = upperb
        df['lowerb'] = lowerb

        df['adj_sma'] = df['price'] / df['sma']
        df['bb_val'] = (df['price'] - df['sma']) / (2 * df['std'])
        df['momentum'] = df['price'] / df['price'].shift(5) - 1
        df['avg_vol'] = df['vol'].rolling(3 * 22).mean()
        df['rel_vol'] = df['vol'] / df['avg_vol']

        df['dret'] = df['price'] / df['price'].shift(1) - 1
        pos_dret, neg_dret = df['dret'].copy(), df['dret'].copy()
        pos_dret[pos_dret < 0] = np.nan
        neg_dret[neg_dret > 0] = np.nan
        pos_dret = pos_dret.rolling(14, min_periods=1).mean()
        neg_dret = neg_dret.rolling(14, min_periods=1).mean().abs()
        df['rsi'] = 100 - 100 / (pos_dret / neg_dret + 1)

        df['dow'] = df.index.dayofweek
        df = df[df['dow'] < 5]
        enc = preprocessing.OneHotEncoder(drop='first')
        enc.fit(df[['dow']])
        dow_label = enc.transform(df[['dow']]).toarray()
        df[['dow_2', 'dow_3', 'dow_4', 'dow_5']] = dow_label

        df['col'] = df['Open'] < df['Close']
        df['green_rate'] = df['col'].rolling(7).mean()
        # df['oc_diff'] = np.abs(df['Close'] - df['Open'])/df['Open']
        df['oc_diff'] = (df['Close'] - df['Open']) / df['Open']
        df['range'] = (df['High'] - df['Low']) / df['Open']

        features = ['adj_sma', 'bb_val', 'rsi', 'std', 'momentum', 'rel_vol',
                    'dow_2', 'dow_3', 'dow_4', 'dow_5', 'green_rate', 'col',
                    'oc_diff', 'range', 'dret']
        X = df[features]
        PricePrediction.fill_missing_values(X)

        y = df[[ylab]].shift(-1)
        PricePrediction.fill_missing_values(y)

        # pred_date = '2021-03-26'
        X = X.loc[:pred_date]
        y = y.loc[:pred_date]

        return X[:-1], y[:-1], X.iloc[-1:]

    @staticmethod
    ### rolling performance
    def rolling_performance(X, y, test_size=100, window=100, plot=False):
        # data cleaning
        # X = X[features]
        X = (X - X.mean()) / X.std()  # normalization
        PricePrediction.fill_missing_values(X)
        PricePrediction.fill_missing_values(y)
        PricePrediction.fill_missing_values(y)

        # data split
        # test_size = 50
        train_rows = X.shape[0] - test_size
        test_y = y.iloc[train_rows:, :]

        pred_y = np.zeros(test_size)
        pred_y = np.zeros(test_size)

        for i in range(0, test_size):  # i = 0
            try:
                reg = LinearRegression().fit(X[-1 * test_size + i - window: -1 * test_size + i],
                                             y[-1 * test_size + i - window: -1 * test_size + i])
                pred_y[i] = reg.predict(X.iloc[-1 * test_size + i, :].values.reshape(1, -1))[0][0]
            except Exception as e:
                print('the {}-th iteration got issue: {}'.format(i, e))
                break

        ratio = np.mean(pred_y * test_y.values.T > 0)
        long_ratio = np.mean(pred_y[pred_y > 0] * test_y[pred_y > 0].values.T > 0)
        short_ratio = np.mean(pred_y[pred_y < 0] * test_y[pred_y < 0].values.T > 0)
        return ratio, long_ratio, short_ratio

    @staticmethod
    def obtain_metrics(sym, pred_date, quotes, target='oc_diff'):
        candidate_df = pd.DataFrame(
            columns=['symbol', 'ratio', 'long_ratio', 'short_ratio', 'window_size', 'pred_return']
        )
        print('processing {}...'.format(sym))
        X, y, xnew = PricePrediction.data_preparation(sym, quotes, target, 5, pred_date)
        metric = {'symbol': sym, 'long_ratio': 0, 'window_size': 50}
        for window_size in np.arange(50, 501, 50):
            ratio, long_ratio, short_ratio = PricePrediction.rolling_performance(X, y, 50, window_size, True)
            # print(ratio, long_ratio, short_ratio, window_size)
            if long_ratio > metric['long_ratio']:
                metric['long_ratio'] = long_ratio
                metric['ratio'] = ratio
                metric['short_ratio'] = short_ratio
                metric['window_size'] = window_size

        # if metric['long_ratio'] > 0.5 and metric['ratio'] > 0:
        reg = LinearRegression().fit(X[-1 * metric['window_size']:][PricePrediction.features()],
                                     y[-1 * metric['window_size']:])
        metric['pred_return'] = reg.predict(xnew[PricePrediction.features()])[0][0]

        return metric

    # =============================================================================
    # main function for the stoc proc
    # =============================================================================
    @staticmethod
    def get_predicted_stock_returns(stock_symbol: str, start_date: str, prediction_date: str):
        quotes = QuoteDAO.find_for_period(stock_symbol, start_date, prediction_date)
        price_prediction_result = PricePredictionResult()
        price_prediction_result.symbol = stock_symbol
        if len(quotes) >= 100:
            metrics = PricePrediction.obtain_metrics(stock_symbol, prediction_date, quotes)
            price_prediction_result.ratio = float(metrics['ratio'])
            price_prediction_result.short_ratio = float(metrics['short_ratio'])
            price_prediction_result.long_ratio = float(metrics['long_ratio'])
            price_prediction_result.predicted_return = float(metrics['pred_return'])
        return price_prediction_result
