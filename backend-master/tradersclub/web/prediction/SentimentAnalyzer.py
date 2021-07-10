import numpy as np
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer as SIA

from tradersclub.web.prediction.SentimentAnalysisResult import SentimentAnalysisResult


class SentimentAnalyzer:
    def __init__(self):
        nltk.download('vader_lexicon')

    @staticmethod
    # get the aggregated score [-1, 1], 1 being extreme positive, -1 being extreme negative
    def get_sentiment(articles: [str]):
        pol_scores = [SIA().polarity_scores(article) for article in articles]  # run analysis
        scores = np.array([pol_score['compound'] for pol_score in pol_scores])  # array([0.5984, 0.5984])
        result = SentimentAnalysisResult()
        result.sentiment = float(np.mean(scores))
        return result
