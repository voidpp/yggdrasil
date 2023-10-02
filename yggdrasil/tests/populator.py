from sqlalchemy import insert
from sqlalchemy.ext.asyncio import AsyncSession

from yggdrasil.components.database import Database
from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_tables import section


class Populator:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def add_user(self, user: UserInfo):
        await user.store(self.db_session)

    async def add_section(self, user_id: int, name: str = "", rank: int = 0) -> int:
        query = insert(section).values({"user_id": user_id, "name": name, "rank": rank}).returning(section.c.id)

        result = await self.db_session.execute(query)
        await self.db_session.commit()

        return result.scalar()
