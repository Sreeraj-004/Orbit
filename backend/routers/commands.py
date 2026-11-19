import json
import uuid

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from database import get_db
from schemas import CommandCreate


router = APIRouter(
    prefix="/commands",
    tags=["Commands"]
)


def get_timestamp():
    return datetime.now(timezone.utc).isoformat()


def serialize_command(command):
    command_data = dict(command)

    command_data["payload"] = json.loads(
        command_data["payload"] or "{}"
    )

    command_data["is_active"] = bool(
        command_data["is_active"]
    )

    return command_data


@router.post("/")
async def create_command(command: CommandCreate):

    connection = get_db()

    try:
        command_id = f"CMD-{uuid.uuid4().hex[:8].upper()}"
        timestamp = get_timestamp()

        connection.execute("""
            INSERT INTO commands (
                command_id,
                name,
                description,
                command_type,
                payload,
                created_by,
                created_at,
                updated_at,
                is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            command_id,
            command.name,
            command.description,
            command.command_type,
            json.dumps(command.payload),
            command.created_by,
            timestamp,
            timestamp,
            1
        ))

        connection.commit()

        return {
            "success": True,
            "message": "Command created successfully",
            "command_id": command_id
        }

    finally:
        connection.close()


@router.get("/")
async def get_commands():

    connection = get_db()

    try:
        cursor = connection.execute("""
            SELECT *
            FROM commands
            ORDER BY created_at DESC
        """)

        commands = cursor.fetchall()

        return [
            serialize_command(command)
            for command in commands
        ]

    finally:
        connection.close()


@router.get("/{command_id}")
async def get_command(command_id: str):

    connection = get_db()

    try:
        command = connection.execute("""
            SELECT *
            FROM commands
            WHERE command_id = ?
        """, (command_id,)).fetchone()

        if command is None:
            raise HTTPException(
                status_code=404,
                detail="Command not found"
            )

        return serialize_command(command)

    finally:
        connection.close()


@router.put("/{command_id}")
async def update_command(command_id: str, command: dict):

    connection = get_db()

    try:
        existing_command = connection.execute("""
            SELECT command_id
            FROM commands
            WHERE command_id = ?
        """, (command_id,)).fetchone()

        if existing_command is None:
            raise HTTPException(
                status_code=404,
                detail="Command not found"
            )

        required_fields = [
            "name",
            "command_type",
            "payload"
        ]

        for field in required_fields:
            if field not in command:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )

        if not isinstance(command["name"], str) or not command["name"].strip():
            raise HTTPException(
                status_code=400,
                detail="Command name cannot be empty"
            )

        if not isinstance(command["command_type"], str) or not command["command_type"].strip():
            raise HTTPException(
                status_code=400,
                detail="Command type cannot be empty"
            )

        if not isinstance(command["payload"], dict):
            raise HTTPException(
                status_code=400,
                detail="Payload must be a JSON object"
            )

        timestamp = get_timestamp()

        connection.execute("""
            UPDATE commands
            SET
                name = ?,
                description = ?,
                command_type = ?,
                payload = ?,
                updated_at = ?
            WHERE command_id = ?
        """, (
            command["name"].strip(),
            command.get("description"),
            command["command_type"].strip(),
            json.dumps(command["payload"]),
            timestamp,
            command_id
        ))

        connection.commit()

        return {
            "success": True,
            "message": "Command updated successfully",
            "command_id": command_id
        }

    finally:
        connection.close()


@router.delete("/{command_id}")
async def delete_command(command_id: str):

    connection = get_db()

    try:
        existing_command = connection.execute("""
            SELECT name
            FROM commands
            WHERE command_id = ?
        """, (command_id,)).fetchone()

        if existing_command is None:
            raise HTTPException(
                status_code=404,
                detail="Command not found"
            )

        connection.execute("""
            DELETE FROM commands
            WHERE command_id = ?
        """, (command_id,))

        connection.commit()

        return {
            "success": True,
            "message": "Command deleted successfully",
            "command_id": command_id,
            "command_name": existing_command["name"]
        }

    finally:
        connection.close()