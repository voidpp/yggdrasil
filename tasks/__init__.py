from invoke import Collection

from tasks import api, top, ui, redis_

ns = Collection.from_module(top)

ns.add_collection(Collection.from_module(redis_, name="redis"))
ns.add_collection(Collection.from_module(api))
ns.add_collection(Collection.from_module(ui))
