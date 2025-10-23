'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Lesson } from '@/lib/database.types';
import { BookOpen, Loader2, CheckCircle2, AlertCircle, RotateCcw, Info } from 'lucide-react';

export default function Home() {
  const [outline, setOutline] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchLessons();

    const channel = supabase
      .channel('lessons_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
        },
        () => {
          fetchLessons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLessons = async () => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lessons:', error);
    } else {
      setLessons(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outline.trim()) return;

    setIsSubmitting(true);

    try {
      const title = outline.length > 100 ? outline.substring(0, 100) + '...' : outline;

      const insertPayload = {
        title,
        outline: outline.trim(),
        status: 'generating' as const,
      };
      
      const { data: lesson, error: insertError } = await (supabase
        .from('lessons')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert as any)(insertPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: lesson.id,
          outline: outline.trim(),
        }),
      })
      .then(response => {
        if (!response.ok) {
          console.error('Lesson generation request failed:', response.status, response.statusText);
        }
      })
      .catch(err => {
        console.error('Error triggering lesson generation:', err);
      });

      setOutline('');
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLessonClick = (lessonId: string, status: string) => {
    if (status === 'generated') {
      router.push(`/lessons/${lessonId}`);
    }
  };

  const handleRetry = async (lessonId: string, outline: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    try {
      // Update status to generating
      const { error: updateError } = await (supabase
        .from('lessons')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update as any)({ 
          status: 'generating',
          error: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (updateError) {
        console.error('Error updating lesson status:', updateError);
        alert('Failed to retry lesson generation. Please try again.');
        return;
      }

      // Trigger regeneration
      fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          outline,
        }),
      }).catch(err => {
        console.error('Error triggering lesson regeneration:', err);
      });

    } catch (error) {
      console.error('Error retrying lesson:', error);
      alert('Failed to retry lesson generation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-10 h-10 text-slate-700" />
            <h1 className="text-4xl font-bold text-slate-800">Digital Lessons</h1>
          </div>
          <p className="text-slate-600 text-lg">Generate interactive educational content with AI</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Create New Lesson</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="outline" className="block text-sm font-medium text-slate-700 mb-2">
                Lesson Outline
              </label>
              <textarea
                id="outline"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="e.g., A 10 question pop quiz on Florida or A one-pager on how to divide with long division"
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent resize-none text-slate-800 placeholder-slate-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !outline.trim()}
              className="w-full bg-slate-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate Lesson'
              )}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200">
            <h2 className="text-2xl font-semibold text-slate-800">Your Lessons</h2>
          </div>

          {lessons.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-500">
              No lessons yet. Create your first lesson above!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">Title</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">Created</th>
                    <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id, lesson.status)}
                      className={`transition-colors ${
                        lesson.status === 'generated'
                          ? 'hover:bg-slate-50 cursor-pointer'
                          : lesson.status === 'error' || lesson.status === 'failed'
                          ? 'hover:bg-red-50 cursor-default'
                          : 'cursor-default'
                      }`}
                    >
                      <td className="px-8 py-4 text-slate-800">{lesson.title}</td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          {lesson.status === 'generating' ? (
                            <>
                              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                              <span className="text-sm font-medium text-amber-600">Generating</span>
                            </>
                          ) : lesson.status === 'error' || lesson.status === 'failed' ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600">
                                {lesson.status === 'failed' ? 'Failed' : 'Error'}
                              </span>
                              {lesson.error && (
                                <div className="group relative">
                                  <Info className="w-3 h-3 text-slate-400 hover:text-slate-600 cursor-help" />
                                  <div className="opacity-0 group-hover:opacity-100 absolute left-0 top-full mt-1 z-20 w-80 bg-gray-900 text-white text-xs rounded-lg px-4 py-3 shadow-xl transition-opacity duration-200 pointer-events-none">
                                    <div className="font-medium mb-1">Error Details:</div>
                                    <div className="text-gray-200">{lesson.error}</div>
                                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-medium text-emerald-600">Generated</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-slate-600">
                        {new Date(lesson.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-8 py-4">
                        {(lesson.status === 'error' || lesson.status === 'failed') && (
                          <button
                            onClick={(e) => handleRetry(lesson.id, lesson.outline, e)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200"
                            title="Retry lesson generation"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Retry
                          </button>
                        )}
                        {lesson.status === 'generated' && (
                          <span className="text-sm text-slate-400">View</span>
                        )}
                        {lesson.status === 'generating' && (
                          <span className="text-sm text-slate-400">Processing...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}