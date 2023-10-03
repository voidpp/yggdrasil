from enum import Enum

from pydantic import BaseModel


class Section(BaseModel):
    id: int
    name: str
    rank: int


class Link(BaseModel):
    id: int
    title: str
    url: str
    favicon: str = None
    section_id: int
    rank: int


class BoardBackgroundType(Enum):
    COLOR = "COLOR"
    IMAGE = "IMAGE"
    EARTHPORN = "EARTHPORN"


class BoardBackground(BaseModel):
    type: BoardBackgroundType
    value: str


class BoardSettings(BaseModel):
    background: BoardBackground
