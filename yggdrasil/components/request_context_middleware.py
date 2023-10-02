from starlette.types import ASGIApp, Scope, Receive, Send

from yggdrasil.components.request_context import RequestContext
from yggdrasil.components.types import RequestScopeKeys


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp, context_data: RequestContext):
        self.app = app
        self._context_data = context_data

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        scope[RequestScopeKeys.CONTEXT] = self._context_data

        async with self._context_data.db.session() as session:
            scope[RequestScopeKeys.DATABASE_SESSION] = session
            await self.app(scope, receive, send)
