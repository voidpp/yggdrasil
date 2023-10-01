from sqlalchemy import insert

from yggdrasil.components.database import Database
from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_tables import section


class Populator:
    def __init__(self, db: Database):
        self.db = db

    async def add_user(self, user: UserInfo):
        await user.store(self.db)

    async def add_section(self, user_id: int, name: str = "", rank: int = 0) -> int:
        query = insert(section).values({"user_id": user_id, "name": name, "rank": rank}).returning(section.c.id)

        async with self.db.session() as session:
            result = await session.execute(query)
            await session.commit()

            return result.scalar()
