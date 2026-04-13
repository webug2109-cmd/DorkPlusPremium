import React, { useState } from 'react';
import { Key, Wand2, Download, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from '../hooks/use-toast';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KeywordGenerator = () => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!sourceUrl && !customText) {
      toast({ title: 'Error', description: 'Please provide URL or text', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await axios.post(`${API}/keywords/extract`, {
        sourceUrl: sourceUrl || undefined,
        customText: customText || undefined
      });
      setKeywords(response.data.keywords);
      toast({ title: 'Complete', description: `Generated ${response.data.keywords.length} keywords` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to extract keywords', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKeyword = (keyword) => {
    navigator.clipboard.writeText(keyword);
    toast({ title: 'Copied', description: 'Keyword copied to clipboard' });
  };

  const downloadKeywords = () => {
    const blob = new Blob([keywords.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords.txt';
    a.click();
    toast({ title: 'Downloaded', description: 'Keywords saved to file' });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Keyword Generator</h2>
        <p className="text-gray-400">Extract and generate security-relevant keywords</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-500" />
              Keyword Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl" className="text-gray-300">Source URL (Optional)</Label>
              <Input
                id="sourceUrl"
                placeholder="https://example.com"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="bg-[#1a1a1b] border-gray-700 text-white"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f0f10] px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customText" className="text-gray-300">Custom Text</Label>
              <Textarea
                id="customText"
                placeholder="Paste text to extract keywords from..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                className="bg-[#1a1a1b] border-gray-700 text-white resize-none"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Keywords'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Generated Keywords ({keywords.length})</span>
              {keywords.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadKeywords}
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
              {keywords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No keywords generated yet</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-all px-3 py-1.5"
                      onClick={() => copyKeyword(keyword)}
                    >
                      {keyword}
                      <Copy className="w-3 h-3 ml-2" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KeywordGenerator;
