from abc import ABC
from typing import TypeVar, Generic

from yggdrasil.api.types import SaveResult, get_auth_error
from yggdrasil.components.graphene.node_base import NodeBase, NodeValidationError

InputType = TypeVar("InputType")

# TODO: solve this
# ImportError: cannot import name 'SaveNodeBase' from 'yggdrasil.api.nodes.utils'
# (/Users/voidpp/devel/yggdrasil/yggdrasil/api/nodes/utils.py)

# class SaveNodeBase(Generic[InputType], NodeBase[InputType], ABC):
#     def check_user(self):
#         if self.user_info is None:
#             raise NodeValidationError(SaveResult(errors=[get_auth_error()]))
