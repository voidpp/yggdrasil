import os
from contextlib import asynccontextmanager
from typing import Callable, AsyncContextManager
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from testing.postgresql import Postgresql

from yggdrasil.app import get_app
from yggdrasil.auth_controller import AuthController
from yggdrasil.components.app_config import AppConfig
from yggdrasil.components.database import Database
from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_tables import meta
from yggdrasil.tests.populator import Populator

from yggdrasil.tests.tools import get_fake_session_middleware, YggdarsilTestClient


@pytest_asyncio.fixture()
async def database(database_url):
    db = Database(database_url, echo=False)

    async with db.engine.begin() as conn:
        await conn.run_sync(meta.create_all)

    yield db

    async with db.engine.begin() as conn:
        await conn.run_sync(meta.drop_all)

    await db.engine.dispose()


@pytest_asyncio.fixture()
async def db_session(database) -> AsyncSession:
    async with database.session() as session:
        yield session


@pytest.fixture(scope="session")
def database_url():
    settings = {}
    for key in Postgresql.DEFAULT_SETTINGS:
        if value := os.environ.get(f"testing_postgres_{key}".upper()):
            settings[key] = value

    with Postgresql(**settings) as postgresql:
        yield postgresql.url().replace("postgresql://", "postgresql+asyncpg://")


@pytest.fixture(scope="session")
def fake_session_data():
    return {}


@pytest.fixture(scope="session")
def app_config(database_url):
    return AppConfig(database_url=database_url, session_secret="test", auth_clients={})


@pytest.fixture(scope="session")
def test_client(app_config, fake_session_data):
    session_middleware = get_fake_session_middleware(fake_session_data)
    app = get_app(config=app_config, session_middleware=session_middleware)
    client = YggdarsilTestClient(app)
    return client


@pytest.fixture()
def authenticate_user(fake_session_data, db_session) -> Callable[[], AsyncContextManager[UserInfo]]:
    @asynccontextmanager
    async def authenticate_user_wrapper(sub: str = None, email: str = "mulder@the-truth-is-out-there.com") -> UserInfo:
        user_info = UserInfo(
            sub=sub or uuid4().hex,
            email=email,
            given_name="given_name",
            family_name="family_name",
            picture="picture",
            locale="en",
        )
        await user_info.store(db_session)
        AuthController.update_session_dict(fake_session_data, user_info)
        yield user_info
        AuthController.clear_session_dict(fake_session_data)

    return authenticate_user_wrapper


@pytest.fixture()
def populator(db_session):
    return Populator(db_session)
