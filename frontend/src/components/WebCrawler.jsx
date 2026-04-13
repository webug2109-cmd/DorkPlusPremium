import React, { useState } from 'react';
import { Globe, Play, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { mockCrawlResults } from '../mock/data';
import { toast } from '../hooks/use-toast';
import { Badge } from './ui/badge';

const WebCrawler = () => {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleCrawl = () => {
    if (!url) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    toast({ title: 'Crawling Started', description: `Scanning ${url}...` });

    setTimeout(() => {
      setResults(mockCrawlResults);
      setIsScanning(false);
      toast({ title: 'Crawl Complete', description: `Found ${mockCrawlResults.length} pages` });
    }, 2000);
  };

  const getStatusColor = (status) => {
    if (status === 200) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status === 403) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Web Crawler</h2>
        <p className="text-gray-400">Crawl websites and discover hidden endpoints</p>
      </div>

      <Card className="bg-[#0f0f10] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Crawler Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="url" className="text-gray-300">Target URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-[#1a1a1b] border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depth" className="text-gray-300">Crawl Depth</Label>
              <Input
                id="depth"
                type="number"
                min="1"
                max="5"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="bg-[#1a1a1b] border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleCrawl}
            disabled={isScanning}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isScanning ? 'Crawling...' : 'Start Crawl'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#0f0f10] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Crawl Results ({results.length})</span>
            {results.length > 0 && (
              <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No results yet. Start a crawl to discover pages.</p>
              </div>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 bg-[#1a1a1b] border border-gray-800 rounded-lg hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        <h4 className="text-sm font-medium text-white">{result.title}</h4>
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {result.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebCrawler;
