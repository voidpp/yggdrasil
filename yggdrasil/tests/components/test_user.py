import pytest
from sqlalchemy import select

from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_models import user


@pytest.mark.asyncio
async def test_store_new_user(database):
    user_info = UserInfo(
        sub="sub",
        email="email",
        given_name="given_name",
        family_name="family_name",
        picture="picture",
        locale="locale",
    )

    await user_info.store(database)

    assert user_info.id


@pytest.mark.asyncio
async def test_update_user(database):
    user_info = UserInfo(
        sub="sub",
        email="email",
        given_name="given_name",
        family_name="family_name",
        picture="picture",
        locale="locale",
    )

    await user_info.store(database)

    user_info.email = "email2"

    await user_info.store(database)

    async with database.session() as session:
        users = (await session.execute(select(user))).all()

        assert len(users) == 1
        assert users[0].email == "email2"
