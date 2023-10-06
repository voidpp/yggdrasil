from invoke import task
from shlex import join


@task
def generate_graphql_schema(c):
    """Generate the API GraphQL schema file"""
    from .tools import generate_graphql_schema

    generate_graphql_schema()


@task
def start(c, port=6000, reload=True):
    """Run the API server with uvicorn"""

    commands = [
        "uvicorn",
        "--factory",
        "yggdrasil.app:get_app",
        "--host",
        "0.0.0.0",
        "--port",
        str(port),
    ]

    if reload:
        commands.append("--reload")

    c.run(join(commands))
