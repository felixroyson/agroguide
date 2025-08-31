-- Create enum types
CREATE TYPE public.app_role AS ENUM ('user', 'admin');
CREATE TYPE public.plant_category AS ENUM ('home', 'agri');
CREATE TYPE public.feedback_status AS ENUM ('new', 'in_review', 'resolved');
CREATE TYPE public.feedback_category AS ENUM ('general', 'bug', 'feature_request', 'plant_info');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plants table
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  common_name TEXT NOT NULL,
  scientific_name TEXT,
  category plant_category NOT NULL,
  subcategory TEXT,
  climate TEXT,
  soil TEXT,
  watering_schedule TEXT,
  sunlight TEXT,
  fertilizer TEXT,
  diseases TEXT[],
  remedies TEXT[],
  harvesting TEXT,
  images TEXT[],
  description TEXT,
  care_instructions TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, plant_id)
);

-- Create searches table
CREATE TABLE public.searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  category feedback_category NOT NULL,
  status feedback_status NOT NULL DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for plants
CREATE POLICY "Anyone can view published plants" ON public.plants
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage all plants" ON public.plants
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for favorites
CREATE POLICY "Users can manage their own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for searches
CREATE POLICY "Users can view their own searches" ON public.searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert searches" ON public.searches
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for feedback
CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update feedback" ON public.feedback
  FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON public.plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate slug
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim($1), '[^a-zA-Z0-9\s]', '', 'g'));
$$;

-- Insert sample plants data
INSERT INTO public.plants (slug, common_name, scientific_name, category, subcategory, climate, soil, watering_schedule, sunlight, fertilizer, diseases, remedies, harvesting, description, care_instructions, images) VALUES
-- Home Plants
('snake-plant', 'Snake Plant', 'Sansevieria trifasciata', 'home', 'succulents', 'Tropical', 'Well-draining', 'Once every 2-3 weeks', 'Low to bright indirect', 'Monthly liquid fertilizer', '{"Root rot","Mealybugs"}', '{"Reduce watering","Neem oil treatment"}', 'N/A', 'Low-maintenance succulent perfect for beginners', 'Water sparingly, avoid overwatering', '{}'),

('monstera', 'Monstera Deliciosa', 'Monstera deliciosa', 'home', 'foliage', 'Tropical', 'Well-draining potting mix', 'Weekly', 'Bright indirect light', 'Monthly during growing season', '{"Root rot","Spider mites"}', '{"Improve drainage","Increase humidity"}', 'N/A', 'Popular houseplant with split leaves', 'Provide support for climbing', '{}'),

('peace-lily', 'Peace Lily', 'Spathiphyllum wallisii', 'home', 'flowering', 'Tropical', 'Moist, well-draining', 'When soil surface is dry', 'Low to medium light', 'Monthly liquid fertilizer', '{"Root rot","Brown tips"}', '{"Reduce watering","Use filtered water"}', 'N/A', 'Elegant flowering houseplant', 'Keep soil consistently moist but not soggy', '{}'),

('fiddle-leaf-fig', 'Fiddle Leaf Fig', 'Ficus lyrata', 'home', 'foliage', 'Tropical', 'Well-draining potting mix', '1-2 times per week', 'Bright indirect light', 'Monthly during spring/summer', '{"Leaf drop","Scale insects"}', '{"Consistent watering","Insecticidal soap"}', 'N/A', 'Statement plant with large violin-shaped leaves', 'Rotate regularly for even growth', '{}'),

('spider-plant', 'Spider Plant', 'Chlorophytum comosum', 'home', 'foliage', 'Temperate', 'Well-draining potting mix', '2-3 times per week', 'Bright indirect light', 'Monthly liquid fertilizer', '{"Root rot","Aphids"}', '{"Improve drainage","Neem oil spray"}', 'N/A', 'Easy-care plant that produces plantlets', 'Propagate plantlets in water or soil', '{}'),

('rubber-plant', 'Rubber Plant', 'Ficus elastica', 'home', 'foliage', 'Tropical', 'Well-draining potting mix', 'Weekly', 'Bright indirect light', 'Monthly during growing season', '{"Leaf drop","Mealybugs"}', '{"Consistent care","Insecticidal soap"}', 'N/A', 'Classic houseplant with glossy leaves', 'Wipe leaves regularly to keep them shiny', '{}'),

('aloe-vera', 'Aloe Vera', 'Aloe barbadensis', 'home', 'succulents', 'Arid', 'Sandy, well-draining', 'Every 2-3 weeks', 'Bright indirect light', 'Rarely needed', '{"Root rot","Scale insects"}', '{"Reduce watering","Remove affected parts"}', '3-4 years for gel', 'Medicinal succulent with healing properties', 'Allow soil to dry completely between waterings', '{}'),

('pothos', 'Golden Pothos', 'Epipremnum aureum', 'home', 'foliage', 'Tropical', 'Well-draining potting mix', '1-2 times per week', 'Low to bright indirect', 'Monthly liquid fertilizer', '{"Root rot","Mealybugs"}', '{"Improve drainage","Neem oil treatment"}', 'N/A', 'Trailing vine perfect for hanging baskets', 'Pinch back to encourage fuller growth', '{}'),

-- Agricultural Crops
('rice', 'Rice', 'Oryza sativa', 'agri', 'grains', 'Tropical/Subtropical', 'Clay loam, flooded', 'flooded fields', 'Full sun', 'NPK fertilizer', '{"Blast","Brown spot"}', '{"Resistant varieties","Fungicide application"}', '3-6 months after planting', 'Staple cereal crop', 'Maintain proper water levels throughout growth', '{}'),

('wheat', 'Wheat', 'Triticum aestivum', 'agri', 'grains', 'Temperate', 'Loamy soil', 'Rainfall dependent', 'Full sun', 'Nitrogen-rich fertilizer', '{"Rust","Smut"}', '{"Crop rotation","Fungicide treatment"}', '4-6 months after sowing', 'Major cereal grain crop', 'Plant during cool season for best yields', '{}'),

('tomato', 'Tomato', 'Solanum lycopersicum', 'agri', 'vegetables', 'Warm temperate', 'Well-draining, fertile', 'Regular, deep watering', 'Full sun', 'Balanced NPK fertilizer', '{"Blight","Wilt"}', '{"Crop rotation","Resistant varieties"}', '2-3 months after transplanting', 'Popular vegetable crop', 'Provide support for indeterminate varieties', '{}'),

('cotton', 'Cotton', 'Gossypium hirsutum', 'agri', 'fiber', 'Subtropical', 'Well-draining loam', 'Moderate rainfall', 'Full sun', 'High potassium fertilizer', '{"Bollworm","Fusarium wilt"}', '{"Integrated pest management","Resistant varieties"}', '5-6 months after planting', 'Important fiber crop', 'Requires long frost-free growing season', '{}'),

('sugarcane', 'Sugarcane', 'Saccharum officinarum', 'agri', 'cash crop', 'Tropical', 'Rich, fertile soil', 'High water requirement', 'Full sun', 'High nitrogen fertilizer', '{"Red rot","Smut"}', '{"Healthy planting material","Fungicide treatment"}', '10-18 months', 'Major sugar-producing crop', 'Plant during monsoon season', '{}'),

('maize', 'Maize/Corn', 'Zea mays', 'agri', 'grains', 'Temperate to tropical', 'Well-draining fertile soil', 'Regular watering', 'Full sun', 'High nitrogen fertilizer', '{"Corn borer","Leaf blight"}', '{"Bt varieties","Crop rotation"}', '3-4 months after planting', 'Versatile cereal crop', 'Plant after soil temperature reaches 60°F', '{}'),

('soybean', 'Soybean', 'Glycine max', 'agri', 'legumes', 'Temperate', 'Well-draining loam', 'Moderate water needs', 'Full sun', 'Phosphorus and potassium', '{"Rust","Pod borer"}', '{"Resistant varieties","Integrated management"}', '3-5 months after planting', 'Important protein and oil crop', 'Fixes nitrogen in soil naturally', '{}'),

-- Indian Crops
('basmati-rice', 'Basmati Rice', 'Oryza sativa basmati', 'agri', 'grains', 'Subtropical', 'Alluvial soil', 'Flooded cultivation', 'Full sun', 'Organic manure preferred', '{"Bacterial blight","Sheath blight"}', '{"Resistant varieties","Proper water management"}', '4-5 months', 'Premium aromatic rice variety', 'Requires specific climatic conditions', '{}'),

('turmeric', 'Turmeric', 'Curcuma longa', 'agri', 'spices', 'Tropical', 'Rich, well-draining loam', 'Regular watering', 'Partial shade', 'Organic fertilizer', '{"Rhizome rot","Leaf spot"}', '{"Proper drainage","Fungicide spray"}', '7-10 months', 'Important spice and medicinal crop', 'Harvest when leaves turn yellow', '{}'),

('cardamom', 'Cardamom', 'Elettaria cardamomum', 'agri', 'spices', 'Tropical hill regions', 'Rich forest soil', 'High humidity, regular rain', 'Filtered sunlight', 'Organic manure', '{"Capsule rot","Thrips"}', '{"Shade management","Integrated pest control"}', '3 years to mature', 'Queen of spices', 'Requires cool, humid climate', '{}'),

('black-pepper', 'Black Pepper', 'Piper nigrum', 'agri', 'spices', 'Tropical', 'Well-draining red soil', 'High rainfall area', 'Partial shade', 'Organic compost', '{"Quick wilt","Pollu beetle"}', '{"Resistant rootstock","Biological control"}', '3-4 years to fruit', 'King of spices', 'Climbing vine requiring support', '{}'),

('coconut', 'Coconut', 'Cocos nucifera', 'agri', 'plantation', 'Tropical coastal', 'Sandy loam', 'Rainfall 1000-2000mm', 'Full sun', 'Balanced NPK', '{"Lethal yellowing","Rhinoceros beetle"}', '{"Resistant varieties","Integrated management"}', '6-10 years to mature', 'Versatile palm crop', 'Requires coastal saline conditions', '{}'),

('tea', 'Tea', 'Camellia sinensis', 'agri', 'plantation', 'Subtropical hills', 'Acidic, well-draining', 'High rainfall', 'Partial shade', 'Nitrogen-rich fertilizer', '{"Blister blight","Red spider mite"}', '{"Fungicide spray","Biological control"}', 'Year-round plucking', 'Popular beverage crop', 'Requires cool, humid hill climate', '{}'),

('mustard', 'Mustard', 'Brassica juncea', 'agri', 'oilseeds', 'Cool temperate', 'Fertile loam soil', 'Moderate water needs', 'Full sun', 'Balanced fertilizer', '{"White rust","Aphids"}', '{"Resistant varieties","Neem spray"}', '3-4 months', 'Important oilseed crop', 'Sow during winter season', '{}'),

-- Flowering Plants
('marigold', 'Marigold', 'Tagetes erecta', 'home', 'flowering', 'Temperate', 'Well-draining soil', '2-3 times per week', 'Full sun', 'Balanced fertilizer', '{"Damping off","Spider mites"}', '{"Proper spacing","Neem oil spray"}', 'Continuous flowering', 'Popular annual flowering plant', 'Deadhead regularly for continuous blooms', '{}'),

('rose', 'Rose', 'Rosa species', 'home', 'flowering', 'Temperate', 'Rich, well-draining soil', 'Deep, regular watering', 'Full sun (6+ hours)', 'High potassium fertilizer', '{"Black spot","Aphids"}', '{"Fungicide spray","Insecticidal soap"}', 'Multiple seasons', 'Classic flowering shrub', 'Prune regularly for best blooms', '{}'),

('sunflower', 'Sunflower', 'Helianthus annuus', 'agri', 'flowering', 'Temperate', 'Well-draining loam', 'Moderate water needs', 'Full sun', 'Low nitrogen, high phosphorus', '{"Downy mildew","Head rot"}', '{"Crop rotation","Fungicide treatment"}', '3-4 months', 'Oil-producing flowering crop', 'Plant after frost danger passes', '{}'),

('jasmine', 'Jasmine', 'Jasminum sambac', 'home', 'flowering', 'Tropical/Subtropical', 'Rich, moist soil', 'Regular watering', 'Full sun to partial shade', 'Monthly organic fertilizer', '{"Leaf spot","Scale insects"}', '{"Proper air circulation","Neem oil treatment"}', 'Year-round in tropics', 'Fragrant flowering vine', 'Provide support for climbing varieties', '{}');