from invoke import task


@task
def generate_graphql_schema(c):
    """Generate the API GraphQL schema file"""
    from .tools import generate_graphql_schema

    generate_graphql_schema()
