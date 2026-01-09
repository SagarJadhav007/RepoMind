from enum import Enum

class Role(str, Enum):
    CONTRIBUTOR = "contributor"
    MAINTAINER = "maintainer"
    SYSTEM = "system"
