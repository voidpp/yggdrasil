from pydantic import BaseModel
from sqlalchemy import update, select, func

from yggdrasil.api.types import CommonMutationResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import link, section


class SaveLinksRanksValidator(BaseModel):
    link_ids: list[int]


class SaveLinksRanksNode(NodeBase[SaveLinksRanksValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=SaveLinksRanksValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

        query = (
            select(link.c.id)
            .join(section, section.c.id == link.c.section_id)
            .where(link.c.id.in_(self.args.link_ids), section.c.user_id == self.user_info.id)
        )

        recv_ids = set(self.args.link_ids)
        rows = await self.db_session.execute(query)
        known_ids = {row.id for row in rows}

        unknown_ids = recv_ids - known_ids

        if unknown_ids:
            raise NodeValidationError(CommonMutationResult(errors=[Error(msg=f"Unknown ids: {list(unknown_ids)}")]))

    async def resolve(self):
        for index, link_id in enumerate(self.args.link_ids):
            await self.db_session.execute(update(link).where(link.c.id == link_id).values({"rank": index}))
        await self.db_session.commit()

        return CommonMutationResult()
