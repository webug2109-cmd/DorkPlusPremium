import React, { useState } from 'react';
import { Shield, Play, AlertTriangle, Download, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { mockSqliResults } from '../mock/data';
import { toast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

const SqliScanner = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [scanType, setScanType] = useState('auto');
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = () => {
    if (!targetUrl) {
      toast({ title: 'Error', description: 'Please enter a target URL', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    toast({ title: 'Scan Started', description: 'Checking for SQL injection vulnerabilities...' });

    setTimeout(() => {
      setResults(mockSqliResults);
      setIsScanning(false);
      const vulnCount = mockSqliResults.filter(r => r.vulnerable).length;
      toast({
        title: 'Scan Complete',
        description: `Found ${vulnCount} vulnerable endpoint(s)`,
        variant: vulnCount > 0 ? 'destructive' : 'default'
      });
    }, 3000);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      High: 'bg-red-500/20 text-red-400 border-red-500/30',
      Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      None: 'bg-green-500/20 text-green-400 border-green-500/30'
    };
    return colors[severity] || colors.None;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">SQL Injection Scanner</h2>
        <p className="text-gray-400">Automated SQLi vulnerability detection and dumping</p>
      </div>

      <Alert className="bg-yellow-500/10 border-yellow-500/30">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-400">
          Only use this tool on systems you own or have explicit authorization to test. Unauthorized testing is illegal.
        </AlertDescription>
      </Alert>

      <Card className="bg-[#0f0f10] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Scanner Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetUrl" className="text-gray-300">Target URL</Label>
              <Input
                id="targetUrl"
                placeholder="https://example.com/page.php?id=1"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="bg-[#1a1a1b] border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scanType" className="text-gray-300">Scan Type</Label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1b] border-gray-700">
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="error">Error-based</SelectItem>
                  <SelectItem value="blind">Blind SQLi</SelectItem>
                  <SelectItem value="time">Time-based</SelectItem>
                  <SelectItem value="union">UNION-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#0f0f10] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Scan Results ({results.length})</span>
            {results.length > 0 && (
              <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No scan results yet. Start a scan to check for vulnerabilities.</p>
              </div>
            ) : (
              results.map((result) => (
                <div
                  key={result.id}
                  className="p-4 bg-[#1a1a1b] border border-gray-800 rounded-lg hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {result.vulnerable ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                    </div>
                    <Badge className={result.vulnerable ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
                      {result.vulnerable ? 'Vulnerable' : 'Safe'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">URL</p>
                      <code className="text-sm text-blue-400 break-all">{result.url}</code>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Injection Type</p>
                      <p className="text-sm text-white">{result.type}</p>
                    </div>
                    {result.vulnerable && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Payload</p>
                        <code className="text-sm text-gray-300 bg-[#0a0a0b] px-2 py-1 rounded">{result.payload}</code>
                      </div>
                    )}
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

export default SqliScanner;
