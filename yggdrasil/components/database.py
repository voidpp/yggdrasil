from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession


class Database:
    def __init__(self, url: str, echo=False):
        self._url = url
        self.engine = create_async_engine(url, echo=echo)

    @asynccontextmanager
    async def transaction(self):
        async with AsyncSession(self.engine) as session:
            async with session.begin():
                yield session

    @asynccontextmanager
    async def session(self):
        async with AsyncSession(self.engine) as session:
            yield session
