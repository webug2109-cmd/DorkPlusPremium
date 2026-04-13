import React, { useState } from 'react';
import { Search, Copy, Download, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DorkGenerator = () => {
  const [target, setTarget] = useState('');
  const [dorkType, setDorkType] = useState('admin');
  const [generatedDorks, setGeneratedDorks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!target) {
      toast({ title: 'Error', description: 'Please enter a target domain', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/dork/generate`, {
        target,
        dorkType
      });
      setGeneratedDorks(response.data.dorks);
      toast({ title: 'Success', description: `Generated ${response.data.dorks.length} dorks` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate dorks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyDork = (dork) => {
    navigator.clipboard.writeText(dork);
    toast({ title: 'Copied', description: 'Dork copied to clipboard' });
  };

  const downloadDorks = () => {
    const blob = new Blob([generatedDorks.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dorks.txt';
    a.click();
    toast({ title: 'Downloaded', description: 'Dorks saved to file' });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Google Dork Generator</h2>
        <p className="text-gray-400">Generate custom Google dorks for security testing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              Dork Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target" className="text-gray-300">Target Domain</Label>
              <Input
                id="target"
                placeholder="example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-[#1a1a1b] border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dorkType" className="text-gray-300">Dork Type</Label>
              <Select value={dorkType} onValueChange={setDorkType}>
                <SelectTrigger className="bg-[#1a1a1b] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1b] border-gray-700">
                  <SelectItem value="admin">Admin Panels</SelectItem>
                  <SelectItem value="files">Sensitive Files</SelectItem>
                  <SelectItem value="login">Login Pages</SelectItem>
                  <SelectItem value="database">Database Files</SelectItem>
                  <SelectItem value="sensitive">Sensitive Data</SelectItem>
                  <SelectItem value="config">Config Files</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate Dorks'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Generated Dorks ({generatedDorks.length})</span>
              {generatedDorks.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadDorks}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {generatedDorks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No dorks generated yet</p>
                </div>
              ) : (
                generatedDorks.map((dork, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-[#1a1a1b] border border-gray-800 rounded-lg group hover:border-gray-700 transition-all"
                  >
                    <code className="flex-1 text-sm text-gray-300 break-all">{dork}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyDork(dork)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DorkGenerator;
