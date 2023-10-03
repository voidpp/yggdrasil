import pytest

from yggdrasil.api.types import get_auth_error

query = """
mutation DeleteSection($id: Int!) { 
    deleteSection(id: $id) { 
        errors { 
            msg 
        } 
    } 
}
"""


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = test_client.query(query, {"id": 0})

    assert result["data"]["deleteSection"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_success(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)

    result = test_client.query(query, {"id": section_id})

    assert result["data"]["deleteSection"]["errors"] == []
    assert len(await populator.list_sections(section_ids={section_id})) == 0


@pytest.mark.asyncio
async def test_other_user_section(test_client, populator):
    async with test_client.authenticate_user() as mulder:
        section_id = await populator.add_section(mulder.id)

    async with test_client.authenticate_user():
        result = test_client.query(query, {"id": section_id})
        assert result["data"]["deleteSection"]["errors"][0]["msg"] == "Unknown section"
