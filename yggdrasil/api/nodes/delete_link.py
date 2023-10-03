from pydantic import BaseModel
from sqlalchemy import delete, func, select

from yggdrasil.api.types import CommonMutationResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link, section


class DeleteLinkValidator(BaseModel):
    id: int


class DeleteLinkNode(NodeBase[DeleteLinkValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=DeleteLinkValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

        query = (
            select(func.count())
            .select_from(link)
            .join(section, section.c.id == link.c.section_id)
            .where(section.c.user_id == self.user_info.id, link.c.id == self.args.id)
        )
        if (await self.db_session.execute(query)).scalar() != 1:
            raise NodeValidationError(CommonMutationResult(errors=[Error(msg=f"Unknown link")]))

    async def resolve(self):
        query = delete(link).where(link.c.id == self.args.id)

        await self.db_session.execute(query)
        await self.db_session.commit()

        return CommonMutationResult()
