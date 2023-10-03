from pydantic import BaseModel, Field


class Error(BaseModel):
    msg: str
    type: str = ""
    loc: list[str] = Field(default_factory=list)
    ctx: dict = Field(default_factory=dict)


def get_auth_error():
    return Error(msg="Authentication needed")


class CommonMutationResult(BaseModel):
    errors: list[Error] = Field(default_factory=list)
