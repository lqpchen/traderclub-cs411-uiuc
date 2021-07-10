from django.test import TestCase
from jwt import DecodeError

from tradersclub.web.auth.AuthUtil import AuthUtil
from tradersclub.web.auth.AuthenticationStatus import AuthenticationStatus
from tradersclub.web.daos.AppUserDAO import AppUser
from tradersclub.web.prediction.SentimentAnalyzer import SentimentAnalyzer


class AuthUtilTestCase(TestCase):

    def test_check_password(self):
        hashed_salted_password = AuthUtil.get_hashed_salted_password_from_salt_and_password("pass", "salt")
        self.assertTrue(AuthUtil.check_password("pass", hashed_salted_password))
        self.assertFalse(AuthUtil.check_password("invalid", hashed_salted_password))

    def test_has_expired(self):
        app_user = AppUser()
        app_user.email = "test@example.com"
        app_user.id = "1234"
        [token, iat, expires_on] = AuthUtil.create_jwt_token(app_user)
        self.assertFalse(AuthUtil.has_expired(token))

    def test_authenticate_on_valid_jwt(self):
        app_user = AppUser()
        app_user.email = "test@example.com"
        app_user.id = "1234"
        [token, iat, expires_on] = AuthUtil.create_jwt_token(app_user)
        result = AuthUtil.authenticate(token)
        self.assertEquals("1234", result.app_user_id)
        self.assertEquals(AuthenticationStatus.AUTHENTICATED, result.authentication_result)

    def test_authenticate_on_invalid_jwt(self):
        token = "invalid jwt"
        self.assertRaises(DecodeError, AuthUtil.authenticate, token)


class SentimentAnalyzerTest(TestCase):
    def test_TSLA_news(self):
        tsla_news = [
            'the founder of arkk says that she believes the stock price of tsla is now under-estimated\
            and the price will increase to at least 1000 usd by the end of 2020',
            'arkk has bought lots of tsla stocks for its portfolio even though the price is going down these days,\
            cathewood seems to be very positive about the future price of tsla'
        ]
        self.assertEquals(0.45830000000000004, SentimentAnalyzer().get_sentiment(tsla_news).sentiment)
