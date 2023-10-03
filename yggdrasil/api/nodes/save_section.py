from pydantic import BaseModel
from sqlalchemy import insert, update, select, func

from yggdrasil.api.types import CommonMutationResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
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
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=SaveSectionValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

        if self.args.section.id is not None:
            result = await self.db_session.execute(
                select(func.count())
                .select_from(section)
                .where(section.c.user_id == self.user_info.id, section.c.id == self.args.section.id)
            )
            if result.scalar() != 1:
                raise NodeValidationError(
                    CommonMutationResult(errors=[Error(msg=f"Unknown id: {self.args.section.id}")])
                )

    async def resolve(self):
        section_data = self.args.section.model_dump(exclude_unset=True)

        if self.args.section.id is None:
            query = insert(section).values({"user_id": self.user_info.id, **section_data})
        else:
            query = update(section).where(section.c.id == self.args.section.id).values(section_data)

        await self.db_session.execute(query)
        await self.db_session.commit()

        return CommonMutationResult()
