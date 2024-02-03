from invoke import task

from yggdrasil.components.env import EnvConfig


def get_redis_client():
    from yggdrasil.components.app_config import load_app_config
    import redis

    config = load_app_config(EnvConfig.YGGDRASIL_CONFIG_FILE_PATH)

    return redis.from_url(config.redis_url)


@task()
def list(c, filter="*"):
    """List redis keys"""

    from tabulate import tabulate

    redis_client = get_redis_client()

    rows = []

    keys = redis_client.keys(filter)
    if not keys:
        print("no results found")
        return
    data = redis_client.mget(*keys)
    for [key, value] in zip(keys, data):
        rows.append([key.decode(), len(value)])
    print(tabulate(rows, headers=["key", "value length"], tablefmt="psql"))


@task()
def delete(c, key):
    """Delete a redis value by a key name"""
    redis_client = get_redis_client()

    res = redis_client.delete(key.encode())
    if res:
        print(f"'{key}' is deleted")
    else:
        print(f"'{key}' not found")


@task()
def show(c, key):
    """View redis value by a key name"""
    import json

    redis_client = get_redis_client()

    data = redis_client.get(key)
    print(json.dumps(json.loads(data), indent=2))
