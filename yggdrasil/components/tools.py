from datetime import time

from importlib.metadata import version


def app_version(debug: bool) -> str:
    return str(time()) if debug else version("yggdrasil")
