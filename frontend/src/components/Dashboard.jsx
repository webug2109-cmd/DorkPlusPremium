import React, { useState, useEffect } from 'react';
import { Shield, Globe, Search, AlertTriangle, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/statistics`),
        axios.get(`${API}/tasks`)
      ]);
      setStatistics(statsRes.data);
      setTasks(tasksRes.data.slice(0, 3));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading || !statistics) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  const stats = [
    {
      title: 'Total Scans',
      value: statistics.totalScans,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Vulnerabilities Found',
      value: statistics.vulnerabilitiesFound,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Crawled Pages',
      value: statistics.crawledPages,
      icon: Globe,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Generated Dorks',
      value: statistics.generatedDorks,
      icon: Search,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    };
    return variants[status] || '';
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Monitor your security testing activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-[#0f0f10] border-gray-800 hover:border-gray-700 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Scan Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Active Scans</span>
                <span className="text-xl font-bold text-blue-400">{statistics.activeScans}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Completed Scans</span>
                <span className="text-xl font-bold text-green-400">{statistics.completedScans}</span>
              </div>
              <div className="h-32 flex items-end gap-2">
                {[45, 67, 89, 56, 78, 90, 67, 85].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f10] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{task.name}</p>
                      <p className="text-xs text-gray-400">{task.type.toUpperCase()}</p>
                    </div>
                    <Badge className={getStatusBadge(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
