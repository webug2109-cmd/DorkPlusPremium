import React, { useState, useEffect } from 'react';
import { Database, Play, Download, Table, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dumper = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [dumpData, setDumpData] = useState(null);
  const [isDumping, setIsDumping] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [task, setTask] = useState(null);

  useEffect(() => {
    let interval;
    if (taskId && isDumping) {
      interval = setInterval(() => fetchResults(), 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, isDumping]);

  const fetchResults = async () => {
    if (!taskId) return;
    
    try {
      const response = await axios.get(`${API}/dumper/results/${taskId}`);
      setTask(response.data.task);
      
      if (response.data.task.status === 'completed') {
        setDumpData(response.data.result);
        setIsDumping(false);
        const tableCount = response.data.result?.tables?.length || 0;
        toast({ title: 'Dump Complete', description: `Extracted ${tableCount} tables` });
      } else if (response.data.task.status === 'failed') {
        setIsDumping(false);
        toast({ title: 'Dump Failed', description: response.data.task.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const handleDump = async () => {
    if (!targetUrl) {
      toast({ title: 'Error', description: 'Please enter a target URL', variant: 'destructive' });
      return;
    }

    setIsDumping(true);
    setDumpData(null);
    
    try {
      const response = await axios.post(`${API}/dumper/start`, { targetUrl });
      setTaskId(response.data.taskId);
      toast({ title: 'Dumping Started', description: 'Extracting database information...' });
    } catch (error) {
      setIsDumping(false);
      toast({ title: 'Error', description: 'Failed to start dump', variant: 'destructive' });
    }
  };

  const exportDump = () => {
    const dumpText = JSON.stringify(dumpData, null, 2);
    const blob = new Blob([dumpText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database_dump_${new Date().getTime()}.json`;
    a.click();
    toast({ title: 'Exported', description: 'Database dump saved to file' });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">SQL Dumper</h2>
        <p className="text-gray-400">Extract complete database information from vulnerable endpoints</p>
      </div>

      <Alert className="bg-red-500/10 border-red-500/30">
        <Database className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-400">
          Database dumping should only be performed on systems you own or have written authorization to test. This tool will extract ALL data including customer information.
        </AlertDescription>
      </Alert>

      <Card className="bg-[#0f0f10] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Dumper Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUrl" className="text-gray-300">Vulnerable URL (with SQLi parameter)</Label>
            <Input
              id="targetUrl"
              placeholder="https://example.com/vulnerable.php?id=1"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="bg-[#1a1a1b] border-gray-700 text-white"
            />
            <p className="text-xs text-gray-500">
              Ensure the URL has a vulnerable parameter. The dumper will automatically detect columns and extract data.
            </p>
          </div>

          <Button
            onClick={handleDump}
            disabled={isDumping}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isDumping ? 'Dumping Database...' : 'Start Dump'}
          </Button>
          
          {task && isDumping && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Extraction Progress</span>
                <span>{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
              <p className="text-xs text-gray-500">
                {task.progress < 40 ? 'Detecting columns...' : 
                 task.progress < 70 ? 'Extracting table names...' : 
                 'Dumping table data...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {dumpData && (
        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span>Database: {dumpData.database}</span>
                </div>
                {dumpData.dbms && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {dumpData.dbms} {dumpData.version}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={exportDump}
                className="border-gray-700 hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dumpData.tables && dumpData.tables.length > 0 ? (
              dumpData.tables.map((table, tableIndex) => (
                <div key={tableIndex} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
                    <Table className="w-4 h-4 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">{table.name}</h3>
                    <Badge className="bg-gray-700 text-gray-300">
                      {table.rowCount} rows
                    </Badge>
                    {table.name.toLowerCase().includes('customer') || 
                     table.name.toLowerCase().includes('user') ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sensitive Data
                      </Badge>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          {table.columns.map((col, colIndex) => (
                            <th key={colIndex} className="text-left p-2 text-gray-300 font-medium">
                              {col}
                              {col.toLowerCase().includes('password') || 
                               col.toLowerCase().includes('email') ||
                               col.toLowerCase().includes('phone') ? (
                                <span className="ml-1 text-red-400">🔒</span>
                              ) : null}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-gray-800 hover:bg-[#1a1a1b] transition-colors">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="p-2 text-gray-400">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No tables extracted. The target may not be vulnerable.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dumper;
