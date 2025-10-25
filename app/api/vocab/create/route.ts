import { NextResponse } from 'next/server';
import { processVocabularyWords } from '@/lib/xaiVocabProcessor';
import { prisma } from '@/lib/prisma';
import type { ProcessVocabRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body: ProcessVocabRequest = await request.json();
    const { rawText, vocabSetName, description, grade } = body;

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide vocabulary text to process' },
        { status: 400 }
      );
    }

    console.log('Processing vocabulary text with AI...');
    // Process ALL words with AI in a single batch request - AI parses and processes everything first
    console.log('Sending raw text to AI for parsing and processing...');
    const aiResults = await processVocabularyWords(rawText);
    console.log(`✓ AI processing complete for ${aiResults.length} words`);
    // Save all words and examples atomically so no empty sets remain if an error occurs
    console.log('Saving to database atomically...');
    const createdSet = await prisma.vocabSet.create({
      data: {
        name: vocabSetName || `Vocabulary Set ${new Date().toLocaleDateString()}`,
        description: description || null,
        grade: grade || null,
        words: {
          create: aiResults.map((aiResult) => ({
            word: aiResult.WORD,
            definition: aiResult.DEFINITION,
            teacherDefinition: aiResult.TEACHER_DEFINITION ?? null,
            pronunciation: aiResult.PRONUNCIATION ?? null,
            partOfSpeech: aiResult.PART_OF_SPEECH ?? null,
            examples: {
              create: aiResult.EXAMPLES.map((example) => ({
                sentence: example.sentence,
                imageDescription: example.image_description,
              })),
            },
          })),
        },
      },
      include: {
        words: { include: { examples: true } },
      },
    });

    return NextResponse.json({
      success: true,
      vocabSet: createdSet,
      processedWords: createdSet.words?.length ?? 0,
      totalWords: aiResults.length,
      message: 'Vocabulary set created successfully. Students can generate images on-demand.',
    });
  } catch (error) {
    console.error('Error in create-vocab API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create vocabulary set', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}