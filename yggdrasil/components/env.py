import os

from pydantic import BaseModel, Field


class EnvironmentSchema(BaseModel):
    dev_mode: bool = False
    config_file_path: str = Field()


def environment() -> EnvironmentSchema:
    data = {}
    for name, field in EnvironmentSchema.model_fields.items():
        env_key_name = env_key(name)
        data[name] = os.environ.get(env_key_name, field.default)

    return EnvironmentSchema(**data)


def env_key(name: str) -> str:
    assert name in EnvironmentSchema.model_fields
    return f"yggdrasil_{name}".upper()
