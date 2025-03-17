from datetime import timedelta

from graphene import List, NonNull
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.components.reddit import get_earth_porn_images, EarthPornImage


class EarthPornImagesNode(NodeBase):
    config = NodeConfig(
        result_type=List(NonNull(object_type_from_pydantic(EarthPornImage))),
        cache_expiry_time=timedelta(hours=24),
    )

    async def resolve(self):
        if self.request_context.config.reddit is None:
            return []
        return await get_earth_porn_images(self.request_context.config.reddit)
