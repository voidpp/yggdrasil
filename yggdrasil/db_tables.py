from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, Enum

from yggdrasil.schema import BoardBackgroundType, LinkType

meta = MetaData()


user = Table(
    "user",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("email", String),
    Column("sub", String),
    Column("given_name", String),
    Column("family_name", String),
    Column("locale", String),
    Column("picture", String),
    Column("board_background_type", Enum(BoardBackgroundType, native_enum=False)),
    Column("board_background_value", String),
)

section = Table(
    "section",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String),
    Column("user_id", Integer, ForeignKey("user.id", ondelete="CASCADE")),
    Column("rank", Integer),
)

link = Table(
    "link",
    meta,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("title", String),
    Column("url", String),
    Column("favicon", String),
    Column("section_id", Integer, ForeignKey("section.id", ondelete="CASCADE")),
    Column("rank", Integer),
    Column("type", Enum(LinkType, native_enum=False), nullable=False),
    Column("link_group_id", Integer, ForeignKey("link.id", ondelete="CASCADE")),
)
