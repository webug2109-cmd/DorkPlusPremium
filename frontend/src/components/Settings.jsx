import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Key, Download, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Settings = () => {
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseValid, setLicenseValid] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  
  // Generator Settings
  const [genDuration, setGenDuration] = useState('1month');
  const [genCount, setGenCount] = useState(1);
  const [generatedKeys, setGeneratedKeys] = useState([]);

  // App Settings
  const [settings, setSettings] = useState({
    userAgentRotation: true,
    cloudflareBypass: false,
    requestTimeout: 10,
    maxThreads: 10,
    proxyEnabled: false,
    proxyUrl: ''
  });

  const validateLicense = async () => {
    if (!licenseKey) {
      toast({ title: 'Error', description: 'Please enter a license key', variant: 'destructive' });
      return;
    }
    try {
      const response = await axios.post(`${API}/license/validate?key=${licenseKey}`);
      setLicenseValid(response.data.valid);
      if (response.data.valid) {
        setLicenseInfo(response.data);
        toast({ title: 'Valid License', description: 'License key is valid!' });
      } else {
        toast({ title: 'Invalid License', description: response.data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'License validation failed', variant: 'destructive' });
    }
  };

  const generateLicenses = async () => {
    try {
      if (genCount === 1) {
        const response = await axios.post(`${API}/license/generate?duration=${genDuration}`);
        setGeneratedKeys([response.data]);
        toast({ title: 'Generated', description: 'License key generated successfully' });
      } else {
        const response = await axios.get(`${API}/license/generate-bulk/${genDuration}/${genCount}`);
        setGeneratedKeys(response.data.licenses);
        toast({ title: 'Generated', description: `${response.data.count} license keys generated` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate licenses', variant: 'destructive' });
    }
  };

  const downloadLicenses = () => {
    const text = generatedKeys.map(l => `${l.key} | ${l.duration} | Expires: ${new Date(l.expiresAt).toLocaleString()}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses_${new Date().getTime()}.txt`;
    a.click();
    toast({ title: 'Downloaded', description: 'License keys saved to file' });
  };

  const saveSettings = () => {
    localStorage.setItem('dorkplus_settings', JSON.stringify(settings));
    toast({ title: 'Saved', description: 'Settings saved successfully' });
  };

  useEffect(() => {
    const saved = localStorage.getItem('dorkplus_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Configure DorkPlusPremium settings and licenses</p>
      </div>

      <Tabs defaultValue="license" className="w-full">
        <TabsList className="bg-[#0f0f10] border border-gray-800">
          <TabsTrigger value="license"><Key className="w-4 h-4 mr-2" />License</TabsTrigger>
          <TabsTrigger value="generator"><Shield className="w-4 h-4 mr-2" />Key Generator</TabsTrigger>
          <TabsTrigger value="app"><SettingsIcon className="w-4 h-4 mr-2" />App Settings</TabsTrigger>
          <TabsTrigger value="about"><Info className="w-4 h-4 mr-2" />About</TabsTrigger>
        </TabsList>

        {/* License Validation */}
        <TabsContent value="license" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">License Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">License Key</Label>
                <Input
                  placeholder="DPP**-XXXXX-XXXXX-XXXXX-XXXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="bg-[#1a1a1b] border-gray-700 text-white font-mono"
                />
              </div>
              <Button onClick={validateLicense} className="w-full bg-blue-500 hover:bg-blue-600">
                <Key className="w-4 h-4 mr-2" />
                Validate License
              </Button>
              
              {licenseValid !== null && (
                <div className={`p-4 rounded border ${
                  licenseValid 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={licenseValid 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }>
                      {licenseValid ? 'VALID' : 'INVALID'}
                    </Badge>
                  </div>
                  {licenseInfo && licenseValid && (
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Duration: <span className="font-semibold">{licenseInfo.duration}</span></p>
                      <p>Expires: <span className="font-semibold">{new Date(licenseInfo.expiresAt).toLocaleString()}</span></p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Generator */}
        <TabsContent value="generator" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">License Key Generator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Duration</Label>
                  <Select value={genDuration} onValueChange={setGenDuration}>
                    <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1b] border-gray-700">
                      <SelectItem value="1day">1 Day</SelectItem>
                      <SelectItem value="1week">1 Week</SelectItem>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={genCount}
                    onChange={(e) => setGenCount(parseInt(e.target.value))}
                    className="bg-[#1a1a1b] border-gray-700 text-white"
                  />
                </div>
              </div>
              
              <Button onClick={generateLicenses} className="w-full bg-blue-500 hover:bg-blue-600">
                <Shield className="w-4 h-4 mr-2" />
                Generate {genCount > 1 ? `${genCount} ` : ''}License{genCount > 1 ? 's' : ''}
              </Button>

              {generatedKeys.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Generated Keys ({generatedKeys.length})</Label>
                    <Button size="sm" variant="outline" onClick={downloadLicenses} className="border-gray-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {generatedKeys.map((license, i) => (
                      <div key={i} className="p-3 bg-[#1a1a1b] border border-gray-800 rounded">
                        <code className="text-sm text-green-400 font-mono">{license.key}</code>
                        <div className="flex gap-3 mt-2 text-xs text-gray-400">
                          <span>Duration: {license.duration}</span>
                          <span>•</span>
                          <span>Expires: {new Date(license.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Settings */}
        <TabsContent value="app" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Application Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">User Agent Rotation</Label>
                    <p className="text-sm text-gray-500">Randomly rotate user agents for each request</p>
                  </div>
                  <Switch
                    checked={settings.userAgentRotation}
                    onCheckedChange={(checked) => updateSetting('userAgentRotation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Cloudflare Bypass</Label>
                    <p className="text-sm text-gray-500">Attempt to bypass Cloudflare protection</p>
                  </div>
                  <Switch
                    checked={settings.cloudflareBypass}
                    onCheckedChange={(checked) => updateSetting('cloudflareBypass', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Request Timeout (seconds)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.requestTimeout}
                    onChange={(e) => updateSetting('requestTimeout', parseInt(e.target.value))}
                    className="bg-[#1a1a1b] border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Max Concurrent Threads</Label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxThreads}
                    onChange={(e) => updateSetting('maxThreads', parseInt(e.target.value))}
                    className="bg-[#1a1a1b] border-gray-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">Use Proxy</Label>
                    <p className="text-sm text-gray-500">Route requests through a proxy</p>
                  </div>
                  <Switch
                    checked={settings.proxyEnabled}
                    onCheckedChange={(checked) => updateSetting('proxyEnabled', checked)}
                  />
                </div>

                {settings.proxyEnabled && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Proxy URL</Label>
                    <Input
                      placeholder="http://proxy:8080"
                      value={settings.proxyUrl}
                      onChange={(e) => updateSetting('proxyUrl', e.target.value)}
                      className="bg-[#1a1a1b] border-gray-700 text-white"
                    />
                  </div>
                )}
              </div>

              <Button onClick={saveSettings} className="w-full bg-blue-500 hover:bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About */}
        <TabsContent value="about" className="space-y-4">
          <Card className="bg-[#0f0f10] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-500" />
                DorkPlusPremium
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-gray-300">
                <div>
                  <p className="text-sm text-gray-400">Version</p>
                  <p className="text-lg font-semibold">2.0.0 Premium Edition</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created By</p>
                  <p className="text-lg font-semibold text-blue-400">Frostbyt3s</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-sm">Advanced security testing suite with comprehensive scanning, dumping, and automation capabilities.</p>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-2">Features</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Google Dork Generator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Web Crawler</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>SQLi Scanner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>SQL Auto Dumper</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Keyword Extractor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Hash Identifier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Proxy Tester</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Port Scanner</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500">
                    ⚠️ For authorized security testing only. Unauthorized use is illegal.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
