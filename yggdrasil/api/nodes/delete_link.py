from graphene import Boolean
from pydantic import BaseModel
from sqlalchemy import delete

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.db_tables import link


class DeleteLinkValidator(BaseModel):
    id: int


class DeleteLinkNode(NodeBase[DeleteLinkValidator]):
    config = NodeConfig(
        result_type=Boolean,
        input_validator=DeleteLinkValidator,
    )

    async def validate(self):
        # TODO: check if the section belongs to the current user
        pass

    async def resolve(self):
        query = delete(link).where(link.c.id == self.args.id)

        await self.db_session.execute(query)
        await self.db_session.commit()

        return True
