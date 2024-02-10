import pytest

from yggdrasil.api.types import get_auth_error

query = """
mutation SaveLinkRank($linkIds: [Int!]!) { 
    saveLinksRanks(linkIds: $linkIds) { 
        errors { 
            msg 
        } 
    } 
}
"""


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = await test_client.query(query, {"linkIds": []})

    assert result["data"]["saveLinksRanks"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_unknown_id(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    link_id = await populator.add_link(section_id)
    result = await test_client.query(query, {"linkIds": [link_id, 10042]})

    assert result["data"]["saveLinksRanks"]["errors"][0]["msg"] == "Unknown ids: [10042]"


@pytest.mark.asyncio
async def test_success(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    link1_id = await populator.add_link(section_id, rank=0)
    link2_id = await populator.add_link(section_id, rank=1)
    link3_id = await populator.add_link(section_id, rank=2)
    result = await test_client.query(query, {"linkIds": [link3_id, link1_id, link2_id]})
    assert result["data"]["saveLinksRanks"]["errors"] == []

    link2_rank_result = await populator.list_links(link_ids={link2_id})
    assert link2_rank_result[0].rank == 2
