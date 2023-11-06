import logging
from time import time
from typing import Callable

from redis import Redis
from redis import asyncio as aioredis
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount
from starlette_graphene3 import GraphQLApp, make_graphiql_handler

from yggdrasil.api.schema import create_api_schema
from yggdrasil.auth_controller import AuthController
from yggdrasil.components.app_config import load_app_config, AppConfig
from yggdrasil.components.database import Database
from yggdrasil.components.env import environment
from yggdrasil.components.logger import init_logger
from yggdrasil.components.request_context import RequestContext
from yggdrasil.components.request_context_middleware import RequestContextMiddleware

logger = logging.getLogger(__name__)


class LoggedGraphQLApp(GraphQLApp):
    async def _handle_http_request(self, request: Request) -> JSONResponse:
        start = time()
        result = await super()._handle_http_request(request)
        end = time()
        milliseconds = (end - start) * 1000
        request_data = await request.json()
        logger.debug(
            "Query time: %s ms, query string: %s, variables: %s",
            round(milliseconds, 2),
            request_data.get("query"),
            request_data.get("variables"),
        )
        return result


def get_app(
    config: AppConfig = None,
    session_middleware: type = SessionMiddleware,
    redis_client_factory: Callable[[str], Redis] = aioredis.from_url,
):
    env = environment()

    if config is None:
        config = load_app_config(env.config_file_path)

    debug = env.dev_mode

    init_logger()

    logger.info("Environment variables: %s", env.model_dump())

    auth = AuthController(config)
    auth.register_oauth_clients()
    redis = redis_client_factory(config.redis_url)

    request_context = RequestContext(Database(config.database_url), auth, config, redis)

    app = Starlette(
        debug,
        routes=[
            Mount("/api", LoggedGraphQLApp(create_api_schema(), on_get=make_graphiql_handler())),
            Mount("/auth", routes=auth.get_routes()),
        ],
        middleware=[
            Middleware(RequestContextMiddleware, context_data=request_context),
            Middleware(session_middleware, secret_key=config.session_secret),
        ],
    )

    return app
