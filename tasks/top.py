from invoke import task
import shutil


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
