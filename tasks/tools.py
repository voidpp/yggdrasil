import invoke


class Collection(invoke.Collection):
    def task(self, *args, **kwargs):
        def decor(func):
            self.add_task(invoke.Task(func, *args, **kwargs))
            return func

        return decor


def generate_graphql_schema():
    from yggdrasil.components.folders import Folders
    from yggdrasil.api.schema import create_api_schema

    path = Folders.frontend / "schema.graphql"
    path.write_text(str(create_api_schema()))
    print(f"{path.relative_to(Folders.project_root)} has been written!")
