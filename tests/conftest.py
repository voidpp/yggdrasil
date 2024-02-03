from asyncio import get_event_loop_policy
from subprocess import run
from typing import Type
from unittest.mock import patch, Mock, AsyncMock

import pytest
from datek_app_utils.env_config.utils import validate_config
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from tests.populator import Populator
from tests.tools import get_fake_session_middleware, YggdarsilTestClient
from yggdrasil.app import get_app
from yggdrasil.components.app_config import AppConfig
from yggdrasil.components.database import Database
from yggdrasil.components.env import EnvConfig
from yggdrasil.components.folders import Folders
from yggdrasil.components.user_info import UserInfo

URL_TEMPLATE = "{scheme}://{user}:{password}@{host}:{port}/{db}"


class TestEnvConfig(EnvConfig):
    YGGDRASIL_POSTGRES_HOST: str
    YGGDRASIL_POSTGRES_PORT: int
    YGGDRASIL_POSTGRES_USER: str
    YGGDRASIL_POSTGRES_PASSWORD: str
    YGGDRASIL_POSTGRES_DB: str


@pytest.fixture(scope="session")
async def database(database_url) -> Database:
    db = Database(database_url, echo=False)
    run("alembic upgrade head".split(" "), cwd=Folders.root).check_returncode()

    yield db
    run("alembic downgrade base".split(" "), cwd=Folders.root).check_returncode()
    await db.engine.dispose()


@pytest.fixture
async def db_session(database: Database) -> AsyncSession:
    session = AsyncSession.__new__(AsyncSession)
    session.__init__(database.engine)

    with (
        patch.object(AsyncSession, "__new__", Mock(return_value=session)),
        patch.object(AsyncSession, "__init__", Mock(return_value=None)),
        patch.object(AsyncSession, AsyncSession.commit.__name__, AsyncMock()),
        patch.object(AsyncSession, AsyncSession.close.__name__, AsyncMock()),
    ):
        yield session
        await session.rollback()
        await session.close()


@pytest.fixture
def fake_session_data():
    return {}


@pytest.fixture(scope="session")
def app_config(database_url):
    return AppConfig(
        database_url=database_url,
        session_secret="test",
        auth_clients={},
        redis_url="",
    )


def create_fake_redis(url: str) -> Redis:
    return None


@pytest.fixture
def test_client(app_config, fake_session_data, db_session):
    session_middleware = get_fake_session_middleware(fake_session_data)
    app = get_app(config=app_config, session_middleware=session_middleware, redis_client_factory=create_fake_redis)
    client = YggdarsilTestClient(app, db_session, fake_session_data)
    return client


@pytest.fixture
async def authenticated_user(test_client) -> UserInfo:
    async with test_client.authenticate_user() as user:
        yield user


@pytest.fixture
def populator(db_session):
    return Populator(db_session)


@pytest.fixture(scope="session")
def database_url(valid_env: Type[TestEnvConfig]) -> str:
    return URL_TEMPLATE.format(
        scheme="postgresql+asyncpg",
        user=valid_env.YGGDRASIL_POSTGRES_USER,
        password=valid_env.YGGDRASIL_POSTGRES_PASSWORD,
        host=valid_env.YGGDRASIL_POSTGRES_HOST,
        port=valid_env.YGGDRASIL_POSTGRES_PORT,
        db=valid_env.YGGDRASIL_POSTGRES_DB,
    )


@pytest.fixture(scope="session")
def valid_env() -> Type[TestEnvConfig]:
    validate_config(TestEnvConfig)
    return TestEnvConfig


@pytest.fixture(scope="session")
def event_loop():
    loop = get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
