from graphene import Boolean
from pydantic import BaseModel
from sqlalchemy import update

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.db_tables import user
from yggdrasil.types import BoardSettings


class SaveBoardSettingsValidator(BaseModel):
    board_settings: BoardSettings


class SaveBoardSettingsNode(NodeBase[SaveBoardSettingsValidator]):
    config = NodeConfig(
        result_type=Boolean,
        input_validator=SaveBoardSettingsValidator,
    )

    async def resolve(self):
        async with self.request_context.db.session() as session:
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
            await session.execute(query)
            await session.commit()

        return True
