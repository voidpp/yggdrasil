from graphene import Field, ObjectType, ResolveInfo, String, List, NonNull
from starlette.requests import Request

from yggdrasil.api.nodes.board_settings import BoardSettingsNode
from yggdrasil.api.nodes.earth_porn_images import EarthPornImagesNode
from yggdrasil.api.nodes.links import LinksNode
from yggdrasil.api.nodes.sections import SectionsNode
from yggdrasil.api.nodes.who_am_i import WhoAmINode
from yggdrasil.components.graphene.tools import get_request_context
from yggdrasil.components.tools import app_version


async def ping(root, info: ResolveInfo):
    return "pong"


async def version(root, info: ResolveInfo):
    request: Request = info.context["request"]
    return app_version(request.app.debug)


class AuthClient(ObjectType):
    name = Field(String, required=True)
    icon = Field(String, required=True)


async def auth_clients(root, info: ResolveInfo):
    request_context = get_request_context(info)
    return [{"name": name, "icon": client.icon} for name, client in request_context.config.auth_clients.items()]


class Query(ObjectType):
    ping = Field(String, resolver=ping)
    version = Field(String, resolver=version)
    auth_clients = List(NonNull(AuthClient), resolver=auth_clients)
    who_am_i = WhoAmINode.field()
    sections = SectionsNode.field()
    links = LinksNode.field()
    board_settings = BoardSettingsNode.field()
    earth_porn_images = EarthPornImagesNode.field()
