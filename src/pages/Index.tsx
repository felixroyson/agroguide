import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { PlantCard } from '@/components/PlantCard';
import FeedbackForm from '@/components/FeedbackForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Search, Filter, Heart, Copy, Check, LogIn } from 'lucide-react';

interface Plant {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  category: 'home' | 'agri';
  subcategory: string | null;
  climate: string | null;
  soil: string | null;
  watering_schedule: string | null;
  sunlight: string | null;
  fertilizer: string | null;
  diseases: string[] | null;
  remedies: string[] | null;
  harvesting: string | null;
  images: string[] | null;
  description: string | null;
  care_instructions: string | null;
  published: boolean;
}

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'home' | 'agriculture'>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('published', true)
        .order('common_name');

      if (error) throw error;
      setPlants(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading plants",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlants = plants.filter(plant => {
    const matchesMode = mode === 'home' ? plant.category === 'home' : plant.category === 'agri';
    const matchesSearch = plant.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plant.scientific_name && plant.scientific_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  const copyCarePlan = (plant: Plant) => {
    const carePlan = `
🌱 ${plant.common_name} ${plant.scientific_name ? `(${plant.scientific_name})` : ''} Care Plan

💧 Watering: ${plant.watering_schedule || 'Not specified'}
☀️ Sunlight: ${plant.sunlight || 'Not specified'}  
🌱 Soil: ${plant.soil || 'Not specified'}
🌿 Fertilizer: ${plant.fertilizer || 'Not specified'}

🚨 Common Issues: ${plant.diseases?.join(', ') || 'None listed'}
💡 Solutions: ${plant.remedies?.join(', ') || 'None listed'}

📅 Harvest Time: ${plant.harvesting || 'N/A'}
    `.trim();

    navigator.clipboard.writeText(carePlan);
    setCopiedPlan(plant.id);
    setTimeout(() => setCopiedPlan(null), 2000);
    toast({
      title: "Care plan copied!",
      description: "The care plan has been copied to your clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <Header 
        mode={mode} 
        onModeChange={setMode}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Auth Status */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                Sign in to save favorites and submit feedback
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${mode === 'home' ? 'houseplants' : 'crops'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Plant Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4"></div>
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-3 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlants.map((plant, index) => (
              <div key={plant.id}>
                <PlantCard
                  plant={{
                    id: parseInt(plant.id),
                    name: plant.common_name,
                    scientificName: plant.scientific_name || '',
                    category: plant.category === 'home' ? 'home' : 'agriculture',
                    climate: plant.climate || 'Not specified',
                    soil: plant.soil || 'Not specified',
                    sunlight: plant.sunlight || 'Not specified',
                    watering: plant.watering_schedule || 'Not specified',
                    image: '/placeholder.svg'
                  }}
                  onViewDetails={() => setSelectedPlant(plant)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No plants found matching your search criteria.
            </p>
            <Button variant="outline" onClick={() => setSearchTerm('')}>
              Clear Search
            </Button>
          </div>
        )}
      </main>

      {/* Plant Detail Modal */}
      <Dialog open={!!selectedPlant} onOpenChange={() => setSelectedPlant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPlant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">
                    {selectedPlant.category === 'home' ? '🌿' : '🌾'}
                  </span>
                  {selectedPlant.common_name}
                </DialogTitle>
                <p className="text-muted-foreground italic">{selectedPlant.scientific_name}</p>
                <p className="mt-2">{selectedPlant.description}</p>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Plant Image</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Save to Favorites
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyCarePlan(selectedPlant)}
                    >
                      {copiedPlan === selectedPlant.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Care Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="care">Care</TabsTrigger>
                      <TabsTrigger value="diseases">Diseases</TabsTrigger>
                      <TabsTrigger value="harvest">Harvest</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">💧 Watering</h4>
                          <p className="text-sm text-muted-foreground">{selectedPlant.watering_schedule || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">☀️ Sunlight</h4>
                          <p className="text-sm text-muted-foreground">{selectedPlant.sunlight || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">🌱 Soil</h4>
                          <p className="text-sm text-muted-foreground">{selectedPlant.soil || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium">🌿 Fertilizer</h4>
                          <p className="text-sm text-muted-foreground">{selectedPlant.fertilizer || 'Not specified'}</p>
                        </div>
                      </div>
                      {selectedPlant.care_instructions && (
                        <div className="space-y-2">
                          <h4 className="font-medium">📋 Care Instructions</h4>
                          <p className="text-sm text-muted-foreground">{selectedPlant.care_instructions}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="care" className="space-y-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-primary/5 rounded-lg">
                          <h4 className="font-medium mb-2">Care Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><strong>Climate:</strong> {selectedPlant.climate || 'Not specified'}</p>
                            <p><strong>Subcategory:</strong> {selectedPlant.subcategory || 'Not specified'}</p>
                            {selectedPlant.care_instructions && (
                              <p><strong>Instructions:</strong> {selectedPlant.care_instructions}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="diseases" className="space-y-4">
                      <div className="space-y-4">
                        <h4 className="font-medium">🚨 Common Issues</h4>
                        <div className="space-y-2">
                          {selectedPlant.diseases && selectedPlant.diseases.length > 0 ? (
                            selectedPlant.diseases.map((disease: string, index: number) => (
                              <Badge key={index} variant="destructive" className="mr-2">
                                {disease}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No common diseases listed</p>
                          )}
                        </div>
                        
                        <h4 className="font-medium">💡 Remedies</h4>
                        <div className="space-y-2">
                          {selectedPlant.remedies && selectedPlant.remedies.length > 0 ? (
                            selectedPlant.remedies.map((remedy: string, index: number) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">✓</span>
                                <span className="text-sm">{remedy}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No remedies listed</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="harvest" className="space-y-4">
                      <div className="p-4 bg-accent/5 rounded-lg">
                        <h4 className="font-medium mb-2">📅 Harvest Information</h4>
                        <p className="text-sm">{selectedPlant.harvesting || 'Not applicable for this plant'}</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-2xl">
          <FeedbackForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}