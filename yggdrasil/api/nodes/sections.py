from graphene import List, NonNull
from sqlalchemy import select

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import section
from yggdrasil.schema import Section


class SectionsNode(NodeBase):
    config = NodeConfig(
        result_type=List(NonNull(object_type_from_pydantic(Section))),
        field_extra={"required": True},
    )

    async def resolve(self):
        query = select(section).where(section.c.user_id == self.user_info.id).order_by(section.c.rank)

        result = await self.db_session.execute(query)

        return result.all()
