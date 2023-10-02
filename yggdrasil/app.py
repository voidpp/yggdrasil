import logging
from time import time

from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount
from starlette.middleware.sessions import SessionMiddleware
from starlette_graphene3 import GraphQLApp, make_graphiql_handler

from yggdrasil.api.schema import create_api_schema
from yggdrasil.auth_controller import AuthController
from yggdrasil.components.app_config import load_app_config, AppConfig
from yggdrasil.components.database import Database
from yggdrasil.components.env import environment
from yggdrasil.components.request_context_middleware import RequestContextMiddleware
from yggdrasil.components.logger import init_logger
from yggdrasil.components.request_context import RequestContext

logger = logging.getLogger(__name__)


class LoggedGraphQLApp(GraphQLApp):
    async def _handle_http_request(self, request: Request) -> JSONResponse:
        start = time()
        result = await super()._handle_http_request(request)
        end = time()
        milliseconds = (end - start) * 1000
        logger.debug("Query time: %s ms", round(milliseconds, 2))
        return result


def get_app(config: AppConfig = None, session_middleware: type = SessionMiddleware):
    env = environment()

    if config is None:
        config = load_app_config(env.config_file_path)

    debug = env.dev_mode

    init_logger(debug)

    logger.info("Environment variables: %s", env.model_dump())

    auth = AuthController(config)
    auth.register_oauth_clients()

    request_context = RequestContext(Database(config.database_url), auth, config)

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
