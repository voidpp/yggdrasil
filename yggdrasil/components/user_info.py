from pydantic import BaseModel
from sqlalchemy import select, update, insert
from sqlalchemy.ext.asyncio import AsyncSession

from yggdrasil.components.database import Database
from yggdrasil.db_tables import user
from yggdrasil.schema import BoardBackgroundType


class UserInfo(BaseModel):
    sub: str
    email: str
    given_name: str
    family_name: str
    picture: str
    locale: str | None = None
    id: int | None = None

    @property
    def name(self):
        # FIXME: we are not getting the locale anymore
        names = [self.family_name, self.given_name]
        if self.locale != "hu":
            names.reverse()
        return " ".join(names)

    async def store(self, session: AsyncSession):
        user_data = (await session.execute(select(user).where(user.c.sub == self.sub))).first()

        model_data = self.model_dump(exclude_none=True)

        if user_data:
            await session.execute(update(user).where(user.c.id == user_data.id).values(**model_data))
            self.id = user_data.id
        else:
            model_data.update(
                {
                    "board_background_type": BoardBackgroundType.COLOR,
                    "board_background_value": "#555555",
                }
            )
            result = await session.execute(insert(user).values(**model_data).returning(user.c.id))
            self.id = result.scalar()

        await session.commit()
