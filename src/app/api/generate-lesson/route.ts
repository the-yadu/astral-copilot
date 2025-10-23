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
7. Include interactive elements when appropriate (buttons, inputs, sliders, etc.) with proper typing
8. Use creative and varied educational formatting (headings, lists, examples, diagrams, cards, etc.)
9. For interactive elements, include appropriate functionality with feedback and proper types
10. The component should be self-contained and render immediately
11. Do NOT include any code blocks or markdown formatting in your response
12. Use proper TypeScript interfaces for any complex data structures
13. End with: export default LessonComponent;

DESIGN AND STYLING PRINCIPLES:
- CRITICAL: Prioritize text readability above all else - use high contrast combinations (dark text on light backgrounds)
- Use systematic typography hierarchy with appropriate font sizes (text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl)
- Implement proper line spacing (leading-relaxed, leading-loose) for enhanced readability
- Choose accessible color palettes with sufficient contrast ratios (use tools like text-slate-900, text-gray-800 for primary text)
- Use semantic color coding (green for success, red for errors, blue for information, yellow for warnings)
- Implement responsive design with mobile-first approach (sm:, md:, lg:, xl: breakpoints)
- Add generous spacing and padding for comfortable reading experience (p-4, p-6, p-8, mb-4, mb-6, mb-8)
- Use visual hierarchy to guide attention (font weights, sizes, colors, spacing)
- Include smooth transitions and micro-interactions (transition-all, duration-200, hover: states)
- Ensure all interactive elements are accessible with proper focus states (focus:outline-none focus:ring-2)

TAILWIND CSS STYLING BEST PRACTICES:
- Use modern component styling with proper shadows (shadow-sm, shadow-md, shadow-lg) and rounded corners (rounded-lg, rounded-xl)
- Implement consistent spacing patterns using Tailwind's spacing scale (space-y-4, space-y-6, gap-4, gap-6)
- Utilize Tailwind's color palette effectively (slate, gray, blue, green, red, amber for semantic meanings)
- Create polished cards and containers (bg-white, border, border-gray-200, rounded-lg, p-6)
- Use gradient backgrounds sparingly but effectively (bg-gradient-to-r, from-blue-50, to-indigo-50)
- Implement hover and focus states consistently (hover:bg-gray-50, focus:ring-blue-500)
- Use flexbox and grid layouts for responsive design (flex, grid, items-center, justify-between)
- Add loading and interactive states (disabled:opacity-50, cursor-pointer, select-none)

INTERACTIVE ELEMENTS GUIDELINES:
- Design quiz interfaces with clear visual hierarchy and intuitive interactions
- Use distinctive styling for different interaction states (bg-blue-50 for hover, bg-blue-100 for selected)
- Implement proper button styling (px-4 py-2, rounded-md, font-medium, shadow-sm)
- Include engaging interactive elements like progress bars, animated feedback, or visual demonstrations
- Provide immediate visual feedback with color changes and transitions
- Design progress indicators using Tailwind's width utilities (w-1/4, w-1/2, w-3/4, w-full)
- Consider gamification elements that enhance learning (badges, progress rings, achievement states)

TEXT READABILITY REQUIREMENTS:
- ALWAYS ensure maximum text readability - use dark text (text-slate-900, text-gray-900) on light backgrounds
- Avoid low contrast combinations like light gray text on white backgrounds
- Use appropriate font sizes for content hierarchy: headings (text-2xl, text-3xl), body (text-base, text-lg), captions (text-sm)
- Implement proper line heights for comfortable reading (leading-6, leading-7, leading-relaxed)
- Add sufficient whitespace around text blocks (mb-4, mb-6 for paragraphs, mt-8 for sections)
- Use font weights strategically (font-medium for emphasis, font-semibold for subheadings, font-bold for headings)
- Ensure text remains readable across all device sizes with responsive typography

CREATIVE FREEDOM:
- Choose layout patterns that best suit the lesson content (single column, multi-column, grid layouts)
- Select professional color palettes using Tailwind's semantic colors (blue for primary, green for success, red for alerts)
- Design unique interactive components with polished Tailwind styling (cards, modals, dropdowns, tabs)
- Use creative visual metaphors with proper styling (timelines with connecting lines, comparison tables, step indicators)
- Implement varied content presentation styles with consistent Tailwind patterns
- Include visual elements like animated progress bars, styled achievement badges, or checkpoint indicators
- Create cohesive design systems using Tailwind's utility classes for consistency

COMPONENT STRUCTURE (REQUIRED PATTERNS):
- Start with: import React, { useState, useEffect } from 'react';
- Define TypeScript interfaces before the component
- Use this exact pattern: const LessonComponent: React.FC = () => {
- Include proper state management with TypeScript types
- Structure JSX with a clear return statement
- End with: export default LessonComponent;

EXAMPLE STRUCTURE:
import React, { useState, useEffect } from 'react';

interface YourDataInterface {
  // Define your interfaces here
}

const LessonComponent: React.FC = () => {
  const [state, setState] = useState<YourType>(initialValue);
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Your lesson content */}
    </div>
  );
};

export default LessonComponent;

Generate creative, engaging, and educationally effective TypeScript/TSX code that creates a unique learning experience tailored to the specific lesson outline provided.`;

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

    // Validate the generated content with flexible patterns
    const hasValidExport = generatedContent.includes("export default LessonComponent") || 
                          generatedContent.includes("export default ") || 
                          generatedContent.match(/export\s+default\s+\w+Component/);
    
    if (!hasValidExport) {
      console.warn("Generated content may not have proper export, but continuing...");
    }

    const hasValidComponent = generatedContent.includes("const LessonComponent: React.FC") ||
                             generatedContent.includes("const LessonComponent =") ||
                             generatedContent.includes("function LessonComponent") ||
                             generatedContent.match(/const\s+\w+Component.*=/);
    
    if (!hasValidComponent) {
      console.warn("Generated content may not have proper component definition, but continuing...");
    }

    // Basic syntax validation - ensure React patterns are present
    const hasReactImport = generatedContent.includes("import React") ||
                          generatedContent.includes("import { ") ||
                          generatedContent.includes("React.") ||
                          generatedContent.includes("useState") ||
                          generatedContent.includes("useEffect");
    
    if (!hasReactImport) {
      console.warn("Generated content may not have React import, but continuing...");
    }

    // Only fail if content is completely invalid (too short or obviously broken)
    if (generatedContent.length < 100) {
      throw new Error("Generated content is too short to be a valid component");
    }

    if (!generatedContent.includes("return") && !generatedContent.includes("=>")) {
      throw new Error("Generated content does not appear to be a valid React component");
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