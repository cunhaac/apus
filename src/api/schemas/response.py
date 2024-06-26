from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SmokeResponse(BaseModel):
    next_cigarette: datetime


class UserResponse(BaseModel):
    username: str
    email: str
    is_first_time: bool
    created_at: datetime


class QuizResponse(BaseModel):
    cigarettes_per_day: Optional[int]
    price_per_package: Optional[float]
    cigarettes_per_package: Optional[int]


class SmokeLogResponse(BaseModel):
    last_cigarette: Optional[datetime]
    next_cigarette: Optional[datetime]


class ReductionPhaseResponse(BaseModel):
    phase_number: Optional[int]
    time_between_cigarettes: Optional[int]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    percentage_reduction_phase: Optional[float]


class ConfigurationResponse(BaseModel):
    config: dict
