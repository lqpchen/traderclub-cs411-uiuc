import hashlib
import uuid
import time

import jwt

from tradersclub.web.auth.AuthenticationResult import AuthenticationResult
from tradersclub.web.auth.AuthenticationStatus import AuthenticationStatus
from tradersclub.web.daos.AppUserDAO import AppUser


class AuthUtil:

    def __int__(self):
        pass

    @staticmethod
    def current_milli_time():
        return round(time.time() * 1000)

    @staticmethod
    def get_jwt_secret() -> str:
        return "team-oceania"

    @staticmethod
    def get_jwt_expiration_millis() -> int:
        # Usually JWT tokens are valid for 20 minutes
        # and there's a /refresh endpoint to generate a new token
        # To do away with this additional complexity, let's keep it valid
        # for 7 days and make the user login once it has expired.
        return 7 * 24 * 60 * 60 * 1000

    @staticmethod
    def get_jwt_encryption_scheme() -> str:
        return "HS256"

    @staticmethod
    def create_jwt_token(app_user: AppUser) -> (str, int, int):
        iat = AuthUtil.current_milli_time()
        expires_on = iat + AuthUtil.get_jwt_expiration_millis()
        token = jwt.encode({"iat": str(iat), "app_user_id": app_user.id},
                           AuthUtil.get_jwt_secret(),
                           algorithm=AuthUtil.get_jwt_encryption_scheme()).decode(AuthUtil.get_jwt_encoding_scheme())
        return (token, iat, expires_on)


    @staticmethod
    def has_expired(token: str) -> bool:
        decoded_jwt = AuthUtil.decode_jwt_token(token)
        return int(decoded_jwt['iat']) + AuthUtil.get_jwt_expiration_millis() < AuthUtil.current_milli_time()

    @staticmethod
    def authenticate(token: str) -> AuthenticationResult:
        token = str.replace(str(token), 'Bearer ', '')
        decoded_jwt = AuthUtil.decode_jwt_token(token)
        has_expired = AuthUtil.has_expired(token)
        app_user_id = decoded_jwt['app_user_id']
        result = AuthenticationResult()
        if has_expired:
            result.authentication_result = AuthenticationStatus.EXPIRED
        elif app_user_id:
            result.authentication_result = AuthenticationStatus.AUTHENTICATED
            result.app_user_id = app_user_id
        else:
            result.authentication_result = AuthenticationStatus.UNAUTHORIZED
        return result

    @staticmethod
    def authenticateFromHeader(request) -> AuthenticationResult:
        token = request.META.get('HTTP_AUTHORIZATION')
        if not token:
            result = AuthenticationResult()
            result.authentication_result = AuthenticationStatus.UNAUTHORIZED
            return result
        else:
            return AuthUtil.authenticate(token)

    @staticmethod
    def decode_jwt_token(token: str) -> {}:
        encoded_token = token.encode(AuthUtil.get_jwt_encoding_scheme())
        return jwt.decode(encoded_token, AuthUtil.get_jwt_secret(),
                          algorithms=[AuthUtil.get_jwt_encryption_scheme()])

    @staticmethod
    def get_jwt_encoding_scheme() -> str:
        return "UTF-8"

    @staticmethod
    def get_hashed_salted_password_from_salt_and_password(password: str, salt: str) -> str:
        return hashlib.sha256(salt.encode() + password.encode()).hexdigest() + ':' + salt

    @staticmethod
    def get_hashed_salted_password(password: str) -> str:
        salt = uuid.uuid4().hex
        return AuthUtil.get_hashed_salted_password_from_salt_and_password(password, salt)

    @staticmethod
    def check_password(password: str, hashed_salted_password: str) -> bool:
        salt = hashed_salted_password.split(":")[1]
        return AuthUtil.get_hashed_salted_password_from_salt_and_password(password, salt) == hashed_salted_password
