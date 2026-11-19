from pydantic import BaseModel, Field


class CommandCreate(BaseModel):
    name: str
    description: str
    command_type: str
    payload: dict = Field(default_factory=dict)
    created_by: str