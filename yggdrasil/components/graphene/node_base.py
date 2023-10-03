import base64
from abc import ABCMeta, abstractmethod
from dataclasses import dataclass, field
from datetime import timedelta
from functools import cached_property
from typing import Generic, Type, TypeVar

import orjson
from graphene import Field, InputObjectType, ResolveInfo
from graphene.utils.orderedtype import OrderedType
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from .pydantic import create_class_property_dict
from .tools import get_field_name_list, get_request_context
from ..request_context import RequestContext
from ..types import RequestScopeKeys

InputType = TypeVar("InputType")


class NoArgumentsDefinedError(Exception):
    pass


class NodeValidationError(Exception):
    def __init__(self, result):
        super().__init__("NodeValidationError")
        self.result = result


@dataclass
class NodeConfig:
    result_type: OrderedType | type
    input_validator: Type[BaseModel] = None
    description: str = None
    cache_expiry_time: timedelta = None
    field_extra: dict = field(default_factory=dict)


class _NodeConfigChecker(ABCMeta):
    def __new__(cls, name, bases, dct):
        created_class = super().__new__(cls, name, bases, dct)
        if "NodeBase" in [base.__name__ for base in bases]:
            if type(dct.get("config")) != NodeConfig:
                raise Exception(
                    f"Node configuration is missing from {name}! Add a config attribute with NodeConfig instance."
                )
        return created_class


class Plugin:
    pass


class NodeBase(Generic[InputType], metaclass=_NodeConfigChecker):
    config: NodeConfig

    _info: ResolveInfo
    _args: InputType = None

    def __init__(self, root, info, **kwargs):
        self._root = root
        self._info = info

        self._kwargs = kwargs

    @abstractmethod
    async def resolve(self):
        pass

    @cached_property
    def field_names(self):
        field_names = get_field_name_list(self._info.field_nodes[0])
        return [fn.split(".") for fn in field_names]

    def is_field_queried(self, node_name: str):
        for node_name_list in self.field_names:
            if node_name in node_name_list:
                return True
        return False

    @property
    def db_session(self) -> AsyncSession:
        return self._info.context["request"].scope[RequestScopeKeys.DATABASE_SESSION]

    @property
    def request_context(self) -> RequestContext:
        return get_request_context(self._info)

    @property
    def user_info(self):
        return self.request_context.auth.get_user(self.http_request)

    @property
    def http_request(self) -> Request:
        return self._info.context["request"]

    @property
    def args(self) -> InputType:
        if not self.config.input_validator:
            raise NoArgumentsDefinedError
        if self._args:
            return self._args
        self._args = self.config.input_validator(**self._kwargs)
        return self._args

    async def validate(self):
        pass

    @classmethod
    async def _resolve(cls, root, info, **kwargs):
        obj = cls(root, info, **kwargs)

        try:
            await obj.validate()
        except NodeValidationError as e:
            return e.result

        result = await obj.resolve()

        return result

    @cached_property
    def cache_key(self) -> str:
        key = self.__class__.__name__
        if self._kwargs:
            sorted_args = dict(sorted(self._kwargs.items()))
            key += "_" + base64.encodebytes(orjson.dumps(sorted_args)).decode()
        return key

    @classmethod
    def field(cls) -> Field:
        return Field(
            type_=cls.config.result_type,
            args=create_class_property_dict(cls.config.input_validator, sub_type=InputObjectType)
            if cls.config.input_validator
            else None,
            resolver=cls._resolve,
            description=cls.config.description,
            **cls.config.field_extra,
        )
