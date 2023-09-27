from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey

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
)
