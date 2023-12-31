from graphene import ObjectType, ResolveInfo
from graphql import FieldNode
from graphql.pyutils.convert_case import camel_to_snake
from pydantic import BaseModel

from yggdrasil.components.request_context import RequestContext
from yggdrasil.components.types import RequestScopeKeys


def get_field_name_list(node: FieldNode) -> list[str]:
    names = []
    for sub_field in node.selection_set.selections:
        if not isinstance(sub_field, FieldNode):
            continue
        if sub_field.selection_set:
            names += get_field_name_list(sub_field)
        else:
            names.append(camel_to_snake(sub_field.name.value))

    return [camel_to_snake(node.name.value) + "." + n for n in names]


def get_request_context(info: ResolveInfo) -> RequestContext:
    return info.context["request"].scope[RequestScopeKeys.CONTEXT]


def create_json_serializable_data(data):
    if isinstance(data, list):
        return [create_json_serializable_data(val) for val in data]
    elif isinstance(data, dict):
        return {key: create_json_serializable_data(val) for key, val in data.items()}
    elif isinstance(data, BaseModel):
        return data.model_dump()
    elif isinstance(data, ObjectType):
        return data.__dict__
    else:
        return data
