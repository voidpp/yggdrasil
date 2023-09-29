from graphene import List, NonNull
from pydantic import BaseModel
from sqlalchemy import select

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link, section
from yggdrasil.types import Link


class LinksValidator(BaseModel):
    section_id: int = None


class LinksNode(NodeBase[LinksValidator]):
    config = NodeConfig(
        result_type=List(NonNull(object_type_from_pydantic(Link))),
        input_validator=LinksValidator,
        field_extra={"required": True},
    )

    async def resolve(self):
        query = (
            select(link).join(section, section.c.id == link.c.section_id).where(section.c.user_id == self.user_info.id)
        )

        if self.args.section_id is not None:
            query = query.where(link.c.section_id == self.args.section_id)

        query = query.order_by(section.c.rank, link.c.rank)

        async with self.request_context.db.session() as session:
            result = await session.execute(query)

            return result.all()
