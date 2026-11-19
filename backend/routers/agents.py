import json
import sqlite3
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import get_db


import json
from fastapi import HTTPException
import logging


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agents"])

connected_agents = {}


def utc_now():
    return datetime.now(timezone.utc).isoformat()


@router.get("/")
def get_agents():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT agent_id, agent_name, status, last_seen
        FROM agents
        ORDER BY last_seen DESC
    """)

    agents = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return agents


@router.websocket("/ws/{agent_id}")
async def agent_websocket(websocket: WebSocket, agent_id: str):
    await websocket.accept()

    connected_agents[agent_id] = websocket

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO agents (
            agent_id,
            agent_name,
            status,
            last_seen
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(agent_id)
        DO UPDATE SET
            status = excluded.status,
            last_seen = excluded.last_seen
    """, (
        agent_id,
        "Local Chrome Agent",
        "online",
        utc_now()
    ))

    conn.commit()
    conn.close()

    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)

            if data.get("type") == "heartbeat":
                conn = get_db()
                cursor = conn.cursor()

                cursor.execute("""
                    UPDATE agents
                    SET status = 'online',
                        last_seen = ?
                    WHERE agent_id = ?
                """, (utc_now(), agent_id))

                conn.commit()
                conn.close()

            elif data.get("type") == "command_result":
                print("Command result:", data)

    except WebSocketDisconnect:
        connected_agents.pop(agent_id, None)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE agents
            SET status = 'offline',
                last_seen = ?
            WHERE agent_id = ?
        """, (utc_now(), agent_id))

        conn.commit()
        conn.close()


@router.post("/{agent_id}/execute")
async def execute_command(agent_id: str, command: dict):
    websocket = connected_agents.get(agent_id)

    if websocket is None:
        return {
            "success": False,
            "message": "Agent is offline"
        }

    await websocket.send_json({
        "type": "execute_command",
        "command": command
    })

    return {
        "success": True,
        "message": "Command dispatched to agent"
    }


@router.post("/{agent_id}/execute/{command_id}")
async def execute_command(agent_id: str, command_id: str):
    logger.info(
        "Command execution request received | agent_id=%s | command_id=%s",
        agent_id,
        command_id
    )

    websocket = connected_agents.get(agent_id)

    if websocket is None:
        logger.warning(
            "Command dispatch rejected: agent offline | agent_id=%s | command_id=%s",
            agent_id,
            command_id
        )

        raise HTTPException(
            status_code=404,
            detail="Agent is offline or not connected"
        )

    logger.info(
        "Agent connection found | agent_id=%s",
        agent_id
    )

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT
                command_id,
                name,
                description,
                command_type,
                payload,
                is_active
            FROM commands
            WHERE command_id = ?
        """, (command_id,))

        command = cursor.fetchone()

    finally:
        conn.close()

    if command is None:
        logger.warning(
            "Command not found | command_id=%s | agent_id=%s",
            command_id,
            agent_id
        )

        raise HTTPException(
            status_code=404,
            detail="Command not found"
        )

    if not command["is_active"]:
        logger.warning(
            "Command dispatch rejected: inactive command | command_id=%s | agent_id=%s",
            command_id,
            agent_id
        )

        raise HTTPException(
            status_code=400,
            detail="Command is inactive"
        )

    logger.info(
        "Command retrieved | command_id=%s | name=%s | type=%s",
        command["command_id"],
        command["name"],
        command["command_type"]
    )

    try:
        command_payload = json.loads(command["payload"] or "{}")

    except json.JSONDecodeError:
        logger.exception(
            "Invalid command payload JSON | command_id=%s",
            command_id
        )

        raise HTTPException(
            status_code=500,
            detail="Invalid command payload"
        )

    execution_message = {
        "type": "execute_command",
        "command": {
            "command_id": command["command_id"],
            "name": command["name"],
            "description": command["description"],
            "command_type": command["command_type"],
            "payload": command_payload
        }
    }

    logger.info(
        "Dispatching command | agent_id=%s | command_id=%s | command_name=%s",
        agent_id,
        command_id,
        command["name"]
    )

    try:
        await websocket.send_json(execution_message)

        logger.info(
            "Command dispatched successfully | agent_id=%s | command_id=%s",
            agent_id,
            command_id
        )

    except Exception:
        logger.exception(
            "Command dispatch failed | agent_id=%s | command_id=%s",
            agent_id,
            command_id
        )

        connected_agents.pop(agent_id, None)

        raise HTTPException(
            status_code=500,
            detail="Failed to dispatch command"
        )

    return {
        "success": True,
        "message": "Command dispatched successfully",
        "agent_id": agent_id,
        "command_id": command_id,
        "command_name": command["name"]
    }