from django.urls import path, include
from rest_framework import routers

from tradersclub.web.views import login, sign_up, stock_discussion_threads, get_app_stocks_list, \
    get_stock_quotes, get_stock_exchange_list, get_app_favourite_stock_ids, \
    favourite_stock_action, get_app_favourite_stock, get_stock_articles_list, delete_stock_discussion_thread, \
    get_stock_discussion_thread_replies, stock_financials, get_stock_discussion_thread_reply, \
    update_stock_discussion_thread_reply, upvote_stock_discussion_thread_reply, downvote_stock_discussion_thread_reply, \
    create_stock_discussion_thread_reply, get_all_discussion_threads, get_stock_predicted_returns, get_stock_quotes_all, \
    get_stock_articles_sentiment

router = routers.DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('signup/', sign_up, name='signup'),
    path('login/', login, name='signup'),
    path('stocks/', get_app_stocks_list, name="get_app_stocks_list"),
    path('stocks/<stock_symbol>/financials/', stock_financials, name="stock_financials"),
    path('stocks/<stock_symbol>/threads/', stock_discussion_threads, name="stock_discussion_threads"),
    path('stocks/<stock_symbol>/predicted-returns/', get_stock_predicted_returns, name="stock_predicted_returns"),
    path('stocks/<stock_symbol>/articles-sentiment/', get_stock_articles_sentiment, name="stock_articles_sentiment"),
    path('stocks/threads/', get_all_discussion_threads, name="get_stock_discussion_threads"),
    path('stocks/<stock_symbol>/threads/<thread_id>', delete_stock_discussion_thread, name="delete_stock_discussion_thread"),
    path('stocks/<stock_symbol>/threads/replies/<reply_id>', get_stock_discussion_thread_reply, name="get_stock_discussion_thread_reply"),
    path('stocks/<stock_symbol>/threads/replies/<reply_id>/edit', update_stock_discussion_thread_reply, name="get_stock_discussion_thread_reply"),
    path('stocks/<stock_symbol>/threads/replies/<reply_id>/upvote', upvote_stock_discussion_thread_reply, name="upvote_stock_discussion_thread_reply"),
    path('stocks/<stock_symbol>/threads/replies/<reply_id>/downvote', downvote_stock_discussion_thread_reply, name="downvote_stock_discussion_thread_reply"),
    path('stocks/<stock_symbol>/threads/<thread_id>/replies/create', create_stock_discussion_thread_reply, name="create_stock_discussion_thread_reply"),
    path('stocks/<stock_symbol>/threads/<thread_id>/replies/', get_stock_discussion_thread_replies, name="get_stock_discussion_thread_replies"),
    path('stocks/<stock_symbol>/articles/', get_stock_articles_list, name="get_stock_articles_list"),
    path('stocks/articles/', get_stock_articles_list, name="get_stock_articles_list"),
    path('stocks/<stock_symbol>/quotes/', get_stock_quotes_all, name="get_stock_quotes_all"),
    path('stocks/<stock_symbol>/quotes/<from_period>/<to_period>/', get_stock_quotes, name="get_stock_quotes"),
    path('exchanges/', get_stock_exchange_list, name="get_stock_exchange_list"),
    path('stocks/favourite-ids/', get_app_favourite_stock_ids, name="get_app_favourite_stock_ids"),
    path('stocks/favourite/<stock_id>', favourite_stock_action, name="favourite_stock_action"),
    path('stocks/favourite/', get_app_favourite_stock, name="app_user_favourite_stock"),
    path('api-auth/', include('rest_framework.urls'))
]
