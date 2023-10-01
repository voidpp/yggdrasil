from starlette.testclient import TestClient
from starlette.types import ASGIApp, Scope, Receive, Send


def get_fake_session_middleware(session_data: dict):
    class FakeSessionMiddleware:
        def __init__(self, app: ASGIApp, **kwargs) -> None:
            self.app = app

        async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
            scope["session"] = session_data
            await self.app(scope, receive, send)

    return FakeSessionMiddleware


class YggdarsilTestClient(TestClient):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    def query(self, query_string: str, variables: dict = None):
        data = {"query": query_string}

        if variables is not None:
            data["variables"] = variables

        return self.post("/api", json=data).json()
