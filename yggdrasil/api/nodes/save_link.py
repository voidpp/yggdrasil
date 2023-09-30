from pydantic import BaseModel
from sqlalchemy import insert, update

from yggdrasil.types import Link as LinkOutput
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link


class Link(BaseModel):
    id: int = None
    title: str
    url: str
    favicon: str
    section_id: int
    rank: int


class SaveLinkValidator(BaseModel):
    link: Link


class SaveLinkNode(NodeBase[SaveLinkValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(LinkOutput),
        input_validator=SaveLinkValidator,
    )

    async def validate(self):
        # TODO: check if the section belongs to the current user
        pass

    async def resolve(self):
        # TODO: auth
        link_data = self.args.link.model_dump(exclude_unset=True)

        if self.args.link.id is None:
            query = insert(link).values(link_data).returning(link.c.id)
        else:
            query = update(link).where(link.c.id == self.args.link.id).values(link_data)

        async with self.request_context.db.session() as session:
            result = await session.execute(query)
            if self.args.link.id is None:
                self.args.link.id = result.scalar()
            await session.commit()

        return LinkOutput(**self.args.link.model_dump())
