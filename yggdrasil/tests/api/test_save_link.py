import pytest

from yggdrasil.api.types import get_auth_error

query = """
mutation SaveLink($link: LinkInput) { 
    saveLink(link: $link) { 
        errors { 
            msg 
        } 
    } 
}
"""


def generate_link_vars(extra_data: dict = None):
    data = {
        "title": "title",
        "url": "https://google.com",
        "sectionId": 1,
        "rank": 0,
    }

    if extra_data:
        data.update(extra_data)

    return {"link": data}


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = test_client.query(query, generate_link_vars())

    assert result["data"]["saveLink"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_save_a_link(test_client, authenticate_user, populator):
    async with authenticate_user() as user:
        section_id = await populator.add_section(user.id)
        result = test_client.query(query, generate_link_vars({"sectionId": section_id}))
        assert result["data"]["saveLink"]["errors"] == []
