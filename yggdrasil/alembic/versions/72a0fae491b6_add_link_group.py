"""add link group

Revision ID: 72a0fae491b6
Revises: 6ad7666b16d5
Create Date: 2023-10-29 18:54:26.430386

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "72a0fae491b6"
down_revision: Union[str, None] = "6ad7666b16d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "link",
        sa.Column(
            "type",
            sa.Enum("SINGLE", "GROUP", name="linktype", native_enum=False),
            nullable=False,
            server_default="SINGLE",
        ),
    )
    op.add_column("link", sa.Column("link_group_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "link", "link", ["link_group_id"], ["id"], ondelete="CASCADE")
    op.execute("UPDATE link SET favicon = null WHERE favicon = ''")


def downgrade() -> None:
    op.drop_column("link", "link_group_id")
    op.drop_column("link", "type")
