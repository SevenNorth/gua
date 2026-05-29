"""Initial backend schema.

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "visitors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("visitor_id", sa.String(length=96), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("visitor_id"),
    )
    op.create_index("ix_visitors_last_seen_at", "visitors", ["last_seen_at"])
    op.create_index("ix_visitors_visitor_id", "visitors", ["visitor_id"], unique=True)

    op.create_table(
        "daily_usage",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("visitor_id", sa.String(length=96), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("casting_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("detail_reading_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["visitor_id"], ["visitors.visitor_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("visitor_id", "date", name="uq_daily_usage_visitor_date"),
    )
    op.create_index("ix_daily_usage_date", "daily_usage", ["date"])

    op.create_table(
        "castings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("casting_id", sa.String(length=96), nullable=False),
        sa.Column("visitor_id", sa.String(length=96), nullable=False),
        sa.Column("question", sa.Text(), nullable=False, server_default=""),
        sa.Column("mode", sa.String(length=16), nullable=False),
        sa.Column("lines", sa.JSON(), nullable=True),
        sa.Column("gua_code", sa.String(length=6), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["visitor_id"], ["visitors.visitor_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("casting_id"),
    )
    op.create_index("ix_castings_casting_id", "castings", ["casting_id"], unique=True)
    op.create_index("ix_castings_created_at", "castings", ["created_at"])
    op.create_index("ix_castings_visitor_id", "castings", ["visitor_id"])
    op.create_index("ix_castings_visitor_status", "castings", ["visitor_id", "status"])

    op.create_table(
        "detail_readings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("detail_reading_id", sa.String(length=96), nullable=False),
        sa.Column("casting_id", sa.String(length=96), nullable=False),
        sa.Column("visitor_id", sa.String(length=96), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("usage_counted", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["casting_id"], ["castings.casting_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["visitor_id"], ["visitors.visitor_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("casting_id"),
        sa.UniqueConstraint("detail_reading_id"),
    )
    op.create_index(
        "ix_detail_readings_detail_reading_id",
        "detail_readings",
        ["detail_reading_id"],
        unique=True,
    )
    op.create_index("ix_detail_readings_created_at", "detail_readings", ["created_at"])
    op.create_index("ix_detail_readings_visitor_id", "detail_readings", ["visitor_id"])


def downgrade() -> None:
    op.drop_index("ix_detail_readings_visitor_id", table_name="detail_readings")
    op.drop_index("ix_detail_readings_created_at", table_name="detail_readings")
    op.drop_index("ix_detail_readings_detail_reading_id", table_name="detail_readings")
    op.drop_table("detail_readings")

    op.drop_index("ix_castings_visitor_status", table_name="castings")
    op.drop_index("ix_castings_visitor_id", table_name="castings")
    op.drop_index("ix_castings_created_at", table_name="castings")
    op.drop_index("ix_castings_casting_id", table_name="castings")
    op.drop_table("castings")

    op.drop_index("ix_daily_usage_date", table_name="daily_usage")
    op.drop_table("daily_usage")

    op.drop_index("ix_visitors_visitor_id", table_name="visitors")
    op.drop_index("ix_visitors_last_seen_at", table_name="visitors")
    op.drop_table("visitors")
