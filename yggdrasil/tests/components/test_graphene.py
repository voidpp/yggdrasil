from typing import Annotated

import pytest
from graphene import String, List, NonNull
from pydantic import BaseModel, HttpUrl, StringConstraints

from yggdrasil.components.graphene.pydantic import object_type_from_pydantic, clear_type_registry


def test_generate_httpurl():
    class Example(BaseModel):
        title: str
        url: HttpUrl

    clear_type_registry()
    graphene_object = object_type_from_pydantic(Example)

    assert hasattr(graphene_object, "url")
    assert type(graphene_object.url) is String


def test_generate_string_constraint():
    class Example(BaseModel):
        title: Annotated[str, StringConstraints(min_length=2)]

    clear_type_registry()
    graphene_object = object_type_from_pydantic(Example)

    assert hasattr(graphene_object, "title")
    assert type(graphene_object.title) is String


@pytest.mark.skip
def test_generate_required_in_list():
    class Example(BaseModel):
        messages: list[str]

    clear_type_registry()
    graphene_object = object_type_from_pydantic(Example)

    messages_field: List = graphene_object.messages

    assert messages_field.kwargs.get("required") is True

    assert type(messages_field.of_type) == NonNull
