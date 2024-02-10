import shutil

from invoke import task


@task
def build(c):
    """Build the whole damn thing"""
    from yggdrasil.components.folders import Folders
    from .api import generate_graphql_schema
    from .ui import generate_queries_types

    generate_graphql_schema(c)
    generate_queries_types(c)

    with c.cd(Folders.frontend):
        c.run("npm run build")

    ui_dist = Folders.root / "ui-dist"
    if ui_dist.exists():
        shutil.rmtree(ui_dist)
    shutil.copytree(Folders.frontend / "dist", ui_dist)

    c.run("poetry build")

    shutil.rmtree(ui_dist)


@task
def generate_next_version(c):
    """Generate next version string based on git tags and commits"""
    from git import Repo
    from semver import VersionInfo

    repo = Repo(".")

    max_tag_version = max([tag for tag in repo.tags], key=lambda t: VersionInfo.parse(t.name))

    prefixes = []

    for commit in repo.iter_commits("master"):
        prefixes.append(commit.message.split(":")[0])
        if max_tag_version.commit == commit:
            break

    last_version: VersionInfo = VersionInfo.parse(max_tag_version.name)

    if "enh" in prefixes:
        next_version = last_version.bump_minor()
    elif "fix" in prefixes:
        next_version = last_version.bump_patch()
    else:
        raise Exception("Only minor and patch bump is implemented right now!")

    print(next_version)


@task
def print_parsed_db_url_env_vars(c):
    from datek_app_utils.env_config.utils import validate_config
    from urllib.parse import urlparse
    from yggdrasil.components.app_config import load_app_config
    from yggdrasil.components.env import EnvConfig

    validate_config(EnvConfig)
    app_config = load_app_config(EnvConfig.YGGDRASIL_CONFIG_FILE_PATH)
    parsed_url = urlparse(app_config.database_url)

    parts = [
        f"YGGDRASIL_POSTGRES_HOST={parsed_url.hostname}",
        f"YGGDRASIL_POSTGRES_PORT={parsed_url.port or 5432}",
        f"YGGDRASIL_POSTGRES_USER={parsed_url.username}",
        f"YGGDRASIL_POSTGRES_PASSWORD={parsed_url.password}",
        f"YGGDRASIL_POSTGRES_DB={parsed_url.path.removeprefix('/')}",
    ]

    print("\n".join(parts))
