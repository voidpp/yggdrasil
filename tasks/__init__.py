from invoke import Collection

from tasks import api, top, ui

ns = Collection.from_module(top)

ns.add_collection(Collection.from_module(api))
ns.add_collection(Collection.from_module(ui))
