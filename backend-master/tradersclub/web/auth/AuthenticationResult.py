from tradersclub.web.auth.AuthenticationStatus import AuthenticationStatus


class AuthenticationResult:
    def __init__(self):
        self.app_user_id = None
        self.authentication_result = None

    def isUnauthorized(self):
        return self.authentication_result == AuthenticationStatus.UNAUTHORIZED
