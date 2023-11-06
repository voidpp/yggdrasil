import pytest

from yggdrasil.api.types import get_auth_error

query = """
mutation SaveSectionRank($sectionIds: [Int!]!) { 
    saveSectionsRanks(sectionIds: $sectionIds) { 
        errors { 
            msg 
        } 
    } 
}
"""


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = test_client.query(query, {"sectionIds": []})

    assert result["data"]["saveSectionsRanks"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_unknown_id(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    result = test_client.query(query, {"sectionIds": [section_id, 10042]})

    assert result["data"]["saveSectionsRanks"]["errors"][0]["msg"] == "Unknown ids: [10042]"


@pytest.mark.asyncio
async def test_success(test_client, populator, authenticated_user):
    section1_id = await populator.add_section(authenticated_user.id, rank=0)
    section2_id = await populator.add_section(authenticated_user.id, rank=1)
    section3_id = await populator.add_section(authenticated_user.id, rank=2)

    result = test_client.query(query, {"sectionIds": [section3_id, section1_id, section2_id]})
    assert result["data"]["saveSectionsRanks"]["errors"] == []

    sections = await populator.list_sections(section_ids={section2_id})
    assert sections[0].rank == 2
