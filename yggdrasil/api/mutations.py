from graphene import ObjectType

from yggdrasil.api.nodes.delete_link import DeleteLinkNode
from yggdrasil.api.nodes.delete_section import DeleteSectionNode
from yggdrasil.api.nodes.save_link import SaveLinkNode
from yggdrasil.api.nodes.save_section import SaveSectionNode


class Mutation(ObjectType):
    save_section = SaveSectionNode.field()
    save_link = SaveLinkNode.field()
    delete_section = DeleteSectionNode.field()
    delete_link = DeleteLinkNode.field()
