import os

import pytest
import pytest_asyncio
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from testing.postgresql import Postgresql

from yggdrasil.app import get_app
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


@pytest.fixture()
def fake_session_data():
    return {}


@pytest.fixture(scope="session")
def app_config(database_url):
    return AppConfig(database_url=database_url, session_secret="test", auth_clients={}, redis_url="")


def create_fake_redis(url: str) -> Redis:
    return None


@pytest.fixture()
def test_client(app_config, fake_session_data, db_session):
    session_middleware = get_fake_session_middleware(fake_session_data)
    app = get_app(config=app_config, session_middleware=session_middleware, redis_client_factory=create_fake_redis)
    client = YggdarsilTestClient(app, db_session, fake_session_data)
    return client


@pytest_asyncio.fixture()
async def authenticated_user(test_client) -> UserInfo:
    async with test_client.authenticate_user() as user:
        yield user


@pytest.fixture()
def populator(db_session):
    return Populator(db_session)
