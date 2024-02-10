import pytest

from yggdrasil.api.types import get_auth_error
from yggdrasil.schema import LinkType

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
        "type": LinkType.SINGLE.value,
        "favicon": None,
    }

    if extra_data:
        data.update(extra_data)

    return {"link": data}


@pytest.mark.asyncio
async def test_no_auth(test_client):
    result = await test_client.query(query, generate_link_vars())

    assert result["data"]["saveLink"]["errors"][0]["msg"] == get_auth_error().msg


@pytest.mark.asyncio
async def test_create_link(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    result = await test_client.query(query, generate_link_vars({"sectionId": section_id, "title": "yey"}))
    assert result["data"]["saveLink"]["errors"] == []
    links = await populator.list_links(section_ids={section_id})
    assert len(links) == 1
    assert links[0].title == "yey"


@pytest.mark.asyncio
async def test_create_link_without_url(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    result = await test_client.query(
        query, generate_link_vars({"sectionId": section_id, "title": "yey", "type": "SINGLE"})
    )
    assert result["data"]["saveLink"]["errors"] == []
    links = await populator.list_links(section_ids={section_id})
    assert len(links) == 1
    assert links[0].title == "yey"


@pytest.mark.asyncio
async def test_create_link_other_section(test_client, populator):
    async with test_client.authenticate_user() as mulder:
        section_id = await populator.add_section(mulder.id)

    async with test_client.authenticate_user():
        result = await test_client.query(query, generate_link_vars({"sectionId": section_id, "title": "yey"}))
        assert result["data"]["saveLink"]["errors"][0]["msg"] == "Unknown section id"


@pytest.mark.asyncio
async def test_update_own_link(test_client, populator, authenticated_user):
    section_id = await populator.add_section(authenticated_user.id)
    link_id = await populator.add_link(section_id)
    result = await test_client.query(
        query, generate_link_vars({"sectionId": section_id, "id": link_id, "title": "not_google"})
    )
    assert result["data"]["saveLink"]["errors"] == []
    links = await populator.list_links(link_ids={link_id})
    assert len(links)
    assert links[0].title == "not_google"


@pytest.mark.asyncio
async def test_update_not_own_section(test_client, populator):
    async with test_client.authenticate_user() as mulder:
        section_id = await populator.add_section(mulder.id)
        link_id = await populator.add_link(section_id)

    async with test_client.authenticate_user():
        result = await test_client.query(
            query, generate_link_vars({"sectionId": section_id, "id": link_id, "title": "not_google"})
        )
        assert result["data"]["saveLink"]["errors"][0]["msg"] == "Unknown link/section"


@pytest.mark.asyncio
async def test_update_not_own_link(test_client, populator):
    async with test_client.authenticate_user() as mulder:
        section_id = await populator.add_section(mulder.id)
        link_id = await populator.add_link(section_id)

    async with test_client.authenticate_user() as scully:
        section_id = await populator.add_section(scully.id)
        result = await test_client.query(
            query, generate_link_vars({"sectionId": section_id, "id": link_id, "title": "not_google"})
        )
        assert result["data"]["saveLink"]["errors"][0]["msg"] == "Unknown link/section"


@pytest.mark.asyncio
async def test_update_child_links_too(test_client, populator, authenticated_user):
    section_from_id = await populator.add_section(authenticated_user.id)
    section_to_id = await populator.add_section(authenticated_user.id)

    parent_link_id = await populator.add_link(section_from_id)
    child_link_id = await populator.add_link(section_from_id, link_group_id=parent_link_id)

    result = await test_client.query(query, generate_link_vars({"sectionId": section_to_id, "id": parent_link_id}))
    assert len(result["data"]["saveLink"]["errors"]) == 0

    links = await populator.list_links({child_link_id})
    assert len(links) == 1
    assert links[0].section_id == section_to_id
