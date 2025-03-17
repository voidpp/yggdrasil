from datetime import timedelta

from graphene import List, NonNull
from yggdrasil.components.graphene.node_base import NodeBase, NodeConfig
from yggdrasil.components.graphene.pydantic import object_type_from_pydantic
from yggdrasil.components.reddit import get_earth_porn_json, get_earth_porn_images, EarthPornImage


class EarthPornImagesNode(NodeBase):
    config = NodeConfig(
        result_type=List(NonNull(object_type_from_pydantic(EarthPornImage))),
        cache_expiry_time=timedelta(hours=24),
    )

    async def resolve(self):
        self.request_context.config.reddit
        data = await get_earth_porn_json()
        return get_earth_porn_images(data)
