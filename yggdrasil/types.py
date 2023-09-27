from pydantic import BaseModel


class Section(BaseModel):
    id: int
    name: str
    rank: int


class Link(BaseModel):
    id: int
    title: str
    url: str
    favicon: str
    section_id: int
    rank: int
