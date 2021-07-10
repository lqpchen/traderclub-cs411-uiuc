from enum import Enum


class AuthenticationStatus(Enum):
    AUTHENTICATED = 1
    UNAUTHORIZED = 2
    EXPIRED = 3
