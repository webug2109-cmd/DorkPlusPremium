from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from enum import Enum

# Enums
class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskType(str, Enum):
    DORK = "dork"
    CRAWLER = "crawler"
    SQLI = "sqli"
    KEYWORD = "keyword"
    DUMPER = "dumper"

class ScanType(str, Enum):
    AUTO = "auto"
    ERROR = "error"
    BLIND = "blind"
    TIME = "time"
    UNION = "union"

class Severity(str, Enum):
    NONE = "None"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

# Request Models
class DorkGenerateRequest(BaseModel):
    target: str
    dorkType: str

class CrawlerStartRequest(BaseModel):
    url: str
    depth: int = Field(default=2, ge=1, le=5)

class KeywordExtractRequest(BaseModel):
    sourceUrl: Optional[str] = None
    customText: Optional[str] = None

class SqliScanRequest(BaseModel):
    targetUrl: str
    scanType: str = "auto"

class DumperStartRequest(BaseModel):
    targetUrl: str

# Response Models
class DorkGenerateResponse(BaseModel):
    dorks: List[str]
    target: str
    dorkType: str

class CrawlResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    status: int
    title: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    contentType: Optional[str] = None
    responseTime: Optional[float] = None

class SqliResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    vulnerable: bool
    type: str
    payload: str
    severity: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    response: Optional[str] = None
    dbms: Optional[str] = None

class DatabaseTable(BaseModel):
    name: str
    columns: List[str]
    rows: List[List[str]]
    rowCount: int

class DumperResult(BaseModel):
    database: str
    tables: List[DatabaseTable]
    dbms: Optional[str] = None
    version: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    status: str
    progress: int = 0
    results: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class Statistics(BaseModel):
    totalScans: int = 0
    vulnerabilitiesFound: int = 0
    crawledPages: int = 0
    generatedDorks: int = 0
    activeScans: int = 0
    completedScans: int = 0
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)
