import React, { useEffect, useState } from 'react';
import { adminService } from '@/utils/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

type ActivityData = {
  date: string;
  users: number;
  messages: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-xs">
        <div><b>Date :</b> {label}</div>
        <div><b>Utilisateurs :</b> {payload.find((p: any) => p.dataKey === 'users')?.value}</div>
        <div><b>Messages :</b> {payload.find((p: any) => p.dataKey === 'messages')?.value}</div>
      </div>
    );
  }
  return null;
};

export const ActivityChart: React.FC = () => {
  const [chartData, setChartData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'line' | 'bar' | 'area'>('line');

  useEffect(() => {
    setLoading(true);
    adminService.getActivityStats(7).then(res => {
      console.log('API response:', res);
      setChartData(res.data?.activity_data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!chartData.length) return <div>Aucune donnée</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution de l'Activité</h3>
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${activeChart === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setActiveChart('line')}
        >Lignes</button>
        <button
          className={`px-3 py-1 rounded ${activeChart === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setActiveChart('bar')}
        >Barres</button>
        <button
          className={`px-3 py-1 rounded ${activeChart === 'area' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setActiveChart('area')}
        >Aires</button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        {activeChart === 'line' && (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="users"
              stroke="#3B82F6"
              strokeWidth={3}
              name="Utilisateurs"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="messages"
              stroke="#F59E0B"
              strokeWidth={3}
              name="Messages"
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        )}
        {activeChart === 'bar' && (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="users" fill="#3B82F6" name="Utilisateurs" radius={[2, 2, 0, 0]} />
            <Bar dataKey="messages" fill="#F59E0B" name="Messages" radius={[2, 2, 0, 0]} />
          </BarChart>
        )}
        {activeChart === 'area' && (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="users"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
              name="Utilisateurs"
            />
            <Area
              type="monotone"
              dataKey="messages"
              stackId="2"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.6}
              name="Messages"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};