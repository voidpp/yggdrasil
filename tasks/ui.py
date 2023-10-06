from invoke import task


@task
def generate_queries_types(c):
    """Generate types for GraphQL queries"""

    from yggdrasil.components.folders import Folders

    with c.cd(Folders.frontend):
        c.run("npm run compile")


@task
def start(c):
    """Start vite thingy"""

    from yggdrasil.components.folders import Folders

    with c.cd(Folders.frontend):
        c.run("npm run dev")
