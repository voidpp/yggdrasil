import pytest
from sqlalchemy import select

from yggdrasil.components.user_info import UserInfo
from yggdrasil.db_tables import user


@pytest.mark.asyncio
async def test_store_new_user(db_session):
    user_info = UserInfo(
        sub="sub",
        email="email",
        given_name="given_name",
        family_name="family_name",
        picture="picture",
        locale="locale",
    )

    await user_info.store(db_session)

    assert user_info.id


@pytest.mark.asyncio
async def test_update_user(db_session):
    user_info = UserInfo(
        sub="sub",
        email="email",
        given_name="given_name",
        family_name="family_name",
        picture="picture",
        locale="locale",
    )

    await user_info.store(db_session)

    user_info.email = "email2"

    await user_info.store(db_session)

    users = (await db_session.execute(select(user))).all()

    assert len(users) == 1
    assert users[0].email == "email2"
