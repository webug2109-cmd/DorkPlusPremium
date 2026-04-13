import React, { useState } from 'react';
import { Database, Play, Download, Table } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { Alert, AlertDescription } from './ui/alert';

const Dumper = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [dumpData, setDumpData] = useState(null);
  const [isDumping, setIsDumping] = useState(false);

  const mockDumpData = {
    database: 'webapp_db',
    tables: [
      {
        name: 'users',
        columns: ['id', 'username', 'email', 'password_hash', 'created_at'],
        rows: [
          ['1', 'admin', 'admin@example.com', '$2b$12$...', '2024-01-15'],
          ['2', 'user1', 'user1@example.com', '$2b$12$...', '2024-02-20'],
          ['3', 'testuser', 'test@example.com', '$2b$12$...', '2024-03-10']
        ]
      },
      {
        name: 'sessions',
        columns: ['session_id', 'user_id', 'token', 'expires_at'],
        rows: [
          ['abc123', '1', 'eyJhbGc...', '2024-12-31'],
          ['def456', '2', 'eyJhbGc...', '2024-12-30']
        ]
      }
    ]
  };

  const handleDump = () => {
    if (!targetUrl) {
      toast({ title: 'Error', description: 'Please enter a target URL', variant: 'destructive' });
      return;
    }

    setIsDumping(true);
    toast({ title: 'Dumping Started', description: 'Extracting database information...' });

    setTimeout(() => {
      setDumpData(mockDumpData);
      setIsDumping(false);
      toast({ title: 'Dump Complete', description: `Extracted ${mockDumpData.tables.length} tables` });
    }, 3000);
  };

  const exportDump = () => {
    const dumpText = JSON.stringify(dumpData, null, 2);
    const blob = new Blob([dumpText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'database_dump.json';
    a.click();
    toast({ title: 'Exported', description: 'Database dump saved to file' });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">SQL Dumper</h2>
        <p className="text-gray-400">Extract database information from vulnerable endpoints</p>
      </div>

      <Alert className="bg-red-500/10 border-red-500/30">
        <Database className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-400">
          Database dumping should only be performed on systems you own or have written authorization to test.
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
            <Label htmlFor="targetUrl" className="text-gray-300">Vulnerable URL</Label>
            <Input
              id="targetUrl"
              placeholder="https://example.com/vulnerable.php?id=1"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="bg-[#1a1a1b] border-gray-700 text-white"
            />
          </div>

          <Button
            onClick={handleDump}
            disabled={isDumping}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isDumping ? 'Dumping...' : 'Start Dump'}
          </Button>
        </CardContent>
      </Card>

      {dumpData && (
        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Database: {dumpData.database}</span>
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
            {dumpData.tables.map((table, tableIndex) => (
              <div key={tableIndex} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">{table.name}</h3>
                  <span className="text-sm text-gray-400">({table.rows.length} rows)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {table.columns.map((col, colIndex) => (
                          <th key={colIndex} className="text-left p-2 text-gray-300 font-medium">
                            {col}
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
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dumper;
