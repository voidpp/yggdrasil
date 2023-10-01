from typing import Annotated

from pydantic import BaseModel, HttpUrl, StringConstraints, ValidationError
from sqlalchemy import insert, update

from yggdrasil.api.types import SaveResult
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link


class Link(BaseModel):
    id: int = None
    title: Annotated[str, StringConstraints(min_length=2)]
    url: HttpUrl
    favicon: HttpUrl = None
    section_id: int
    rank: int


class SaveLinkValidator(BaseModel):
    link: Link


class SaveLinkNode(NodeBase[SaveLinkValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(SaveResult),
        input_validator=SaveLinkValidator,
    )

    async def validate(self):
        try:
            assert self.args
        except ValidationError as e:
            raise NodeValidationError(SaveResult(errors=e.errors()))

        # TODO: check and test section_id is belongs to user

    async def resolve(self):
        link_data = self.args.link.model_dump(exclude_unset=True, mode="json")

        if self.args.link.id is None:
            query = insert(link).values(link_data)
        else:
            query = update(link).where(link.c.id == self.args.link.id).values(link_data)

        async with self.request_context.db.session() as session:
            await session.execute(query)
            await session.commit()

        return SaveResult()
