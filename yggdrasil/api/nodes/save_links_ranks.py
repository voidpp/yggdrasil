from graphene import Boolean
from pydantic import BaseModel
from sqlalchemy import update

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.db_tables import link


class SaveLinksRanksValidator(BaseModel):
    link_ids: list[int]


class SaveLinksRanksNode(NodeBase[SaveLinksRanksValidator]):
    config = NodeConfig(
        result_type=Boolean,
        input_validator=SaveLinksRanksValidator,
    )

    async def resolve(self):
        # TODO: auth, check link id ownership

        async with self.request_context.db.session() as session:
            for index, link_id in enumerate(self.args.link_ids):
                await session.execute(update(link).where(link.c.id == link_id).values({"rank": index}))
            await session.commit()

        return True
