import json
import logging
from datetime import timedelta, datetime
from typing import Optional

import jsonpickle
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from elasticsearch_dsl import Search, Q
from rest_framework import status, serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from tradersclub.web.auth.AuthUtil import AuthUtil
from tradersclub.web.daos import Paginated
from tradersclub.web.daos.DiscussionThreadProfileDAO import DiscussionThreadProfileDAO
from tradersclub.web.daos.DiscussionThreadReplyDAO import DiscussionThreadReplyDAO
from tradersclub.web.daos.StockArticleDAO import StockArticleDAO
from tradersclub.web.daos.StockDAO import StockDAO
from tradersclub.web.daos.AppUserDAO import AppUserDAO
from tradersclub.web.daos.AppUserFavouriteStockDAO import AppUserFavouriteStock, AppUserFavouriteStockDAO
from tradersclub.web.daos.DiscussionThreadDAO import DiscussionThreadDAO
from tradersclub.web.daos.QuoteDAO import QuoteDAO
from tradersclub.web.daos.StockExchangeDAO import StockExchangeDAO
from tradersclub.web.daos.StockFinancialsDAO import StockFinancialsDAO
from tradersclub.web.models import DiscussionThread, DiscussionThreadReply, StockArticle
from tradersclub.web.prediction.SentimentAnalyzer import SentimentAnalyzer
from tradersclub.web.serializers import AppUserSerializer, \
    StockNewDiscussionThreadRequestSerializer, StockUpdateDiscussionThreadReplyRequestSerializer
from tradersclub.web.prediction import PricePrediction

# Login/Registration Views
from tradersclub.web.daos.StockProfileDAO import StockProfileDAO

logging.getLogger('elasticsearch').setLevel(logging.DEBUG)
sentiment_analyzer = SentimentAnalyzer()

@csrf_exempt
@api_view(['POST'])
def sign_up(request) -> Response:
    serializer = AppUserSerializer(data=json.loads(request.body))
    if serializer.is_valid():
        user = serializer.create(serializer.validated_data)
        data = AppUserDAO.create(user)

        return Response(data, status=status.HTTP_201_CREATED)
    else:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(['POST'])
def login(request) -> Response:
    # Need to figure out user authentication -  we'll likely use a session-based auth mechanism where login will set a
    # cookie on the user's browser with the user_id and hashed password. For any user specific reads such as
    # discussion thread/reply/favourites - we can check that these records exist in app_user before returning data so
    # that requests made by user A for user B will not succeed as the auth will fail. The other API's can be open.
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    email = body['email']
    password = body['password']
    app_user = AppUserDAO.find_by_email(email)
    if app_user and AuthUtil.check_password(password, app_user.password):
        (token, created_at, expires_on) = AuthUtil.create_jwt_token(app_user)
        return Response(data=json.dumps({
            'token': token,
            'user_id': app_user.id,
            'created_at': created_at,
            'expires_on': expires_on
        }), status=status.HTTP_200_OK)
    else:
        return Response(status=status.HTTP_401_UNAUTHORIZED)


@csrf_exempt
@api_view(["GET"])
def get_app_favourite_stock(req) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    page = int(req.GET.get("page"))
    page_size = int(req.GET.get("page_size"))
    sort_column = req.GET.get("sort_column")
    sort_direction = req.GET.get("sort_direction")

    records = StockProfileDAO.find_all(int(page), int(page_size), sort_column, sort_direction,
                                       authentication_result.app_user_id)

    return build_json_response(records)


@csrf_exempt
@api_view(["GET"])
def get_app_favourite_stock_ids(req) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()
    result = AppUserFavouriteStockDAO.find_ids_by_user(authentication_result.app_user_id)
    return build_json_response(result)


@csrf_exempt
@api_view(["POST"])
def create_stock_discussion_thread_reply(req, stock_symbol: str, thread_id: int) -> HttpResponse:
    serializer = StockUpdateDiscussionThreadReplyRequestSerializer(data=json.loads(req.body))

    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    if not serializer.is_valid():
        return Response(status=status.HTTP_400_BAD_REQUEST)

    update = serializer.create(serializer.validated_data)

    reply = DiscussionThreadReply()
    reply.discussion_thread_id = thread_id
    reply.content = update.content
    reply.parent_id = update.parentReplyId
    reply.author_id = authentication_result.app_user_id
    reply.sentiment = update.sentiment
    reply.position = update.position_held

    reply_id = DiscussionThreadReplyDAO.create(reply)

    return Response(status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST"])
def update_stock_discussion_thread_reply(req, stock_symbol: str, reply_id: int) -> HttpResponse:
    serializer = StockUpdateDiscussionThreadReplyRequestSerializer(data=json.loads(req.body))

    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    if not serializer.is_valid():
        return Response(status=status.HTTP_400_BAD_REQUEST)

    update = serializer.create(serializer.validated_data)

    record = DiscussionThreadReplyDAO.find_reply_by_id(reply_id)
    if record is None:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if record.author_id is not authentication_result.app_user_id:
        return Response(status=status.HTTP_403_FORBIDDEN)

    DiscussionThreadReplyDAO.update_reply(record.id, update)

    return Response(status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(["POST", "DELETE"])
def favourite_stock_action(req, stock_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    if req.method == "POST":
        return mark_stock_as_favourite(authentication_result.app_user_id, stock_id)
    elif req.method == "DELETE":
        return unmark_stock_as_favourite(authentication_result.app_user_id, stock_id)
    else:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def mark_stock_as_favourite(user_id: int, stock_id: int) -> HttpResponse:
    record = AppUserFavouriteStock()
    record.stock_id = stock_id
    record.app_user_id = user_id
    AppUserFavouriteStockDAO.create(record)

    return Response(status=status.HTTP_201_CREATED)


def unmark_stock_as_favourite(user_id: int, stock_id: int) -> HttpResponse:
    AppUserFavouriteStockDAO.delete(user_id, stock_id)
    return build_delete_api_response()


@csrf_exempt
@api_view(["GET"])
def get_app_stocks_list(req) -> HttpResponse:
    page = int(req.GET.get("page"))
    page_size = int(req.GET.get("page_size"))
    sort_column = req.GET.get("sort_column")
    sort_direction = req.GET.get("sort_direction")
    records = StockProfileDAO.find_all(int(page), int(page_size), sort_column, sort_direction)

    return build_json_response(records)

@csrf_exempt
@api_view(["GET"])
def get_stock_articles_list(req, stock_symbol: str = None) -> HttpResponse:
    page = int(req.GET.get("page"))
    page_size = int(req.GET.get("page_size"))

    search_query = req.GET.get("search_query")
    search_provider = req.GET.get("search_provider")
    search_release_date = req.GET.get("search_release_date")

    stock_symbol_val = req.GET.get("search_stock_symbol") if stock_symbol is None else stock_symbol
    stock_id = None if stock_symbol is None else StockDAO.find_stock_id_by_symbol(stock_symbol)
    target_ids_range = []

    s = Search(index="stock_articles")
    search_criteria = []

    should_match = 0
    if stock_symbol_val or stock_id:
        if stock_symbol_val is not None:
            search_criteria.append(Q('wildcard', stock_symbol=stock_symbol_val + "*"))

        if stock_id is not None:
            search_criteria.append(Q('match', stock_id=stock_id))
        should_match += 1

    if search_provider:
        search_criteria.append(Q('wildcard', provider=search_provider + "*"))
        should_match += 1

    if search_release_date:
        search_criteria.append(Q('match', release_date=search_release_date))
        should_match += 1

    if search_query:
        search_criteria.append(
          Q('match', stock=search_query) |
          Q('match', content=search_query) |
          Q('match', headline=search_query) |
          Q('match', provider=search_query)
        )
        should_match += 1

    if len(search_criteria) > 0:
        s.query = Q("bool", must=search_criteria)
    else:
        s.query("match_all")

    s.sort('_score', 'release_date')

    s = s[0:10000]

    response = s.source(includes = ["article_id"]).execute(ignore_cache=True)

    for hit in response:
        target_ids_range.append(hit.article_id)
    total_hits = response.hits.total.value

    results = []
    if target_ids_range:
        def compute_sentiment(article: StockArticle):
            article.sentiment = sentiment_analyzer.get_sentiment([article.headline]).sentiment
            return article
        results = list(map(compute_sentiment, StockArticleDAO.find_articles(stock_id, target_ids_range, page, page_size)))

    return build_json_response(Paginated(results, total_hits))

@csrf_exempt
@api_view(["GET"])
def get_stock_exchange_list(_) -> Response:
    results = StockExchangeDAO.find_all()
    return Response(results, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_stock_quotes_all(req, stock_symbol: str) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    results = QuoteDAO.find_for_period(stock_symbol,
        datetime(2018, 1, 10).strftime("%Y-%m-%d"),
        datetime.now().strftime("%Y-%m-%d")
    )

    return build_json_response(results)


@api_view(["GET"])
def get_stock_quotes(req, stock_symbol: str, from_period: Optional[str], to_period: Optional[str]) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    results = QuoteDAO.find_for_period(stock_symbol, from_period, to_period)

    return build_json_response(results)


@csrf_exempt
@api_view(["GET"])
def get_stock_predicted_returns(req, stock_symbol: str) -> HttpResponse:
    prediction_date = req.GET.get("prediction_date")
    start_date = req.GET.get("start_date")
    if not prediction_date or not start_date:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    else:
        result = PricePrediction.PricePrediction.get_predicted_stock_returns(stock_symbol, start_date, prediction_date)
        return build_json_response(result)


@csrf_exempt
@api_view(["GET"])
def get_stock_articles_sentiment(req, stock_symbol: str) -> HttpResponse:
    stock_id = StockDAO.find_stock_id_by_symbol(stock_symbol)
    if not stock_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    else:
        articles: [StockArticle] = StockArticleDAO.find_articles(stock_id, None,
                                                                 page = 0,
                                                                 page_size=50)
        if len(articles) == 0:
            return build_json_response([])
        else:
            headlines = map(lambda article: article.headline, articles)
            return build_json_response(sentiment_analyzer.get_sentiment(headlines))


@csrf_exempt
@api_view(["DELETE"])
def delete_stock_discussion_thread(req, stock_symbol: str, thread_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    author_id = DiscussionThreadDAO.find_author_id(thread_id)
    if not author_id:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if not (author_id == authentication_result.app_user_id):
        return Response(status=status.HTTP_403_FORBIDDEN)

    DiscussionThreadDAO.delete_by_id(thread_id)

    return Response(status=status.HTTP_200_OK)


@csrf_exempt
@api_view(["POST"])
def downvote_stock_discussion_thread_reply(req, stock_symbol: str, reply_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    DiscussionThreadReplyDAO.create_reply_vote(reply_id, authentication_result.app_user_id, False)

    return Response(status=status.HTTP_200_OK)

@csrf_exempt
@api_view(["POST"])
def upvote_stock_discussion_thread_reply(req, stock_symbol: str, reply_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    DiscussionThreadReplyDAO.create_reply_vote(reply_id, authentication_result.app_user_id, True)
    return Response(status=status.HTTP_200_OK)

@csrf_exempt
@api_view(["GET", "POST"])
def stock_discussion_threads(req, stock_symbol: str) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    if req.method == "POST":
        return create_new_stock_discussion_thread(req, authentication_result.app_user_id, stock_symbol)
    elif req.method == "GET":
        return get_stock_discussion_threads(req, stock_symbol)
    else:
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@csrf_exempt
@api_view(["GET"])
def get_all_discussion_threads(request) -> HttpResponse:
    page = int(request.GET.get("page"))
    page_size = int(request.GET.get("page_size"))

    records = DiscussionThreadProfileDAO.find_all(None, page, page_size)

    return build_json_response(records)


def get_stock_discussion_threads(request, stock_symbol: str) -> HttpResponse:
    page = int(request.GET.get("page"))
    page_size = int(request.GET.get("page_size"))

    records = DiscussionThreadProfileDAO.find_all(stock_symbol, page, page_size)

    return build_json_response(records)


@transaction.atomic
def create_new_stock_discussion_thread(request, user_id: int, stock_symbol: str) -> HttpResponse:
    serializer = StockNewDiscussionThreadRequestSerializer(data=json.loads(request.body))

    if not serializer.is_valid():
        return Response(status=status.HTTP_400_BAD_REQUEST)

    stock_id = StockDAO.find_stock_id_by_symbol(stock_symbol)
    if not stock_id:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    record = serializer.create(serializer.validated_data)

    thread = DiscussionThread()
    thread.subject = record.subject
    thread.author_id = user_id
    thread.created = timezone.now()
    thread.stock_id = stock_id

    thread_id = DiscussionThreadDAO.create(thread)

    reply = DiscussionThreadReply()
    reply.discussion_thread_id = thread_id
    reply.content = record.content
    reply.author_id = user_id
    reply.sentiment = record.sentiment
    reply.position = record.position_held

    reply_id = DiscussionThreadReplyDAO.create(reply)

    return Response(status=status.HTTP_201_CREATED)

@csrf_exempt
@api_view(["GET"])
def stock_financials(req, stock_symbol: str) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    page = int(req.GET.get("page"))
    page_size = int(req.GET.get("page_size"))
    records = StockFinancialsDAO.find_by_stock_symbol(stock_symbol, page, page_size)

    return build_json_response(records)


@csrf_exempt
@api_view(["GET"])
def get_stock_discussion_thread_reply(req, stock_symbol: str, reply_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    records = DiscussionThreadReplyDAO.find_reply_by_id(reply_id)
    return build_json_response(records)


@csrf_exempt
@api_view(["GET"])
def get_stock_discussion_thread_replies(req, stock_symbol: str, thread_id: int) -> HttpResponse:
    authentication_result = AuthUtil.authenticateFromHeader(req)
    if authentication_result.isUnauthorized():
        return build_unauthorized_response()

    parent = req.GET.get("parent")
    parent = int(parent) if parent is not None else None
    page = int(req.GET.get("page"))
    page_size = int(req.GET.get("page_size"))

    records = DiscussionThreadReplyDAO.find_replies(thread_id, authentication_result.app_user_id, parent, page, page_size)

    return build_json_response(records)



# Util functions

def build_get_api_response(serializer: serializers.Serializer) -> Response:
    return Response(serializer.data)


def build_delete_api_response() -> Response:
    return Response(status=status.HTTP_204_NO_CONTENT)


def build_json_response(results) -> HttpResponse:
    results_json = jsonpickle.encode(results, unpicklable=False)
    return HttpResponse(
        content=results_json
    )


def build_unauthorized_response() -> Response:
    return Response(status=status.HTTP_401_UNAUTHORIZED)
