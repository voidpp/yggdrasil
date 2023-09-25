from starlette.requests import Request
from starlette.templating import Jinja2Templates

from yggdrasil.components.env import environment
from yggdrasil.components.folders import Folders
from yggdrasil.components.tools import app_version
from yggdrasil.components.request_context import RequestContext
from yggdrasil.components.types import RequestScopeKeys

templates = Jinja2Templates(Folders.templates)


async def index(request: Request):
    context: RequestContext = request.scope[RequestScopeKeys.CONTEXT]
    env = environment()
    return templates.TemplateResponse(
        name="index.html",
        context={
            "request": request,
            "is_dev": env.dev_mode,
            "app_version": app_version(),
            "oauth_client_names": list(context.config.auth_clients.keys()),
        },
    )
