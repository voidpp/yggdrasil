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
