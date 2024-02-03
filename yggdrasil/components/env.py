from datek_app_utils.env_config.base import BaseConfig
from datek_app_utils.env_config.types import Bool


class EnvConfig(BaseConfig):
    YGGDRASIL_DEV_MODE: Bool
    YGGDRASIL_CONFIG_FILE_PATH: str

    @classmethod
    def to_str(cls) -> str:
        parts = [
            f"{variable.name}={variable.value}"
            for variable in cls
        ]

        return "\n".join(parts)
