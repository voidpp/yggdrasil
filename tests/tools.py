from contextlib import asynccontextmanager
from http.client import OK
from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.types import ASGIApp, Scope, Receive, Send

from yggdrasil.auth_controller import AuthController
from yggdrasil.components.user_info import UserInfo


def get_fake_session_middleware(session_data: dict):
    class FakeSessionMiddleware:
        def __init__(self, app: ASGIApp, **kwargs) -> None:
            self.app = app

        async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
            scope["session"] = session_data
            await self.app(scope, receive, send)

    return FakeSessionMiddleware


class YggdarsilTestClient(AsyncClient):
    def __init__(self, app: ASGIApp, db_session: AsyncSession, fake_session_data: dict):
        super().__init__(app=app, base_url="http://localhost:8000")
        self.db_session = db_session
        self.fake_session_data = fake_session_data

    async def query(self, query_string: str, variables: dict = None):
        data = {"query": query_string}

        if variables is not None:
            data["variables"] = variables

        response = await self.post("/api/", json=data)
        assert response.status_code == OK
        return response.json()

    @asynccontextmanager
    async def authenticate_user(self, sub: str = None, email: str = "mulder@the-truth-is-out-there.com"):
        user_info = UserInfo(
            sub=sub or uuid4().hex,
            email=email,
            given_name="given_name",
            family_name="family_name",
            picture="picture",
            locale="en",
        )
        await user_info.store(self.db_session)
        AuthController.update_session_dict(self.fake_session_data, user_info)
        yield user_info
        AuthController.clear_session_dict(self.fake_session_data)
