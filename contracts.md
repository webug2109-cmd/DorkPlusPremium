# DorkPlus Clone - API Contracts & Backend Implementation Plan

## Overview
This document outlines the API contracts, mocked data, and backend implementation strategy for the DorkPlus security testing platform.

## Current Mock Data (Frontend Only)
All data in `/app/frontend/src/mock/data.js`:
- `mockDorks`: Pre-defined Google dork examples
- `mockKeywords`: Sample security-related keywords
- `mockCrawlResults`: Sample crawled URLs with status codes
- `mockSqliResults`: Sample SQL injection scan results
- `mockStatistics`: Dashboard statistics
- `mockTasks`: Sample task list

## API Contracts

### 1. Dashboard & Statistics
**GET `/api/statistics`**
- Returns: Overall statistics (total scans, vulnerabilities, crawled pages, generated dorks, active/completed scans)
- Response:
```json
{
  "totalScans": 1247,
  "vulnerabilitiesFound": 89,
  "crawledPages": 5538,
  "generatedDorks": 423,
  "activeScans": 3,
  "completedScans": 156
}
```

### 2. Dork Generator
**POST `/api/dork/generate`**
- Request:
```json
{
  "target": "example.com",
  "dorkType": "admin|files|login|database"
}
```
- Response:
```json
{
  "dorks": [
    "site:example.com inurl:admin",
    "site:example.com intitle:\"admin panel\""
  ]
}
```

**GET `/api/dork/examples`**
- Returns: List of common dork examples

### 3. Web Crawler
**POST `/api/crawler/start`**
- Request:
```json
{
  "url": "https://example.com",
  "depth": 2
}
```
- Response:
```json
{
  "taskId": "abc123",
  "status": "started"
}
```

**GET `/api/crawler/results/{taskId}`**
- Returns: Crawled URLs with status codes, titles, timestamps

### 4. Keyword Generator
**POST `/api/keywords/extract`**
- Request:
```json
{
  "sourceUrl": "https://example.com", // optional
  "customText": "text content...", // optional
}
```
- Response:
```json
{
  "keywords": ["login", "admin", "password", ...]
}
```

### 5. SQLi Scanner
**POST `/api/sqli/scan`**
- Request:
```json
{
  "targetUrl": "https://example.com/page.php?id=1",
  "scanType": "auto|error|blind|time|union"
}
```
- Response:
```json
{
  "taskId": "xyz789",
  "status": "scanning"
}
```

**GET `/api/sqli/results/{taskId}`**
- Returns: Vulnerability scan results with severity, payload, type

### 6. SQL Dumper
**POST `/api/dumper/start`**
- Request:
```json
{
  "targetUrl": "https://example.com/vulnerable.php?id=1"
}
```
- Response: Database structure and extracted data

### 7. Tasks Management
**GET `/api/tasks`**
- Returns: List of all tasks with status, progress, results count

**GET `/api/tasks/{taskId}`**
- Returns: Detailed task information

**DELETE `/api/tasks/{taskId}`**
- Deletes a task

## Backend Implementation Strategy

### Phase 1: Core API Structure
1. Set up FastAPI routes with `/api` prefix
2. Create MongoDB models for:
   - Tasks (id, name, type, status, progress, results, createdAt, updatedAt)
   - Dorks (id, dork_string, type, target)
   - CrawlResults (id, taskId, url, status, title, timestamp)
   - SqliResults (id, taskId, url, vulnerable, type, payload, severity, timestamp)
   - Keywords (id, taskId, keyword)
   - Statistics (singleton document tracking overall stats)

### Phase 2: Module Implementation
1. **Dork Generator**: Template-based dork generation (no external API needed)
2. **Web Crawler**: 
   - Use `requests` + `BeautifulSoup4` for basic crawling
   - Implement BFS/DFS for depth-limited crawling
   - Extract links, status codes, page titles
3. **Keyword Generator**:
   - Use NLP techniques (word frequency, TF-IDF)
   - Extract from URL content or custom text
   - Filter for security-relevant terms
4. **SQLi Scanner**:
   - Implement basic SQL injection payloads
   - Test for error-based, blind, time-based SQLi
   - Pattern matching for vulnerability detection
5. **SQL Dumper**:
   - Build on SQLi scanner results
   - Extract database schema and data
   - Support multiple injection techniques

### Phase 3: Task Management
1. Background task processing using async/await
2. Task status tracking (pending, running, completed, failed)
3. Progress updates stored in MongoDB
4. Result pagination and filtering

### Phase 4: Frontend-Backend Integration
Replace mock data imports with API calls:
- `Dashboard.jsx`: Fetch from `/api/statistics` and `/api/tasks`
- `DorkGenerator.jsx`: POST to `/api/dork/generate`
- `WebCrawler.jsx`: POST to `/api/crawler/start`, poll `/api/crawler/results/{taskId}`
- `KeywordGenerator.jsx`: POST to `/api/keywords/extract`
- `SqliScanner.jsx`: POST to `/api/sqli/scan`, poll `/api/sqli/results/{taskId}`
- `Dumper.jsx`: POST to `/api/dumper/start`

### Dependencies to Add
```
beautifulsoup4>=4.12.0
lxml>=5.0.0
aiohttp>=3.9.0
python-whois>=0.8.0
```

## Security & Ethical Considerations
1. Add rate limiting to prevent abuse
2. Implement API authentication/authorization
3. Log all scanning activities
4. Add disclaimers and authorization checks
5. Validate all user inputs
6. Implement request timeouts
7. Add CAPTCHA bypass detection warnings

## Testing Strategy
1. Unit tests for each scanner module
2. Integration tests for API endpoints
3. E2E tests for complete workflows
4. Security testing for input validation

## Notes
- All scanning tools should include authorization warnings
- Implement proper error handling and user feedback
- Store scan history for audit purposes
- Allow export of all results (JSON, CSV)
