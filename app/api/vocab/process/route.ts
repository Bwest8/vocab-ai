import { NextResponse } from 'next/server';
import { processVocabularyWordWithExamples } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { words, vocabSetName, description, grade } = body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of words' },
        { status: 400 }
      );
    }

    // Create the vocabulary set
    const vocabSet = await prisma.vocabSet.create({
      data: {
        name: vocabSetName || `Vocabulary Set ${new Date().toLocaleDateString()}`,
        description: description || null,
        grade: grade || null,
      },
    });

    // Process each word with AI
    const processedWords = [];
    const errors = [];

    for (const word of words) {
      try {
        console.log(`Processing word: ${word}`);
        
        // Use Gemini to generate comprehensive word details with multiple examples
        const aiResult = await processVocabularyWordWithExamples(word);

        // Save to database with related examples
        const vocabWord = await prisma.vocabWord.create({
          data: {
            word: aiResult.WORD,
            definition: aiResult.DEFINITION,
            pronunciation: aiResult.PRONUNCIATION,
            partOfSpeech: aiResult.PART_OF_SPEECH,
            vocabSetId: vocabSet.id,
            examples: {
              create: aiResult.EXAMPLES.map((example) => ({
                sentence: example.sentence,
                imageDescription: example.image_description,
                imageUrl: null,
              })),
            },
          },
          include: {
            examples: true,
          },
        });

        processedWords.push(vocabWord);
        console.log(`✓ Successfully processed: ${word}`);
      } catch (error) {
        console.error(`Error processing word "${word}":`, error);
        errors.push({ word, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return NextResponse.json({
      success: true,
      vocabSet: {
        id: vocabSet.id,
        name: vocabSet.name,
      },
      processedWords: processedWords.length,
      totalWords: words.length,
      words: processedWords,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in process-vocab API:', error);
    return NextResponse.json(
      { error: 'Failed to process vocabulary', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
