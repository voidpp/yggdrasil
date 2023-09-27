from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.components.user_info import UserInfo


class WhoAmINode(NodeBase):
    config = NodeConfig(
        result_type=object_type_from_pydantic(UserInfo),
    )

    async def resolve(self):
        return self.user_info
