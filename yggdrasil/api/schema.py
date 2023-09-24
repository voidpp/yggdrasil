from graphene import Schema

from yggdrasil.api.queries import Query


def create_api_schema() -> Schema:
    api_schema = Schema(query=Query)
    return api_schema
