from pydantic import BaseModel
from sqlalchemy import insert, update

from yggdrasil.api.types import SaveResult
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import section


class Section(BaseModel):
    id: int = None
    name: str
    rank: int


class SaveSectionValidator(BaseModel):
    section: Section


class SaveSectionNode(NodeBase[SaveSectionValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(SaveResult),
        input_validator=SaveSectionValidator,
    )

    async def resolve(self):
        # TODO: auth

        section_data = self.args.section.model_dump(exclude_unset=True)

        if self.args.section.id is None:
            query = insert(section).values({"user_id": self.user_info.id, **section_data})
        else:
            query = update(section).where(section.c.id == self.args.section.id).values(section_data)

        async with self.request_context.db.session() as session:
            await session.execute(query)
            await session.commit()

        return SaveResult()
