from pydantic import BaseModel
from sqlalchemy import update

from yggdrasil.api.types import SaveResult
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link


class SaveLinksRanksValidator(BaseModel):
    link_ids: list[int]


class SaveLinksRanksNode(NodeBase[SaveLinksRanksValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(SaveResult),
        input_validator=SaveLinksRanksValidator,
    )

    async def resolve(self):
        # TODO: auth, check link id ownership

        async with self.request_context.db.session() as session:
            for index, link_id in enumerate(self.args.link_ids):
                await session.execute(update(link).where(link.c.id == link_id).values({"rank": index}))
            await session.commit()

        return SaveResult()
