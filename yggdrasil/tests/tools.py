from contextlib import asynccontextmanager
from typing import AsyncIterator, Iterator, AsyncContextManager
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from starlette.testclient import TestClient
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


class YggdarsilTestClient(TestClient):
    def __init__(self, app: ASGIApp, db_session: AsyncSession, fake_session_data: dict):
        super().__init__(app)
        self.db_session = db_session
        self.fake_session_data = fake_session_data

    def query(self, query_string: str, variables: dict = None):
        data = {"query": query_string}

        if variables is not None:
            data["variables"] = variables

        return self.post("/api", json=data).json()

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
