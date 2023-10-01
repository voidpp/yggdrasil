from pydantic import BaseModel
from sqlalchemy import update

from yggdrasil.api.types import SaveResult
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import section


class SaveSectionsRanksValidator(BaseModel):
    section_ids: list[int]


class SaveSectionsRanksNode(NodeBase[SaveSectionsRanksValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(SaveResult),
        input_validator=SaveSectionsRanksValidator,
    )

    async def resolve(self):
        # TODO: auth, check section id ownership

        async with self.request_context.db.session() as session:
            for index, section_id in enumerate(self.args.section_ids):
                await session.execute(update(section).where(section.c.id == section_id).values({"rank": index}))
            await session.commit()

        return SaveResult()
