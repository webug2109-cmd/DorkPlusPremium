from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime
import asyncio

# Import models
from models import (
    DorkGenerateRequest, DorkGenerateResponse,
    CrawlerStartRequest, SqliScanRequest, DumperStartRequest,
    KeywordExtractRequest, Task, Statistics, CrawlResult, SqliResult
)

# Import modules
from modules.dork_generator import DorkGenerator
from modules.web_crawler import WebCrawler
from modules.keyword_extractor import KeywordExtractor
from modules.sqli_scanner import SqliScanner
from modules.sql_dumper import SqlDumper
from modules.license_manager import LicenseGenerator, LicenseKey
from modules.utilities import HashIdentifier, EncoderDecoder, UserAgentGenerator
from modules.network_tools import ProxyTester, PortScanner

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Background task storage
active_tasks = {}


# ==================== STATISTICS ====================

async def get_statistics() -> Statistics:
    """Get or create statistics document"""
    stats = await db.statistics.find_one({})
    if not stats:
        default_stats = Statistics()
        await db.statistics.insert_one(default_stats.dict())
        return default_stats
    return Statistics(**stats)

async def update_statistics(**kwargs):
    """Update statistics"""
    await db.statistics.update_one(
        {},
        {'$inc': kwargs, '$set': {'lastUpdated': datetime.utcnow()}},
        upsert=True
    )

@api_router.get("/statistics")
async def get_stats():
    """Get overall statistics"""
    stats = await get_statistics()
    return stats.dict()


# ==================== DORK GENERATOR ====================

@api_router.post("/dork/generate", response_model=DorkGenerateResponse)
async def generate_dorks(request: DorkGenerateRequest):
    """Generate Google dorks"""
    try:
        dorks = DorkGenerator.generate(request.target, request.dorkType)
        
        # Save to database
        await db.dorks.insert_many([
            {'dork': dork, 'target': request.target, 'type': request.dorkType, 'createdAt': datetime.utcnow()}
            for dork in dorks
        ])
        
        # Update statistics
        await update_statistics(generatedDorks=len(dorks))
        
        return DorkGenerateResponse(
            dorks=dorks,
            target=request.target,
            dorkType=request.dorkType
        )
    except Exception as e:
        logger.error(f"Dork generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dork/examples")
async def get_dork_examples():
    """Get common dork examples"""
    examples = [
        "site:example.com inurl:admin",
        "site:*.edu intitle:index.of",
        "inurl:login.php",
        "filetype:sql intext:password",
        "intitle:\"index of\" \"parent directory\"",
        "site:target.com ext:php inurl:admin",
        "inurl:/admin/login.php",
        "intitle:\"Login Page\" inurl:login",
        "site:*.com filetype:env",
        "inurl:wp-admin intitle:login"
    ]
    return {'examples': examples}


# ==================== WEB CRAWLER ====================

async def crawl_task(task_id: str, url: str, depth: int):
    """Background task for crawling"""
    try:
        # Update task status
        await db.tasks.update_one(
            {'id': task_id},
            {'$set': {'status': 'running', 'progress': 10, 'updatedAt': datetime.utcnow()}}
        )
        
        # Start crawling
        crawler = WebCrawler(url, depth)
        results = await crawler.start_crawl()
        
        # Save results
        for result in results:
            result['taskId'] = task_id
            result['timestamp'] = datetime.utcnow().isoformat()
            await db.crawl_results.insert_one(result)
        
        # Update task as completed
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'completed',
                    'progress': 100,
                    'results': len(results),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        # Update statistics
        await update_statistics(crawledPages=len(results), completedScans=1, activeScans=-1)
        
    except Exception as e:
        logger.error(f"Crawl task error: {e}")
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        await update_statistics(activeScans=-1)

@api_router.post("/crawler/start")
async def start_crawler(request: CrawlerStartRequest, background_tasks: BackgroundTasks):
    """Start web crawling"""
    try:
        # Create task
        task = Task(
            name=f"Crawl {request.url}",
            type="crawler",
            status="pending"
        )
        
        await db.tasks.insert_one(task.dict())
        
        # Start background task
        background_tasks.add_task(crawl_task, task.id, request.url, request.depth)
        
        # Update statistics
        await update_statistics(totalScans=1, activeScans=1)
        
        return {'taskId': task.id, 'status': 'started'}
    except Exception as e:
        logger.error(f"Crawler start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/crawler/results/{task_id}")
async def get_crawler_results(task_id: str):
    """Get crawler results"""
    task = await db.tasks.find_one({'id': task_id}, {'_id': 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    results = await db.crawl_results.find({'taskId': task_id}, {'_id': 0}).to_list(1000)
    
    return {
        'task': Task(**task).dict(),
        'results': results
    }


# ==================== KEYWORD EXTRACTOR ====================

@api_router.post("/keywords/extract")
async def extract_keywords(request: KeywordExtractRequest):
    """Extract keywords"""
    try:
        if request.sourceUrl:
            keywords = await KeywordExtractor.extract_from_url(request.sourceUrl)
        elif request.customText:
            keywords = KeywordExtractor.extract_from_text(request.customText)
        else:
            raise HTTPException(status_code=400, detail="Provide either sourceUrl or customText")
        
        # Save to database
        await db.keywords.insert_many([
            {'keyword': kw, 'source': request.sourceUrl or 'custom_text', 'createdAt': datetime.utcnow()}
            for kw in keywords
        ])
        
        return {'keywords': keywords}
    except Exception as e:
        logger.error(f"Keyword extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SQLI SCANNER ====================

async def sqli_scan_task(task_id: str, target_url: str, scan_type: str):
    """Background task for SQLi scanning"""
    try:
        # Update task status
        await db.tasks.update_one(
            {'id': task_id},
            {'$set': {'status': 'running', 'progress': 20, 'updatedAt': datetime.utcnow()}}
        )
        
        # Start scanning
        scanner = SqliScanner(target_url, scan_type)
        results = await scanner.scan()
        
        # Save results
        vuln_count = 0
        for result in results:
            result['taskId'] = task_id
            result['timestamp'] = datetime.utcnow().isoformat()
            await db.sqli_results.insert_one(result)
            if result.get('vulnerable'):
                vuln_count += 1
        
        # Update task as completed
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'completed',
                    'progress': 100,
                    'results': len(results),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        # Update statistics
        await update_statistics(
            vulnerabilitiesFound=vuln_count,
            completedScans=1,
            activeScans=-1
        )
        
    except Exception as e:
        logger.error(f"SQLi scan error: {e}")
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        await update_statistics(activeScans=-1)

@api_router.post("/sqli/scan")
async def start_sqli_scan(request: SqliScanRequest, background_tasks: BackgroundTasks):
    """Start SQL injection scan"""
    try:
        # Create task
        task = Task(
            name=f"SQLi Scan {request.targetUrl}",
            type="sqli",
            status="pending"
        )
        
        await db.tasks.insert_one(task.dict())
        
        # Start background task
        background_tasks.add_task(sqli_scan_task, task.id, request.targetUrl, request.scanType)
        
        # Update statistics
        await update_statistics(totalScans=1, activeScans=1)
        
        return {'taskId': task.id, 'status': 'scanning'}
    except Exception as e:
        logger.error(f"SQLi scan start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/sqli/results/{task_id}")
async def get_sqli_results(task_id: str):
    """Get SQL injection scan results"""
    task = await db.tasks.find_one({'id': task_id}, {'_id': 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    results = await db.sqli_results.find({'taskId': task_id}, {'_id': 0}).to_list(1000)
    
    return {
        'task': Task(**task).dict(),
        'results': results
    }


# ==================== SQL DUMPER ====================

async def dumper_task(task_id: str, target_url: str):
    """Background task for database dumping"""
    try:
        # Update task status
        await db.tasks.update_one(
            {'id': task_id},
            {'$set': {'status': 'running', 'progress': 30, 'updatedAt': datetime.utcnow()}}
        )
        
        # Start dumping
        dumper = SqlDumper(target_url)
        result = await dumper.dump_database()
        
        # Save result
        result_for_db = result.copy()
        result_for_db['taskId'] = task_id
        result_for_db['timestamp'] = datetime.utcnow().isoformat()
        await db.dumper_results.insert_one(result_for_db)
        
        # Update task as completed
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'completed',
                    'progress': 100,
                    'results': len(result.get('tables', [])),
                    'data': result,
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        
        # Update statistics
        await update_statistics(completedScans=1, activeScans=-1)
        
    except Exception as e:
        logger.error(f"Dumper task error: {e}")
        await db.tasks.update_one(
            {'id': task_id},
            {
                '$set': {
                    'status': 'failed',
                    'error': str(e),
                    'updatedAt': datetime.utcnow()
                }
            }
        )
        await update_statistics(activeScans=-1)

@api_router.post("/dumper/start")
async def start_dumper(request: DumperStartRequest, background_tasks: BackgroundTasks):
    """Start database dumping"""
    try:
        # Create task
        task = Task(
            name=f"Dump {request.targetUrl}",
            type="dumper",
            status="pending"
        )
        
        await db.tasks.insert_one(task.dict())
        
        # Start background task
        background_tasks.add_task(dumper_task, task.id, request.targetUrl)
        
        # Update statistics
        await update_statistics(totalScans=1, activeScans=1)
        
        return {'taskId': task.id, 'status': 'dumping'}
    except Exception as e:
        logger.error(f"Dumper start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dumper/results/{task_id}")
async def get_dumper_results(task_id: str):
    """Get database dump results"""
    task = await db.tasks.find_one({'id': task_id}, {'_id': 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        'task': Task(**task).dict(),
        'result': task.get('data')
    }


# ==================== TASKS ====================

@api_router.get("/tasks")
async def get_tasks():
    """Get all tasks"""
    tasks = await db.tasks.find({}, {'_id': 0}).sort('createdAt', -1).limit(100).to_list(100)
    return [Task(**task).dict() for task in tasks]

@api_router.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Get specific task"""
    task = await db.tasks.find_one({'id': task_id}, {'_id': 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task).dict()

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task"""
    result = await db.tasks.delete_one({'id': task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Also delete associated results
    await db.crawl_results.delete_many({'taskId': task_id})
    await db.sqli_results.delete_many({'taskId': task_id})
    await db.dumper_results.delete_many({'taskId': task_id})
    
    return {'message': 'Task deleted successfully'}


# ==================== LICENSE MANAGEMENT ====================

@api_router.post("/license/generate")
async def generate_license(duration: str):
    """Generate a new license key"""
    try:
        license = LicenseGenerator.create_license(duration)
        await db.licenses.insert_one(license.dict())
        return license.dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/license/validate")
async def validate_license(key: str):
    """Validate a license key"""
    license = await db.licenses.find_one({'key': key}, {'_id': 0})
    if not license:
        return {'valid': False, 'message': 'Invalid license key'}
    
    license_obj = LicenseKey(**license)
    
    if not license_obj.isActive:
        return {'valid': False, 'message': 'License key is deactivated'}
    
    if datetime.utcnow() > license_obj.expiresAt:
        return {'valid': False, 'message': 'License key has expired'}
    
    return {
        'valid': True,
        'duration': license_obj.duration,
        'expiresAt': license_obj.expiresAt.isoformat()
    }

@api_router.get("/license/generate-bulk/{duration}/{count}")
async def generate_bulk_licenses(duration: str, count: int):
    """Generate multiple license keys"""
    if count > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 keys per request")
    
    licenses = []
    for _ in range(count):
        license = LicenseGenerator.create_license(duration)
        await db.licenses.insert_one(license.dict())
        licenses.append(license.dict())
    
    return {'licenses': licenses, 'count': len(licenses)}


# ==================== UTILITIES ====================

@api_router.post("/utilities/hash/identify")
async def identify_hash(hash_string: str):
    """Identify hash type"""
    types = HashIdentifier.identify(hash_string)
    return {'hash': hash_string, 'possibleTypes': types}

@api_router.post("/utilities/hash/generate")
async def generate_hash(text: str, algorithm: str = 'md5'):
    """Generate hash from text"""
    try:
        hash_value = HashIdentifier.hash_text(text, algorithm)
        return {'text': text, 'algorithm': algorithm, 'hash': hash_value}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/utilities/encode/base64")
async def encode_base64(text: str):
    """Encode to base64"""
    encoded = EncoderDecoder.base64_encode(text)
    return {'original': text, 'encoded': encoded}

@api_router.post("/utilities/decode/base64")
async def decode_base64(encoded: str):
    """Decode from base64"""
    decoded = EncoderDecoder.base64_decode(encoded)
    return {'encoded': encoded, 'decoded': decoded}

@api_router.post("/utilities/encode/url")
async def encode_url(text: str):
    """URL encode"""
    encoded = EncoderDecoder.url_encode(text)
    return {'original': text, 'encoded': encoded}

@api_router.post("/utilities/decode/url")
async def decode_url(encoded: str):
    """URL decode"""
    decoded = EncoderDecoder.url_decode(encoded)
    return {'encoded': encoded, 'decoded': decoded}

@api_router.get("/utilities/useragent/random")
async def get_random_useragent():
    """Get random user agent"""
    ua = UserAgentGenerator.get_random()
    return {'userAgent': ua}

@api_router.get("/utilities/useragent/all")
async def get_all_useragents():
    """Get all user agents"""
    uas = UserAgentGenerator.get_all()
    return {'userAgents': uas, 'count': len(uas)}


# ==================== NETWORK TOOLS ====================

@api_router.post("/network/proxy/test")
async def test_proxy(proxy: str):
    """Test a single proxy"""
    result = await ProxyTester.test_proxy(proxy)
    return result

@api_router.post("/network/proxy/test-multiple")
async def test_multiple_proxies(proxies: list):
    """Test multiple proxies"""
    if len(proxies) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 proxies per request")
    
    results = await ProxyTester.test_multiple(proxies)
    working = [r for r in results if r['status'] == 'working']
    
    return {
        'total': len(results),
        'working': len(working),
        'results': results
    }

@api_router.post("/network/port/scan")
async def scan_ports(host: str):
    """Scan common ports"""
    results = await PortScanner.scan_common_ports(host)
    return {'host': host, 'openPorts': results}


# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {
        "name": "DorkPlusPremium Security Testing API",
        "version": "2.0.0",
        "author": "Frostbyt3s",
        "endpoints": {
            "statistics": "/api/statistics",
            "dork_generator": "/api/dork/generate",
            "web_crawler": "/api/crawler/start",
            "keyword_extractor": "/api/keywords/extract",
            "sqli_scanner": "/api/sqli/scan",
            "sql_dumper": "/api/dumper/start",
            "tasks": "/api/tasks",
            "license": "/api/license/generate",
            "utilities": "/api/utilities",
            "network_tools": "/api/network"
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
