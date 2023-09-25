from invoke import Collection

from tasks import api, top

ns = Collection.from_module(top)

api_collection = Collection.from_module(api)
ns.add_collection(api_collection)
