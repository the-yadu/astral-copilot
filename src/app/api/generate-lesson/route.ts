import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Type helper to fix Supabase update method typing issue
type SupabaseUpdatePayload = Partial<Database['public']['Tables']['lessons']['Row']>;

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!openaiApiKey) {
  throw new Error('Missing OpenAI API key');
}

const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseServiceKey);

interface RequestBody {
  lessonId: string;
  outline: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { lessonId, outline } = body;

    if (!lessonId || !outline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert educational content creator specializing in creating interactive, engaging lessons for students. Your task is to generate a TypeScript React component that renders an educational lesson based on the provided outline.

CRITICAL REQUIREMENTS FOR TYPESCRIPT COMPONENT:
1. Generate COMPLETE TypeScript/TSX code with proper type annotations
2. Use modern React with TypeScript patterns (React.FC, proper typing)
3. Include proper type definitions for all state, props, and variables
4. Use React hooks with proper TypeScript typing (useState<T>, useEffect, etc.)
5. Use ONLY Tailwind CSS classes for styling (no inline styles, no CSS modules)
6. Do NOT use any imports - assume React and its types are available globally
7. Include interactive elements when appropriate (buttons, inputs, etc.) with proper typing
8. Use appropriate educational formatting (headings, lists, examples, etc.)
9. For quizzes, include answer checking functionality with feedback and proper types
10. The component should be self-contained and render immediately
11. Do NOT include any code blocks or markdown formatting in your response
12. Use proper TypeScript interfaces for any complex data structures
13. End with: export default LessonComponent;

CRITICAL STYLING REQUIREMENTS FOR READABILITY:
- ALWAYS use dark text colors: text-slate-800, text-slate-900, text-gray-800, text-gray-900
- Use high contrast combinations: dark text on light backgrounds
- For headings use: text-2xl font-bold text-slate-800 or text-3xl font-bold text-slate-900
- For body text use: text-slate-700 or text-slate-800
- For buttons use: bg-blue-600 text-white or bg-slate-700 text-white
- Avoid light text colors like text-slate-400, text-gray-400, text-slate-300
- Use proper spacing: p-6, p-8, mb-4, mb-6 for good readability
- Ensure all text is clearly visible and readable

CRITICAL UI/UX REQUIREMENTS FOR INTERACTIVE ELEMENTS:
- Quiz options MUST have proper spacing: use mb-3 or mb-4 between options
- Quiz option buttons MUST be full-width or properly sized: w-full or min-w-48
- Quiz options MUST have hover states: hover:bg-blue-50 hover:border-blue-300
- Quiz options MUST show selection state with clear visual feedback
- Use proper padding for buttons: px-6 py-3 or px-4 py-2 minimum
- Selected options should have distinct styling: bg-blue-100 border-blue-400 text-blue-800
- Correct answers should show green: bg-green-100 border-green-400 text-green-800
- Wrong answers should show red: bg-red-100 border-red-400 text-red-800
- Use rounded corners for modern look: rounded-lg or rounded-md
- Add subtle shadows for depth: shadow-sm or shadow-md
- Ensure proper contrast ratios for accessibility
- Use transition effects for smooth interactions: transition-all duration-200
- Add focus states for keyboard navigation: focus:outline-none focus:ring-2 focus:ring-blue-500

REQUIRED STRUCTURE (follow exactly):
import React, { useState, useEffect } from 'react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizState {
  selectedAnswers: { [key: number]: number | null };
  showResults: { [key: number]: boolean };
  answered: { [key: number]: boolean };
}

const LessonComponent: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    selectedAnswers: {},
    showResults: {},
    answered: {}
  });
  
  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    setQuizState(prev => ({
      ...prev,
      selectedAnswers: { ...prev.selectedAnswers, [questionId]: optionIndex }
    }));
  };

  const checkAnswer = (questionId: number, correctAnswer: number) => {
    setQuizState(prev => ({
      ...prev,
      showResults: { ...prev.showResults, [questionId]: true },
      answered: { ...prev.answered, [questionId]: true }
    }));
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Lesson Title</h1>
      <p className="text-lg text-slate-800 mb-8">Lesson description with proper spacing</p>
      
      <div className="space-y-8">
        <section className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">Content Section</h2>
          <p className="text-slate-700 mb-6">Educational content with good readability</p>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold mb-4 text-slate-800">Quiz Question</h3>
          <p className="text-lg mb-6 text-slate-800">What is 7 - 5?</p>
          
          <div className="space-y-3">
            {['1', '2', '3', '4'].map((option, index) => {
              const isSelected = quizState.selectedAnswers[1] === index;
              const showResult = quizState.showResults[1];
              const isCorrect = index === 1; // Correct answer is index 1
              
              let buttonClasses = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed ";
              
              if (!showResult && !isSelected) {
                buttonClasses += "bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-slate-800";
              } else if (!showResult && isSelected) {
                buttonClasses += "bg-blue-100 border-blue-400 text-blue-800";
              } else if (showResult && isCorrect) {
                buttonClasses += "bg-green-100 border-green-400 text-green-800";
              } else if (showResult && !isCorrect && isSelected) {
                buttonClasses += "bg-red-100 border-red-400 text-red-800";
              } else if (showResult && !isCorrect && !isSelected) {
                buttonClasses += "bg-gray-100 border-gray-300 text-gray-600";
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(1, index)}
                  disabled={quizState.answered[1]}
                  className={buttonClasses}
                >
                  {option}
                </button>
              );
            })}
          </div>
          
          {quizState.selectedAnswers[1] !== undefined && !quizState.showResults[1] && (
            <button
              onClick={() => checkAnswer(1, 1)}
              className="mt-4 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Check Answer
            </button>
          )}
          
          {quizState.showResults[1] && (
            <div className={quizState.selectedAnswers[1] === 1 ? 'mt-4 p-4 rounded-lg bg-green-50 text-green-800' : 'mt-4 p-4 rounded-lg bg-red-50 text-red-800'}>
              {quizState.selectedAnswers[1] === 1 ? 'Correct! Well done!' : 'Try again! That is not the correct answer.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default LessonComponent;

Generate complete, production-ready TypeScript/TSX code with full type safety and proper React patterns.`;

    const userPrompt = `Create an interactive educational lesson based on this outline:\n\n${outline}\n\nGenerate complete, production-ready TypeScript/TSX code with full type safety that will render beautifully in the browser. Make it engaging and educational for students. Include proper TypeScript interfaces and type annotations throughout.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    let generatedContent = openaiData.choices[0].message.content;

    // Remove any code block markers
    generatedContent = generatedContent.replace(/```typescript\n?/g, "").replace(/```tsx\n?/g, "").replace(/```javascript\n?/g, "").replace(/```jsx\n?/g, "").replace(/```\n?/g, "");
    generatedContent = generatedContent.trim();

    // Validate the generated content
    if (!generatedContent.includes("export default LessonComponent")) {
      throw new Error("Generated content does not include the required export statement");
    }

    if (!generatedContent.includes("const LessonComponent: React.FC")) {
      throw new Error("Generated content does not include the proper TypeScript component definition");
    }

    // Basic syntax validation - ensure TypeScript patterns are present
    if (!generatedContent.includes("import React")) {
      throw new Error("Generated content missing React import statement");
    }

    console.log("Generated content preview:", generatedContent.substring(0, 500));

    // Create TSX file name with lesson ID
    const fileName = `lesson-${lessonId}.tsx`;
    const filePath = `lessons/${fileName}`;

    // Try to upload to storage first, but use database as fallback
    console.log("Attempting to upload to Supabase storage...");
    
    const { error: uploadError } = await supabase.storage
      .from('lesson-files')
      .upload(filePath, generatedContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.log("Storage upload failed, using database fallback:", uploadError.message);
      
      // Store the content directly in the database as fallback
      const lessonsTable = supabase.from("lessons");
      const updatePayload: SupabaseUpdatePayload = {
        content: generatedContent,
        status: "generated",
        updated_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (lessonsTable.update as any)(updatePayload)
        .eq("id", lessonId);

      if (updateError) {
        throw new Error(`Failed to store lesson content in database: ${updateError.message}`);
      }
      
      console.log("Successfully stored lesson content in database as fallback");
      return NextResponse.json({
        success: true,
        lessonId,
        stored: 'database'
      });
    }

    // Update the lesson record with the file path
    const lessonsTable = supabase.from("lessons");
    const updatePayload: SupabaseUpdatePayload = {
      file_path: filePath,
      status: "generated",
      updated_at: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (lessonsTable.update as any)(updatePayload)
      .eq("id", lessonId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      lessonId,
    });
  } catch (error) {
    console.error("Error generating lesson:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update the lesson with error status if we have a lessonId
    const body = await req.json().catch(() => ({}));
    const lessonId = body.lessonId;

    if (lessonId) {
      try {
        const lessonsTable = supabase.from("lessons");
        const updatePayload: SupabaseUpdatePayload = {
          status: "error",
          error: errorMessage,
          updated_at: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (lessonsTable.update as any)(updatePayload)
          .eq("id", lessonId);
      } catch (updateError) {
        console.error("Failed to update lesson with error status:", updateError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}