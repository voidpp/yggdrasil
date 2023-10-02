from graphene import Boolean
from pydantic import BaseModel
from sqlalchemy import delete

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.db_tables import section


class DeleteSectionValidator(BaseModel):
    id: int


class DeleteSectionNode(NodeBase[DeleteSectionValidator]):
    config = NodeConfig(
        result_type=Boolean,
        input_validator=DeleteSectionValidator,
    )

    async def validate(self):
        # TODO: check if the section belongs to the current user
        pass

    async def resolve(self):
        # TODO: auth

        query = delete(section).where(section.c.id == self.args.id)

        await self.db_session.execute(query)
        await self.db_session.commit()

        return True
