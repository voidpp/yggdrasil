from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_tables import section, link
from yggdrasil.schema import Link, Section, LinkType


class Populator:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def add_user(self, user: UserInfo):
        await user.store(self.db_session)

    async def add_section(self, user_id: int, name: str = "", rank: int = 0) -> int:
        query = insert(section).values({"user_id": user_id, "name": name, "rank": rank}).returning(section.c.id)

        result = await self.db_session.execute(query)

        return result.scalar()

    async def add_link(
        self,
        section_id: int,
        title: str = "Google",
        url: str = "https://google.com",
        rank: int = 0,
        type: LinkType = LinkType.SINGLE,
        link_group_id: int = None,
    ) -> int:
        query = (
            insert(link)
            .values(
                {
                    "section_id": section_id,
                    "title": title,
                    "url": url,
                    "rank": rank,
                    "link_group_id": link_group_id,
                    "type": type.value,
                }
            )
            .returning(link.c.id)
        )

        result = await self.db_session.execute(query)

        return result.scalar()

    async def list_links(self, link_ids: set[int] = None, section_ids: set[int] = None) -> list[Link]:
        query = select(link)

        if link_ids is not None:
            query = query.where(link.c.id.in_(link_ids))

        if section_ids is not None:
            query = query.where(link.c.section_id.in_(section_ids))

        result = await self.db_session.execute(query)

        return [Link.model_construct(**row._asdict()) for row in result]

    async def list_sections(self, section_ids: set[int] = None, user_id: int = None) -> list[Section]:
        query = select(section)

        if section_ids is not None:
            query = query.where(section.c.id.in_(section_ids))

        if user_id is not None:
            query = query.where(section.c.user_id == user_id)

        result = await self.db_session.execute(query)

        return [Section.model_construct(**row._asdict()) for row in result]
