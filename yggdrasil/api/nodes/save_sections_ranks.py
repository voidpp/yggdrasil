from pydantic import BaseModel
from sqlalchemy import update, select

from yggdrasil.api.types import CommonMutationResult, get_auth_error, Error
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import section


class SaveSectionsRanksValidator(BaseModel):
    section_ids: list[int]


class SaveSectionsRanksNode(NodeBase[SaveSectionsRanksValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=SaveSectionsRanksValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

        query = select(section.c.id).where(
            section.c.id.in_(self.args.section_ids),
            section.c.user_id == self.user_info.id,
        )

        recv_ids = set(self.args.section_ids)
        rows = await self.db_session.execute(query)
        known_ids = {row.id for row in rows}

        unknown_ids = recv_ids - known_ids

        if unknown_ids:
            raise NodeValidationError(CommonMutationResult(errors=[Error(msg=f"Unknown ids: {list(unknown_ids)}")]))

    async def resolve(self):
        for index, section_id in enumerate(self.args.section_ids):
            await self.db_session.execute(update(section).where(section.c.id == section_id).values({"rank": index}))
        await self.db_session.commit()

        return CommonMutationResult()
