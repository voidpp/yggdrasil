from datetime import time

import importlib.metadata


def app_version(debug: bool) -> str:
    return str(time()) if debug else importlib.metadata.version("yggdrasil")
