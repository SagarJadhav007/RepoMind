from enum import Enum

class Role(str, Enum):
    USER = "user"
    MAINTAINER = "maintainer"
    CONTRIBUTOR = "contributor"
