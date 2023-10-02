from typing import Annotated

from pydantic import BaseModel, HttpUrl, StringConstraints, ValidationError
from sqlalchemy import insert, update, select, func

from yggdrasil.api.types import SaveResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeConfig, NodeValidationError, NodeBase
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link, section


class Link(BaseModel):
    id: int = None
    title: Annotated[str, StringConstraints(min_length=2)]
    url: HttpUrl
    favicon: str = None
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
        if self.user_info is None:
            raise NodeValidationError(SaveResult(errors=[get_auth_error()]))

        try:
            assert self.args
        except ValidationError as e:
            raise NodeValidationError(SaveResult(errors=e.errors()))

        query = (
            select(func.count())
            .select_from(section)
            .where(section.c.user_id == self.user_info.id, section.c.id == self.args.link.section_id)
        )
        count = (await self.db_session.execute(query)).scalar()
        if count != 1:
            raise NodeValidationError(SaveResult(errors=[Error(msg="Unknown section id")]))

    async def resolve(self):
        link_data = self.args.link.model_dump(exclude_unset=True, mode="json")

        if self.args.link.id is None:
            query = insert(link).values(link_data)
        else:
            query = update(link).where(link.c.id == self.args.link.id).values(link_data)

        await self.db_session.execute(query)
        await self.db_session.commit()

        return SaveResult()
