from sqlalchemy import select

from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.db_tables import user
from yggdrasil.schema import BoardSettings, BoardBackground


class BoardSettingsNode(NodeBase):
    config = NodeConfig(
        result_type=object_type_from_pydantic(BoardSettings),
    )

    async def resolve(self):
        if self.user_info is None:
            return None

        query = select(user).where(user.c.id == self.user_info.id)
        query_result = await self.db_session.execute(query)
        user_data = query_result.first()

        bg_data = BoardBackground(type=user_data.board_background_type, value=user_data.board_background_value)

        return BoardSettings(background=bg_data)
