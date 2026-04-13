import React, { useState, useEffect } from 'react';
import { Globe, Play, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WebCrawler = () => {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [task, setTask] = useState(null);

  useEffect(() => {
    let interval;
    if (taskId && isScanning) {
      interval = setInterval(() => fetchResults(), 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, isScanning]);

  const fetchResults = async () => {
    if (!taskId) return;
    
    try {
      const response = await axios.get(`${API}/crawler/results/${taskId}`);
      setTask(response.data.task);
      
      if (response.data.task.status === 'completed') {
        setResults(response.data.results);
        setIsScanning(false);
        toast({ title: 'Crawl Complete', description: `Found ${response.data.results.length} pages` });
      } else if (response.data.task.status === 'failed') {
        setIsScanning(false);
        toast({ title: 'Crawl Failed', description: response.data.task.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleCrawl = async () => {
    if (!url) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    setResults([]);
    
    try {
      const response = await axios.post(`${API}/crawler/start`, { url, depth });
      setTaskId(response.data.taskId);
      toast({ title: 'Crawling Started', description: `Scanning ${url}...` });
    } catch (error) {
      setIsScanning(false);
      toast({ title: 'Error', description: 'Failed to start crawl', variant: 'destructive' });
    }
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
          
          {task && isScanning && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          )}
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
