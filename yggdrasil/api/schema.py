from graphene import Schema

from yggdrasil.api.mutations import Mutation
from yggdrasil.api.queries import Query


def create_api_schema() -> Schema:
    api_schema = Schema(query=Query, mutation=Mutation)
    return api_schema
