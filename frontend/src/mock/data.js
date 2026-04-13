// Mock data for DorkPlus clone

export const mockDorks = [
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
];

export const mockKeywords = [
  "login", "admin", "password", "user", "dashboard",
  "config", "database", "api", "token", "secret",
  "backup", "upload", "download", "file", "data"
];

export const mockCrawlResults = [
  {
    id: 1,
    url: "https://example.com/admin",
    status: 200,
    title: "Admin Panel",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    url: "https://example.com/login.php",
    status: 200,
    title: "Login Page",
    timestamp: new Date().toISOString()
  },
  {
    id: 3,
    url: "https://example.com/dashboard",
    status: 403,
    title: "Forbidden",
    timestamp: new Date().toISOString()
  }
];

export const mockSqliResults = [
  {
    id: 1,
    url: "https://example.com/product.php?id=1",
    vulnerable: true,
    type: "Error-based SQLi",
    payload: "' OR '1'='1",
    severity: "High",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    url: "https://example.com/search.php?q=test",
    vulnerable: false,
    type: "No vulnerability detected",
    payload: "N/A",
    severity: "None",
    timestamp: new Date().toISOString()
  }
];

export const mockStatistics = {
  totalScans: 1247,
  vulnerabilitiesFound: 89,
  crawledPages: 5538,
  generatedDorks: 423,
  activeScans: 3,
  completedScans: 156
};

export const mockTasks = [
  {
    id: 1,
    name: "E-commerce SQLi Scan",
    type: "sqli",
    status: "completed",
    progress: 100,
    results: 12,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    name: "Domain Crawler",
    type: "crawler",
    status: "running",
    progress: 67,
    results: 234,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 3,
    name: "Admin Panel Dork Search",
    type: "dork",
    status: "pending",
    progress: 0,
    results: 0,
    createdAt: new Date().toISOString()
  }
];
