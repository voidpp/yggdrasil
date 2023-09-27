from pydantic import BaseModel
from sqlalchemy import select, update, insert

from yggdrasil.components.database import Database
from yggdrasil.db_tables import user


class UserInfo(BaseModel):
    sub: str
    email: str
    given_name: str
    family_name: str
    picture: str
    locale: str
    id: int = None

    @property
    def name(self):
        names = [self.family_name, self.given_name]
        if self.locale != "hu":
            names.reverse()
        return " ".join(names)

    async def store(self, db: Database):
        async with db.session() as session:
            user_data = (await session.execute(select(user).where(user.c.sub == self.sub))).first()

            model_data = self.model_dump(exclude_none=True)

            if user_data:
                await session.execute(update(user).where(user.c.id == user_data.id).values(**model_data))
                self.id = user_data.id
            else:
                result = await session.execute(insert(user).values(**model_data).returning(user.c.id))
                self.id = result.scalar()

            await session.commit()
