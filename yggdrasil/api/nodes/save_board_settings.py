from pydantic import BaseModel
from sqlalchemy import update

from yggdrasil.api.types import CommonMutationResult, get_auth_error
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig, NodeValidationError
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import user
from yggdrasil.schema import BoardSettings


class SaveBoardSettingsValidator(BaseModel):
    board_settings: BoardSettings


class SaveBoardSettingsNode(NodeBase[SaveBoardSettingsValidator]):
    config = NodeConfig(
        result_type=object_type_from_pydantic(CommonMutationResult),
        input_validator=SaveBoardSettingsValidator,
    )

    async def validate(self):
        if self.user_info is None:
            raise NodeValidationError(CommonMutationResult(errors=[get_auth_error()]))

    async def resolve(self):
        query = (
            update(user)
            .values(
                {
                    "board_background_type": self.args.board_settings.background.type,
                    "board_background_value": self.args.board_settings.background.value,
                }
            )
            .where(user.c.id == self.user_info.id)
        )
        await self.db_session.execute(query)
        await self.db_session.commit()

        return CommonMutationResult()
