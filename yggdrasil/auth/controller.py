import logging

from authlib.integrations.starlette_client import OAuth, StarletteOAuth2App
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import RedirectResponse
from starlette.routing import Route

from yggdrasil.components.app_config import AppConfig
from yggdrasil.components.request_context import RequestContext
from yggdrasil.components.types import RequestScopeKeys
from yggdrasil.components.user_info import UserInfo

logger = logging.getLogger(__name__)


class AuthController:
    REDIRECT_ROUTE_NAME = "redirect"
    SESSION_USER_KEY = "user"

    @classmethod
    def update_session_dict(cls, session_dict: dict, user_info: UserInfo):
        session_dict[cls.SESSION_USER_KEY] = user_info.model_dump()

    @classmethod
    def clear_session_dict(cls, session_dict: dict):
        if cls.SESSION_USER_KEY in session_dict:
            del session_dict[cls.SESSION_USER_KEY]

    def __init__(self, config: AppConfig):
        self._config = config
        self._oauth = OAuth()

    def register_oauth_clients(self):
        for name, auth_config in self._config.auth_clients.items():
            self._oauth.register(
                name,
                server_metadata_url=auth_config.metadata_url,
                client_id=auth_config.id,
                client_secret=auth_config.secret,
                client_kwargs={"scope": "openid profile email"},
            )

    def _get_client(self, request: Request) -> StarletteOAuth2App:
        client_name = request.path_params["client"]
        if client_name not in self._config.auth_clients:
            logger.info(
                "Unknown client requested. name: %s, known clients: %s",
                client_name,
                list(self._config.auth_clients.keys()),
            )
            raise HTTPException(404, "Unknown client requested")
        return self._oauth.create_client(client_name)

    async def login(self, request: Request):
        client = self._get_client(request)
        redirect_uri = request.url_for(self.REDIRECT_ROUTE_NAME, client=client.name)
        return await client.authorize_redirect(request, redirect_uri)

    async def redirect(self, request: Request):
        client = self._get_client(request)
        token = await client.authorize_access_token(request)
        user_info = UserInfo(**token["userinfo"])
        context: RequestContext = request.scope[RequestScopeKeys.CONTEXT]
        await user_info.store(context.db)
        self.update_session_dict(request.session, user_info)
        return RedirectResponse("/")

    async def logout(self, request: Request):
        self.clear_session_dict(request.session)
        return RedirectResponse("/")

    def get_user(self, request: Request) -> UserInfo | None:
        data = request.session.get(self.SESSION_USER_KEY)
        return UserInfo(**data) if data else None

    def get_routes(self):
        return [
            Route("/login/{client}", self.login),
            Route("/redirect/{client}", self.redirect, name=self.REDIRECT_ROUTE_NAME),
            Route("/logout", self.logout),
        ]
