import pytest


@pytest.mark.asyncio
async def test_get_whoami(test_client):
    async with test_client.authenticate_user(sub="sub42"):
        result = await test_client.post("/api/", json={"query": "query { whoAmI { sub } }"})
        assert result.json()["data"]["whoAmI"]["sub"] == "sub42"


@pytest.mark.asyncio
async def test_get_whoami_no_auth(test_client):
    result = await test_client.post("/api/", json={"query": "query { whoAmI { sub } }"})

    assert result.json()["data"]["whoAmI"] is None
