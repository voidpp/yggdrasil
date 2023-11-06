from enum import Enum

from pydantic import BaseModel


class Section(BaseModel):
    id: int
    name: str
    rank: int


class LinkType(Enum):
    SINGLE = "SINGLE"
    GROUP = "GROUP"


class Link(BaseModel):
    id: int
    title: str
    url: str = None
    favicon: str = None
    section_id: int
    rank: int
    type: LinkType
    link_group_id: int = None


class BoardBackgroundType(Enum):
    COLOR = "COLOR"
    IMAGE = "IMAGE"
    EARTHPORN = "EARTHPORN"


class BoardBackground(BaseModel):
    type: BoardBackgroundType
    value: str


class BoardSettings(BaseModel):
    background: BoardBackground
