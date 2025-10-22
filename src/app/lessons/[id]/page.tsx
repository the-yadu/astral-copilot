'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Lesson } from '@/lib/database.types';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface ViewLessonProps {
  params: Promise<{ id: string }>;
}

export default function ViewLesson({ params }: ViewLessonProps) {
  const [id, setId] = useState<string | null>(null);
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [LessonComponent, setLessonComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle async params in Next.js 15
  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId);
    });
  }, [params]);

  useEffect(() => {
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

        if (data.status === 'generated') {
          let jsContent: string;

          try {
            // First try to get content from stored file
            if (data.file_path) {
              // Download the TSX file from Supabase storage for dynamic import
              const { data: fileData, error: downloadError } = await supabase.storage
                .from('lesson-files')
                .download(data.file_path);
                
              if (downloadError) {
                console.warn('Storage download failed, trying database content:', downloadError);
                if (data.content) {
                  jsContent = data.content;
                } else {
                  throw new Error('No content available in storage or database');
                }
              } else {
                // Convert the file to text
                jsContent = await fileData.text();
              }
            } else if (data.content) {
              // Use content stored directly in database
              jsContent = data.content;
            } else {
              throw new Error('No lesson content found');
            }
            
            // Log the content for debugging
            console.log('Generated TSX Content:', jsContent);
            
            // Validate that the content has the expected TypeScript structure
            if (!jsContent.includes('export default LessonComponent')) {
              throw new Error('Generated content missing export default statement');
            }
            
            try {
              // Transform TypeScript/TSX to JavaScript using Babel
              const { transform } = await import('@babel/standalone');
              
              const transformResult = transform(jsContent, {
                presets: [
                  ['typescript', { isTSX: true, allExtensions: true }],
                  ['react']
                ],
                plugins: []
              });
              
              if (!transformResult.code) {
                throw new Error('Babel transformation failed - no code generated');
              }
              
              // Replace export default with return for function execution
              const executableCode = transformResult.code
                .replace(/^import.*from.*;\s*/gm, '') // Remove import statements
                .replace('export default LessonComponent;', 'return LessonComponent;'); // Replace export with return
              
              // Create a safe execution environment with React types
              const safeGlobals = {
                React: React,
                useState: React.useState,
                useEffect: React.useEffect,
                console: console,
                window: typeof window !== 'undefined' ? window : {},
                document: typeof document !== 'undefined' ? document : {}
              };
              
              // Wrap the transformed content in a function that provides React context
              const wrappedContent = `
                (function(React, useState, useEffect, console, window, document) {
                  ${executableCode}
                })
              `;
              
              // Execute the wrapped function with safe globals
              const executeComponent = eval(wrappedContent);
              const ComponentFunction = executeComponent(
                safeGlobals.React,
                safeGlobals.useState,
                safeGlobals.useEffect,
                safeGlobals.console,
                safeGlobals.window,
                safeGlobals.document
              );
              
              if (typeof ComponentFunction === 'function') {
                setLessonComponent(() => ComponentFunction);
              } else {
                throw new Error('Generated content did not return a valid React component');
              }
            } catch (executionError) {
              console.error('Execution error details:', executionError);
              console.error('TypeScript content that failed:', jsContent);
              const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown execution error';
              throw new Error(`Failed to execute generated TypeScript component: ${errorMessage}`);
            }

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

    fetchLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-slate-700 animate-spin" />
          <p className="text-lg text-slate-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl px-4 py-12 mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 mb-8 transition-colors text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lessons
          </button>
          <div className="p-12 text-center bg-white border shadow-sm rounded-xl border-slate-200">
            <p className="text-lg text-red-600">{error || 'Lesson not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (lesson.status === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl px-4 py-12 mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 mb-8 transition-colors text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lessons
          </button>
          <div className="p-12 text-center bg-white border shadow-sm rounded-xl border-slate-200">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-amber-500 animate-spin" />
            <h2 className="mb-2 text-2xl font-semibold text-slate-800">Generating Lesson</h2>
            <p className="text-slate-600">Please wait while we create your lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl px-4 py-12 mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 mb-8 transition-colors text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Lessons
        </button>

        <div className="overflow-hidden bg-white border shadow-sm rounded-xl border-slate-200">
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