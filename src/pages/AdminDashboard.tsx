import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  Users, 
  MessageSquare, 
  Leaf, 
  BarChart3, 
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface FeedbackItem {
  id: string;
  message: string;
  category: string;
  status: 'new' | 'in_review' | 'resolved';
  created_at: string;
  profiles: {
    display_name: string;
  } | null;
}

interface Plant {
  id: string;
  common_name: string;
  category: 'home' | 'agri';
  published: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [stats, setStats] = useState({
    totalPlants: 0,
    totalFeedback: 0,
    newFeedback: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    fetchFeedback();
    fetchPlants();
    fetchStats();
  }, []);

  const fetchFeedback = async () => {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        message,
        category,
        status,
        created_at,
        user_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching feedback",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Get profiles separately to avoid join issues
      const feedbackWithProfiles = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', item.user_id)
            .single();
          
          return {
            ...item,
            profiles: profile
          };
        })
      );
      setFeedback(feedbackWithProfiles);
    }
  };

  const fetchPlants = async () => {
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching plants",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPlants(data || []);
    }
  };

  const fetchStats = async () => {
    const [plantsCount, feedbackCount, newFeedbackCount, usersCount] = await Promise.all([
      supabase.from('plants').select('id', { count: 'exact' }),
      supabase.from('feedback').select('id', { count: 'exact' }),
      supabase.from('feedback').select('id', { count: 'exact' }).eq('status', 'new'),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ]);

    setStats({
      totalPlants: plantsCount.count || 0,
      totalFeedback: feedbackCount.count || 0,
      newFeedback: newFeedbackCount.count || 0,
      totalUsers: usersCount.count || 0,
    });
  };

  const updateFeedbackStatus = async (id: string, status: 'new' | 'in_review' | 'resolved') => {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating feedback",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Feedback updated",
        description: `Status changed to ${status}`,
      });
      fetchFeedback();
      fetchStats();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'destructive';
      case 'in_review':
        return 'secondary';
      case 'resolved':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">AgroGuide Admin</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.display_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
              <Leaf className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Feedback</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.newFeedback}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="feedback" className="space-y-6">
          <TabsList>
            <TabsTrigger value="feedback">Feedback Management</TabsTrigger>
            <TabsTrigger value="plants">Plant Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Inbox</CardTitle>
                <CardDescription>Manage user feedback and support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <Badge variant={getStatusColor(item.status) as any}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">
                        <strong>From:</strong> {item.profiles?.display_name || 'Anonymous'}
                      </p>
                      <p className="mb-4">{item.message}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateFeedbackStatus(item.id, 'in_review')}
                          disabled={item.status === 'in_review'}
                        >
                          Mark In Review
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                          disabled={item.status === 'resolved'}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  ))}
                  {feedback.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No feedback submissions yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plant Database</CardTitle>
                <CardDescription>Manage plant information and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plants.slice(0, 12).map((plant) => (
                    <div key={plant.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{plant.common_name}</h3>
                        <Badge variant={plant.published ? "default" : "secondary"}>
                          {plant.published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {plant.category === 'home' ? '🌿 Home' : '🌾 Agriculture'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(plant.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {Math.min(12, plants.length)} of {plants.length} plants
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>System usage and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Plant Categories</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Home Plants</span>
                        <span>{plants.filter(p => p.category === 'home').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agricultural Crops</span>
                        <span>{plants.filter(p => p.category === 'agri').length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Feedback Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>New</span>
                        <span>{feedback.filter(f => f.status === 'new').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Review</span>
                        <span>{feedback.filter(f => f.status === 'in_review').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved</span>
                        <span>{feedback.filter(f => f.status === 'resolved').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}