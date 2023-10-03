import pytest

from yggdrasil.api.types import get_auth_error

query = """
mutation SaveSection($section: SectionInput) { 
    saveSection(section: $section) { 
        errors { 
            msg 
        } 
    } 
}
"""


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = test_client.query(query, {"section": {"name": "", "rank": 0}})

    assert result["data"]["saveSection"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_create_section(test_client, populator, authenticated_user):
    result = test_client.query(query, {"section": {"name": "", "rank": 0}})
    assert result["data"]["saveSection"]["errors"] == []
    result = await populator.list_sections(user_id=authenticated_user.id)
    assert len(result)


@pytest.mark.asyncio
async def test_update_own(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id, name="")
    result = test_client.query(query, {"section": {"name": "other", "rank": 0, "id": section_id}})
    assert result["data"]["saveSection"]["errors"] == []
    sections = await populator.list_sections(section_ids={section_id})
    assert sections[0].name == "other"


@pytest.mark.asyncio
async def test_update_now_own(test_client, populator):
    async with test_client.authenticate_user() as mulder:
        section_id = await populator.add_section(mulder.id)

    async with test_client.authenticate_user():
        result = test_client.query(query, {"section": {"name": "other", "rank": 0, "id": section_id}})
        assert result["data"]["saveSection"]["errors"][0]["msg"] == f"Unknown id: {section_id}"
