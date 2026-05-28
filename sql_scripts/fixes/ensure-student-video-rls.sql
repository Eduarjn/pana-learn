
-- Ensure RLS allows students to view videos and progress
CREATE POLICY "Todos podem ver videos" ON public.videos FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Todos podem ver video progress" ON public.video_progress FOR SELECT USING (auth.uid() IS NOT NULL);

