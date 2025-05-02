
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data for the dashboard
const messagesPerDay = [
  { day: "Lun", count: 56 },
  { day: "Mar", count: 42 },
  { day: "Mer", count: 63 },
  { day: "Jeu", count: 28 },
  { day: "Ven", count: 37 },
  { day: "Sam", count: 15 },
  { day: "Dim", count: 8 },
];

const responseTypes = [
  { name: "Automatique", value: 78 },
  { name: "Manuelle", value: 22 },
];

const categoryDistribution = [
  { name: "Exams", count: 45 },
  { name: "Filières", count: 35 },
  { name: "Enseignants", count: 20 },
  { name: "Procédures", count: 65 },
  { name: "Orientation", count: 30 },
  { name: "Général", count: 15 },
];

const performanceData = [
  { name: "Jan", success: 85, error: 15 },
  { name: "Fév", success: 88, error: 12 },
  { name: "Mar", success: 90, error: 10 },
  { name: "Avr", success: 92, error: 8 },
  { name: "Mai", success: 94, error: 6 },
  { name: "Juin", success: 93, error: 7 },
];

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00C49F"];

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Tableau de Bord - Chatbot FSTS</h1>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Messages Totaux</CardTitle>
                <CardDescription>Derniers 30 jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2,463</div>
                <div className="text-xs text-muted-foreground">+12% par rapport au mois dernier</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Taux de Résolution</CardTitle>
                <CardDescription>Pourcentage de questions résolues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">87%</div>
                <div className="text-xs text-muted-foreground">+5% par rapport au mois dernier</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Temps de Réponse</CardTitle>
                <CardDescription>Temps moyen de réponse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1.2s</div>
                <div className="text-xs text-muted-foreground">-0.3s par rapport au mois dernier</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Messages par Jour</CardTitle>
              <CardDescription>
                Nombre de messages reçus par jour cette semaine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={messagesPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Types de Réponses</CardTitle>
                <CardDescription>
                  Répartition des réponses automatiques vs manuelles
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={responseTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {responseTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs Actifs</CardTitle>
                <CardDescription>
                  Utilisateurs actifs par jour cette semaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={messagesPerDay}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#82ca9d"
                      name="Utilisateurs"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
            
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Questions par Catégorie</CardTitle>
              <CardDescription>
                Répartition des questions posées par catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={categoryDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Nombre de Questions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Questions Fréquentes</CardTitle>
                <CardDescription>
                  Les questions les plus posées sur le chatbot
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li className="text-sm">Comment s'inscrire pour la première fois à la FSTS?</li>
                  <li className="text-sm">Quand commencent les examens du semestre actuel?</li>
                  <li className="text-sm">Quels documents sont nécessaires pour la réinscription?</li>
                  <li className="text-sm">Comment puis-je contacter le service des affaires estudiantines?</li>
                  <li className="text-sm">Comment déposer mon mémoire de fin d'études?</li>
                </ol>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Catégories</CardTitle>
                <CardDescription>
                  Répartition visuelle des questions par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      dataKey="count"
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance du Chatbot</CardTitle>
              <CardDescription>
                Taux de succès vs erreurs sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#82ca9d"
                    name="Réponses Réussies (%)"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="error"
                    stroke="#ff7300"
                    name="Erreurs (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Taux d'Erreur</CardTitle>
                <CardDescription>Erreurs ce mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">6.8%</div>
                <div className="text-xs text-green-500">-1.2% par rapport au mois dernier</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Temps de Chargement</CardTitle>
                <CardDescription>Temps moyen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">310ms</div>
                <div className="text-xs text-green-500">-50ms par rapport au mois dernier</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Disponibilité</CardTitle>
                <CardDescription>Temps de fonctionnement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-xs text-green-500">+0.1% par rapport au mois dernier</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Erreurs Fréquentes</CardTitle>
              <CardDescription>
                Top 5 des erreurs rencontrées ce mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Questions hors contexte</div>
                    <div className="text-xs text-muted-foreground">Questions non liées à la FSTS</div>
                  </div>
                  <div className="text-sm font-semibold">42%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Langage non reconnu</div>
                    <div className="text-xs text-muted-foreground">Fautes d'orthographe ou abréviations</div>
                  </div>
                  <div className="text-sm font-semibold">28%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Questions complexes</div>
                    <div className="text-xs text-muted-foreground">Requêtes nécessitant plusieurs informations combinées</div>
                  </div>
                  <div className="text-sm font-semibold">15%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Informations obsolètes</div>
                    <div className="text-xs text-muted-foreground">Données qui ne sont plus à jour</div>
                  </div>
                  <div className="text-sm font-semibold">10%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Erreurs techniques</div>
                    <div className="text-xs text-muted-foreground">Problèmes de connexion ou système</div>
                  </div>
                  <div className="text-sm font-semibold">5%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
