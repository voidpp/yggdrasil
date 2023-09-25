from graphene import Field, ObjectType, ResolveInfo, String
from starlette.requests import Request

from yggdrasil.api.nodes.who_am_i import WhoAmINode
from yggdrasil.components.tools import app_version


async def ping(root, info: ResolveInfo):
    return "pong"


async def version(root, info: ResolveInfo):
    request: Request = info.context["request"]
    return app_version(request.app.debug)


class Query(ObjectType):
    ping = Field(String, resolver=ping)

    version = Field(String, resolver=version)

    who_am_i = WhoAmINode.field()
