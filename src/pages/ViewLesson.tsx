import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Lesson } from '../lib/database.types';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ViewLesson() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [LessonComponent, setLessonComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchLesson();
  }, [id]);

  const fetchLesson = async () => {
    if (!id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Lesson not found');
        setLoading(false);
        return;
      }

      setLesson(data);

      if (data.status === 'generated' && data.content) {
        try {
          const blob = new Blob([data.content], { type: 'text/javascript' });
          const url = URL.createObjectURL(blob);

          const module = await import(url);

          if (module.default) {
            setLessonComponent(() => module.default);
          } else {
            throw new Error('No default export found in generated content');
          }

          URL.revokeObjectURL(url);
        } catch (err) {
          console.error('Error loading lesson component:', err);
          setError('Failed to load lesson content. The generated code may be invalid.');
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching lesson:', err);
      setError('Failed to load lesson');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-700 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lessons
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-red-600 text-lg">{error || 'Lesson not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.status === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lessons
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Generating Lesson</h2>
            <p className="text-slate-600">Please wait while we create your lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Lessons
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {LessonComponent ? (
            <LessonComponent />
          ) : (
            <div className="p-12 text-center">
              <p className="text-slate-600">Unable to render lesson content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
