import os

import pytest
import pytest_asyncio
from testing.postgresql import Postgresql


from yggdrasil.components.database import Database
from yggdrasil.db_tables import meta


@pytest_asyncio.fixture()
async def database(database_url):
    db = Database(database_url, echo=False)

    async with db.engine.begin() as conn:
        await conn.run_sync(meta.create_all)

    yield db

    async with db.engine.begin() as conn:
        await conn.run_sync(meta.drop_all)

    await db.engine.dispose()


@pytest.fixture(scope="session")
def database_url():
    settings = {}
    for key in Postgresql.DEFAULT_SETTINGS:
        if value := os.environ.get(f"testing_postgres_{key}".upper()):
            settings[key] = value

    with Postgresql(**settings) as postgresql:
        yield postgresql.url().replace("postgresql://", "postgresql+asyncpg://")
