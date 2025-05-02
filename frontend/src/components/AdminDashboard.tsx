/* eslint-disable @typescript-eslint/no-explicit-any */
// AdminDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { adminService } from "../utils/api";
import { Users, MessageSquare, Timer, CheckCircle, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

interface DashboardCard {
  id: string;
  label: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  format?: (value: number) => string;
}

interface StatsData {
  total_users: number;
  chat_count: number;
  activity_data: Array<{
    date: string;
    users: number;
    messages: number;
  }>;
  user_types: Array<{
    name: string;
    value: number;
  }>;
  faq_count: number;
}

interface DetailedStatsData {
  dailyStats: Array<{
    date: string;
    messageCount: number;
    userCount: number;
    avgResponseTime: number;
  }>;
}

const AdminDashboard = () => {
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([]);
  const [activityData, setActivityData] = useState<Array<{
    date: string;
    users: number;
    messages: number;
  }>>([]);
  const [userTypeData, setUserTypeData] = useState<Array<{
    name: string;
    value: number;
  }>>([]);
  const [detailedStats, setDetailedStats] = useState<Array<{
    date: string;
    messageCount: number;
    userCount: number;
    avgResponseTime: number;
  }>>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      const [statsData, detailedData] = await Promise.all([
        adminService.getStats(selectedPeriod) as Promise<StatsData>,
        adminService.getDetailedStats(selectedPeriod) as Promise<DetailedStatsData>
      ]);
      
      // Mise à jour des cartes
      const cards: DashboardCard[] = [
        {
          id: "totalUsers",
          label: "Utilisateurs Totaux",
          value: statsData.total_users || 0,
          change: "+0%",
          trend: "up",
          icon: <Users className="h-4 w-4" />,
          format: (value) => value.toString()
        },
        {
          id: "chatCount",
          label: "Conversations",
          value: statsData.chat_count || 0,
          change: "+0%",
          trend: "up",
          icon: <MessageSquare className="h-4 w-4" />,
          format: (value) => value.toString()
        },
        {
          id: "messages",
          label: "Messages",
          value: statsData.activity_data?.reduce((acc, curr) => acc + curr.messages, 0) || 0,
          change: "+0%",
          trend: "up",
          icon: <MessageSquare className="h-4 w-4" />,
          format: (value) => value.toString()
        },
        {
          id: "faqCount",
          label: "Réponses FAQ",
          value: statsData.faq_count || 0,
          change: "+0%",
          trend: "up",
          icon: <CheckCircle className="h-4 w-4" />,
          format: (value) => value.toString()
        }
      ];

      setDashboardCards(cards);
      setActivityData(statsData.activity_data || []);
      setUserTypeData(statsData.user_types || []);
      setDetailedStats(detailedData.dailyStats || []);
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-lg">Chargement des statistiques...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-lg text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm">
            Analyse en temps réel des performances du chatbot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sélectionner la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardCards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {card.icon}
                    {card.label}
                  </CardTitle>
                  <span className={`text-sm ${card.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {card.change}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.format ? card.format(card.value as number) : card.value}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activité</CardTitle>
            <CardDescription>Messages et utilisateurs par période</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#8884d8" 
                  name="Utilisateurs"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#82ca9d" 
                  name="Messages"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Types d'utilisateurs</CardTitle>
            <CardDescription>Distribution des utilisateurs par catégorie</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userTypeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistiques détaillées</CardTitle>
            <CardDescription>Évolution des métriques sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={detailedStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { 
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="messageCount" 
                  stroke="#8884d8" 
                  name="Messages"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="userCount" 
                  stroke="#82ca9d" 
                  name="Utilisateurs"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgResponseTime" 
                  stroke="#ffc658" 
                  name="Temps de réponse (s)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
