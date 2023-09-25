from dataclasses import dataclass
from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from yggdrasil.auth.controller import AuthController
    from yggdrasil.components.app_config import AppConfig
    from yggdrasil.components.database import Database


@dataclass
class RequestContext:
    db: "Database"
    auth: "AuthController"
    config: "AppConfig"
