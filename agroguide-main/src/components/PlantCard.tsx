import { Heart, Eye, Droplets, Sun, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Plant {
  id: number;
  name: string;
  scientificName: string;
  category: 'home' | 'agriculture';
  climate: string;
  soil: string;
  sunlight: string;
  watering: string;
  image: string;
  isFavorite?: boolean;
}

interface PlantCardProps {
  plant: Plant;
  onToggleFavorite?: (plantId: number) => void;
  onViewDetails?: (plant: Plant) => void;
  animationDelay?: number;
}

export const PlantCard = ({ 
  plant, 
  onToggleFavorite, 
  onViewDetails,
  animationDelay = 0 
}: PlantCardProps) => {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(plant.id);
  };

  const handleCardClick = () => {
    onViewDetails?.(plant);
  };

  return (
    <Card 
      className="card-elegant cursor-pointer group animate-fade-in hover:shadow-lg" 
      style={{ animationDelay: `${animationDelay}s` }}
      onClick={handleCardClick}
    >
      <CardHeader className="p-0">
        <div className="aspect-[4/3] overflow-hidden rounded-t-lg relative">
          <img
            src={plant.image}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
            loading="lazy"
          />
          
          {/* Category badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
          >
            {plant.category === 'home' ? '🌿 Home' : '🌾 Agriculture'}
          </Badge>
          
          {/* Favorite button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 w-8 h-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleFavoriteClick}
          >
            <Heart 
              className={`w-4 h-4 transition-smooth ${
                plant.isFavorite 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-muted-foreground hover:text-red-500'
              }`} 
            />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-lg leading-tight group-hover:text-primary transition-smooth">
              {plant.name}
            </h4>
            <p className="text-sm text-muted-foreground italic">
              {plant.scientificName}
            </p>
          </div>
          
          {/* Care requirements */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Sun className="w-3 h-3 text-yellow-500" />
              <span className="truncate" title={plant.sunlight}>
                {plant.sunlight.split(',')[0]}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Droplets className="w-3 h-3 text-blue-500" />
              <span className="truncate" title={plant.watering}>
                {plant.watering}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Thermometer className="w-3 h-3 text-orange-500" />
              <span className="truncate" title={plant.climate}>
                {plant.climate}
              </span>
            </div>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {plant.soil}
            </Badge>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Tap to view details
            </span>
            <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-smooth" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};