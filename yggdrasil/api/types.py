from pydantic import BaseModel, Field


class Error(BaseModel):
    type: str
    loc: list[str]
    msg: str
    ctx: dict


class SaveResult(BaseModel):
    errors: list[Error] = Field(default_factory=list)
