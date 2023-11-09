from asyncio import gather
from typing import Annotated

from pydantic import BaseModel, HttpUrl, StringConstraints, ValidationError, field_validator
from pydantic_core.core_schema import FieldValidationInfo
from sqlalchemy import insert, update, select, func

from yggdrasil.api.types import CommonMutationResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeConfig, NodeValidationError, NodeBase
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link, section
from yggdrasil.schema import LinkType


class Link(BaseModel):
    id: int | None = None
    title: Annotated[str, StringConstraints(min_length=2)]
    type: LinkType
    url: HttpUrl | None = None
    favicon: HttpUrl | None = None
    section_id: int
    rank: int
    link_group_id: int | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: HttpUrl, info: FieldValidationInfo):
        if value is None and info.data["type"] == LinkType.SINGLE:
            raise ValueError("url is mandatory if type is single")
        return value

    @field_validator("favicon")
    @classmethod
    def validate_favicon(cls, value: HttpUrl, info: FieldValidationInfo):
        if value is None and info.data["type"] == LinkType.GROUP:
            raise ValueError("favicon is mandatory if type is group")
        return value


class SaveLinkValidator(BaseModel):
    link: Link


class SaveLinkNode(NodeBase[SaveLinkValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=SaveLinkValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

        try:
            assert self.args
        except ValidationError as e:
            raise NodeValidationError(CommonMutationResult(errors=e.errors()))

        if self.args.link.id is not None:
            query = (
                select(func.count())
                .select_from(section)
                .join(link, section.c.id == link.c.section_id)
                .where(section.c.user_id == self.user_info.id, link.c.id == self.args.link.id)
            )
            if (await self.db_session.execute(query)).scalar() != 1:
                raise NodeValidationError(CommonMutationResult(errors=[Error(msg=f"Unknown link/section")]))

        query = (
            select(func.count())
            .select_from(section)
            .where(section.c.user_id == self.user_info.id, section.c.id == self.args.link.section_id)
        )
        if (await self.db_session.execute(query)).scalar() != 1:
            raise NodeValidationError(CommonMutationResult(errors=[Error(msg=f"Unknown section id")]))

    async def _get_current_section_id(self) -> int:
        query = select(link.c.section_id).where(link.c.id == self.args.link.id)
        result = await self.db_session.execute(query)
        return result.scalar()

    async def resolve(self):
        link_data = self.args.link.model_dump(exclude_unset=True, mode="json")
        queries = []

        if self.args.link.id is None:
            queries.append(insert(link).values(link_data))
        else:
            if await self._get_current_section_id() != self.args.link.section_id:
                queries.append(
                    update(link)
                    .where(link.c.link_group_id == self.args.link.id)
                    .values({"section_id": self.args.link.section_id})
                )

            queries.append(update(link).where(link.c.id == self.args.link.id).values(link_data))

        await gather(*[self.db_session.execute(query) for query in queries])
        await self.db_session.commit()

        return CommonMutationResult()
