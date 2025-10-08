import { NextResponse } from 'next/server';
import { processVocabularyWords, parseVocabText } from '@/lib/gemini';
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

    // Simply pass the raw text to the AI - it will parse and process everything
    const cleanedText = parseVocabText(rawText);
    
    if (!cleanedText) {
      return NextResponse.json(
        { error: 'No vocabulary text provided' },
        { status: 400 }
      );
    }

    console.log('Processing vocabulary text with AI...');

    // Create the vocabulary set
    const vocabSet = await prisma.vocabSet.create({
      data: {
        name: vocabSetName || `Vocabulary Set ${new Date().toLocaleDateString()}`,
        description: description || null,
        grade: grade || null,
      },
    });

    console.log(`Created vocab set: ${vocabSet.name} (${vocabSet.id})`);

    // Process ALL words with AI in a single batch request - AI parses and processes everything
    console.log('Sending raw text to AI for parsing and processing...');
    const aiResults = await processVocabularyWords(cleanedText);
    console.log(`✓ AI processing complete for ${aiResults.length} words`);

    // Save all words and examples to database in a transaction
    console.log('Saving to database...');
    const processedWords = [];
    const errors = [];

    for (const aiResult of aiResults) {
      try {
        // Save to database with examples
        const vocabWord = await prisma.vocabWord.create({
          data: {
            word: aiResult.WORD,
            definition: aiResult.DEFINITION,
            teacherDefinition: aiResult.TEACHER_DEFINITION,
            pronunciation: aiResult.PRONUNCIATION,
            partOfSpeech: aiResult.PART_OF_SPEECH,
            vocabSetId: vocabSet.id,
            examples: {
              create: aiResult.EXAMPLES.map((example) => ({
                sentence: example.sentence,
                imageDescription: example.image_description,
              })),
            },
          },
          include: {
            examples: true,
          },
        });

        processedWords.push(vocabWord);
        console.log(`✓ Saved to DB: ${aiResult.WORD} with ${vocabWord.examples?.length || 0} examples`);
      } catch (error) {
        console.error(`Error saving word "${aiResult.WORD}":`, error);
        errors.push({ 
          word: aiResult.WORD, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Fetch the complete vocab set with all words and examples
    const completeVocabSet = await prisma.vocabSet.findUnique({
      where: { id: vocabSet.id },
      include: {
        words: {
          include: {
            examples: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      vocabSet: completeVocabSet,
      processedWords: processedWords.length,
      totalWords: aiResults.length,
      message: 'Vocabulary set created successfully. Students can generate images on-demand.',
      errors: errors.length > 0 ? errors : undefined,
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
