from datetime import time

import pkg_resources


def app_version(debug: bool) -> str:
    return str(time()) if debug else pkg_resources.get_distribution("yggdrasil").version
