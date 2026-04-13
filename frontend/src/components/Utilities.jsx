import React, { useState } from 'react';
import { Wand2, Hash, Code, Globe, Shield, User, Zap, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Utilities = () => {
  // Hash Identifier State
  const [hashInput, setHashInput] = useState('');
  const [hashTypes, setHashTypes] = useState([]);
  const [hashGenText, setHashGenText] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState('md5');
  const [generatedHash, setGeneratedHash] = useState('');

  // Encoder/Decoder State
  const [encodeText, setEncodeText] = useState('');
  const [encodeType, setEncodeType] = useState('base64');
  const [encodedResult, setEncodedResult] = useState('');
  const [decodeText, setDecodeText] = useState('');
  const [decodeType, setDecodeType] = useState('base64');
  const [decodedResult, setDecodedResult] = useState('');

  // User Agent State
  const [userAgents, setUserAgents] = useState([]);
  const [randomUA, setRandomUA] = useState('');

  // Proxy Tester State
  const [proxyInput, setProxyInput] = useState('');
  const [proxyResults, setProxyResults] = useState([]);
  const [testingProxy, setTestingProxy] = useState(false);

  // Port Scanner State
  const [scanHost, setScanHost] = useState('');
  const [portResults, setPortResults] = useState([]);
  const [scanningPorts, setScanningPorts] = useState(false);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  // Hash Functions
  const identifyHash = async () => {
    if (!hashInput) {
      toast({ title: 'Error', description: 'Please enter a hash', variant: 'destructive' });
      return;
    }
    try {
      const response = await axios.post(`${API}/utilities/hash/identify?hash_string=${hashInput}`);
      setHashTypes(response.data.possibleTypes);
      toast({ title: 'Success', description: `Identified ${response.data.possibleTypes.length} possible type(s)` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to identify hash', variant: 'destructive' });
    }
  };

  const generateHash = async () => {
    if (!hashGenText) {
      toast({ title: 'Error', description: 'Please enter text', variant: 'destructive' });
      return;
    }
    try {
      const response = await axios.post(`${API}/utilities/hash/generate?text=${hashGenText}&algorithm=${hashAlgorithm}`);
      setGeneratedHash(response.data.hash);
      toast({ title: 'Success', description: `Generated ${hashAlgorithm.toUpperCase()} hash` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate hash', variant: 'destructive' });
    }
  };

  // Encoder Functions
  const encode = async () => {
    if (!encodeText) return;
    try {
      const endpoint = encodeType === 'base64' ? 'base64' : 'url';
      const response = await axios.post(`${API}/utilities/encode/${endpoint}?text=${encodeText}`);
      setEncodedResult(response.data.encoded);
    } catch (error) {
      toast({ title: 'Error', description: 'Encoding failed', variant: 'destructive' });
    }
  };

  const decode = async () => {
    if (!decodeText) return;
    try {
      const endpoint = decodeType === 'base64' ? 'base64' : 'url';
      const response = await axios.post(`${API}/utilities/decode/${endpoint}?encoded=${decodeText}`);
      setDecodedResult(response.data.decoded);
    } catch (error) {
      toast({ title: 'Error', description: 'Decoding failed', variant: 'destructive' });
    }
  };

  // User Agent Functions
  const getRandomUserAgent = async () => {
    try {
      const response = await axios.get(`${API}/utilities/useragent/random`);
      setRandomUA(response.data.userAgent);
      toast({ title: 'Generated', description: 'Random user agent generated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to get user agent', variant: 'destructive' });
    }
  };

  const getAllUserAgents = async () => {
    try {
      const response = await axios.get(`${API}/utilities/useragent/all`);
      setUserAgents(response.data.userAgents);
      toast({ title: 'Success', description: `Loaded ${response.data.count} user agents` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load user agents', variant: 'destructive' });
    }
  };

  // Proxy Functions
  const testProxies = async () => {
    if (!proxyInput) {
      toast({ title: 'Error', description: 'Please enter proxies', variant: 'destructive' });
      return;
    }
    setTestingProxy(true);
    try {
      const proxies = proxyInput.split('\n').filter(p => p.trim());
      const response = await axios.post(`${API}/network/proxy/test-multiple`, proxies);
      setProxyResults(response.data.results);
      toast({ 
        title: 'Testing Complete', 
        description: `${response.data.working}/${response.data.total} proxies working` 
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Proxy testing failed', variant: 'destructive' });
    } finally {
      setTestingProxy(false);
    }
  };

  // Port Scanner Functions
  const scanPorts = async () => {
    if (!scanHost) {
      toast({ title: 'Error', description: 'Please enter a host', variant: 'destructive' });
      return;
    }
    setScanningPorts(true);
    try {
      const response = await axios.post(`${API}/network/port/scan?host=${scanHost}`);
      setPortResults(response.data.openPorts);
      toast({ title: 'Scan Complete', description: `Found ${response.data.openPorts.length} open ports` });
    } catch (error) {
      toast({ title: 'Error', description: 'Port scan failed', variant: 'destructive' });
    } finally {
      setScanningPorts(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Utilities</h2>
        <p className="text-gray-400">Advanced security testing utilities and tools</p>
      </div>

      <Tabs defaultValue="hash" className="w-full">
        <TabsList className="bg-[#0f0f10] border border-gray-800">
          <TabsTrigger value="hash"><Hash className="w-4 h-4 mr-2" />Hash Tools</TabsTrigger>
          <TabsTrigger value="encoder"><Code className="w-4 h-4 mr-2" />Encoder/Decoder</TabsTrigger>
          <TabsTrigger value="useragent"><User className="w-4 h-4 mr-2" />User Agents</TabsTrigger>
          <TabsTrigger value="proxy"><Shield className="w-4 h-4 mr-2" />Proxy Tester</TabsTrigger>
          <TabsTrigger value="port"><Globe className="w-4 h-4 mr-2" />Port Scanner</TabsTrigger>
        </TabsList>

        {/* Hash Tools */}
        <TabsContent value="hash" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0f0f10] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Hash Identifier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Hash String</Label>
                  <Input
                    placeholder="Enter hash to identify..."
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="bg-[#1a1a1b] border-gray-700 text-white font-mono"
                  />
                </div>
                <Button onClick={identifyHash} className="w-full bg-blue-500 hover:bg-blue-600">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Identify Hash
                </Button>
                {hashTypes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Possible Types:</Label>
                    <div className="flex flex-wrap gap-2">
                      {hashTypes.map((type, i) => (
                        <Badge key={i} className="bg-green-500/20 text-green-400 border-green-500/30">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f10] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Hash Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Text to Hash</Label>
                  <Input
                    placeholder="Enter text..."
                    value={hashGenText}
                    onChange={(e) => setHashGenText(e.target.value)}
                    className="bg-[#1a1a1b] border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Algorithm</Label>
                  <Select value={hashAlgorithm} onValueChange={setHashAlgorithm}>
                    <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1b] border-gray-700">
                      <SelectItem value="md5">MD5</SelectItem>
                      <SelectItem value="sha1">SHA1</SelectItem>
                      <SelectItem value="sha256">SHA256</SelectItem>
                      <SelectItem value="sha512">SHA512</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateHash} className="w-full bg-blue-500 hover:bg-blue-600">
                  Generate Hash
                </Button>
                {generatedHash && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Generated Hash:</Label>
                    <div className="flex gap-2">
                      <code className="flex-1 p-2 bg-[#1a1a1b] border border-gray-800 rounded text-sm text-gray-300 break-all">
                        {generatedHash}
                      </code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(generatedHash)} className="border-gray-700">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Encoder/Decoder */}
        <TabsContent value="encoder" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0f0f10] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Encoder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Type</Label>
                  <Select value={encodeType} onValueChange={setEncodeType}>
                    <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1b] border-gray-700">
                      <SelectItem value="base64">Base64</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Text to Encode</Label>
                  <Textarea
                    placeholder="Enter text..."
                    value={encodeText}
                    onChange={(e) => setEncodeText(e.target.value)}
                    className="bg-[#1a1a1b] border-gray-700 text-white resize-none"
                    rows={4}
                  />
                </div>
                <Button onClick={encode} className="w-full bg-blue-500 hover:bg-blue-600">
                  Encode
                </Button>
                {encodedResult && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Encoded Result:</Label>
                    <Textarea
                      value={encodedResult}
                      readOnly
                      className="bg-[#1a1a1b] border-gray-800 text-gray-300 resize-none font-mono"
                      rows={4}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f10] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Decoder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Type</Label>
                  <Select value={decodeType} onValueChange={setDecodeType}>
                    <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1b] border-gray-700">
                      <SelectItem value="base64">Base64</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Text to Decode</Label>
                  <Textarea
                    placeholder="Enter encoded text..."
                    value={decodeText}
                    onChange={(e) => setDecodeText(e.target.value)}
                    className="bg-[#1a1a1b] border-gray-700 text-white resize-none"
                    rows={4}
                  />
                </div>
                <Button onClick={decode} className="w-full bg-blue-500 hover:bg-blue-600">
                  Decode
                </Button>
                {decodedResult && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Decoded Result:</Label>
                    <Textarea
                      value={decodedResult}
                      readOnly
                      className="bg-[#1a1a1b] border-gray-800 text-gray-300 resize-none"
                      rows={4}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Agents - Continuing in next file due to length */}
        <TabsContent value="useragent" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">User Agent Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={getRandomUserAgent} className="bg-blue-500 hover:bg-blue-600">
                  <Zap className="w-4 h-4 mr-2" />
                  Get Random
                </Button>
                <Button onClick={getAllUserAgents} variant="outline" className="border-gray-700">
                  Load All ({userAgents.length})
                </Button>
              </div>
              {randomUA && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Random User Agent:</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 bg-[#1a1a1b] border border-gray-800 rounded text-sm text-gray-300 break-all">
                      {randomUA}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(randomUA)} className="border-gray-700">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {userAgents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">All User Agents:</Label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {userAgents.map((ua, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <code className="flex-1 p-2 bg-[#1a1a1b] border border-gray-800 rounded text-xs text-gray-400">
                          {ua}
                        </code>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(ua)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proxy Tester */}
        <TabsContent value="proxy" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Proxy Tester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Proxies (one per line)</Label>
                <Textarea
                  placeholder="http://proxy1:8080&#10;socks5://proxy2:1080&#10;proxy3:3128"
                  value={proxyInput}
                  onChange={(e) => setProxyInput(e.target.value)}
                  className="bg-[#1a1a1b] border-gray-700 text-white resize-none font-mono"
                  rows={6}
                />
              </div>
              <Button onClick={testProxies} disabled={testingProxy} className="w-full bg-blue-500 hover:bg-blue-600">
                {testingProxy ? 'Testing...' : 'Test Proxies'}
              </Button>
              {proxyResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Results:</Label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {proxyResults.map((result, i) => (
                      <div key={i} className={`p-3 rounded border ${
                        result.status === 'working' 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="flex justify-between items-start">
                          <code className="text-sm text-gray-300">{result.proxy}</code>
                          <Badge className={result.status === 'working' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {result.status}
                          </Badge>
                        </div>
                        {result.responseTime && (
                          <p className="text-xs text-gray-400 mt-1">Response: {result.responseTime}ms</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Port Scanner */}
        <TabsContent value="port" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Port Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Target Host</Label>
                <Input
                  placeholder="example.com or 192.168.1.1"
                  value={scanHost}
                  onChange={(e) => setScanHost(e.target.value)}
                  className="bg-[#1a1a1b] border-gray-700 text-white"
                />
              </div>
              <Button onClick={scanPorts} disabled={scanningPorts} className="w-full bg-blue-500 hover:bg-blue-600">
                {scanningPorts ? 'Scanning...' : 'Scan Common Ports'}
              </Button>
              {portResults.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Open Ports ({portResults.length}):</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {portResults.map((result, i) => (
                      <div key={i} className="p-3 bg-green-500/10 border border-green-500/30 rounded">
                        <div className="text-lg font-bold text-green-400">{result.port}</div>
                        <div className="text-xs text-gray-400">{result.service}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Utilities;
