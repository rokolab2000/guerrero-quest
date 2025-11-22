-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'therapist', 'patient');
CREATE TYPE public.animal_type AS ENUM ('leon', 'aguila', 'oso', 'lobo', 'tigre');
CREATE TYPE public.mission_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  animal_warrior animal_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist') OR public.has_role(auth.uid(), 'admin'));

-- Exercises table
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  body_part TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  duration_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

-- Missions table
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status mission_status DEFAULT 'pending',
  gems_reward INTEGER DEFAULT 10,
  scheduled_for DATE DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions"
  ON public.missions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own missions"
  ON public.missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions"
  ON public.missions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_gems INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'therapist') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile and progress on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'));
  
  INSERT INTO public.user_progress (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample exercises
INSERT INTO public.exercises (name, description, body_part, difficulty, duration_minutes) VALUES
  ('Elevación de Brazo', 'Levanta el brazo lentamente hacia arriba', 'brazo', 'beginner', 3),
  ('Rotación de Hombro', 'Gira el hombro en círculos suaves', 'hombro', 'beginner', 4),
  ('Flexión de Torso', 'Inclínate suavemente hacia adelante', 'torso', 'intermediate', 5),
  ('Estiramiento Lateral', 'Estira el brazo hacia el costado', 'brazo', 'beginner', 3),
  ('Movimiento de Cuello', 'Mueve el cuello de lado a lado', 'cuello', 'beginner', 2);