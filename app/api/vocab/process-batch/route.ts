import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateExampleImage, parseVocabText, processVocabularyWordWithExamples } from '@/lib/gemini';
import type { ProcessVocabRequest, ProcessVocabResponse, GeminiVocabResponse } from '@/lib/types';

/**
 * POST /api/vocab/process-batch
 * 
 * Process a batch of vocabulary words from raw text input.
 * Parses the text, processes each word with Gemini AI, and stores in the database.
 * 
 * Request body:
 * {
 *   rawText: string;        // Pasted vocab list (numbered, with optional definitions)
 *   vocabSetName: string;   // e.g., "Lesson 4", "Week 1"
 *   description?: string;   // Optional description
 *   grade?: string;         // Optional grade level
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: ProcessVocabRequest = await request.json();
    const { rawText, vocabSetName, description, grade } = body;

    if (!rawText || !vocabSetName) {
      return NextResponse.json(
        { error: 'Missing required fields: rawText and vocabSetName' },
        { status: 400 }
      );
    }

    // Step 1: Parse the raw text to extract words
    console.log('Parsing vocab text...');
    const parsedWords = parseVocabText(rawText);
    
    if (parsedWords.length === 0) {
      return NextResponse.json(
        { error: 'No vocabulary words found in the provided text' },
        { status: 400 }
      );
    }

    console.log(`Found ${parsedWords.length} words to process`);

    // Step 2: Create the VocabSet
    const vocabSet = await prisma.vocabSet.create({
      data: {
        name: vocabSetName,
        description: description || null,
        grade: grade || null,
      },
    });

    console.log(`Created vocab set: ${vocabSet.id}`);

    // Step 3: Process each word with Gemini AI
    const processedWords = [];
    const errors = [];

    for (let i = 0; i < parsedWords.length; i++) {
      const { word } = parsedWords[i];
      
      try {
        console.log(`Processing word ${i + 1}/${parsedWords.length}: ${word}`);
        
        // Get AI-generated details with 5 examples
        const geminiResponse: GeminiVocabResponse = await processVocabularyWordWithExamples(word);
        
        // Create the word with all examples in a single transaction
        const vocabWord = await prisma.vocabWord.create({
          data: {
            word: geminiResponse.WORD,
            definition: geminiResponse.DEFINITION,
            pronunciation: geminiResponse.PRONUNCIATION,
            partOfSpeech: geminiResponse.PART_OF_SPEECH,
            vocabSetId: vocabSet.id,
            examples: {
              create: geminiResponse.EXAMPLES.map((example) => ({
                sentence: example.sentence,
                imageDescription: example.image_description,
                imageUrl: null, // Images will be generated separately
              })),
            },
          },
          include: {
            examples: true,
          },
        });

        const examplesWithImages = await Promise.all(
          (vocabWord.examples ?? []).map(async (example) => {
            try {
              const generated = await generateExampleImage({
                vocabSetId: vocabSet.id,
                exampleId: example.id,
                word: vocabWord.word,
                imageDescription: example.imageDescription,
              });

              return await prisma.vocabExample.update({
                where: { id: example.id },
                data: { imageUrl: generated.publicUrl },
              });
            } catch (imageError) {
              console.error(
                `✗ Error generating image for example ${example.id} of word "${vocabWord.word}":`,
                imageError
              );
              return example;
            }
          })
        );

        processedWords.push({
          ...vocabWord,
          examples: examplesWithImages,
        });
        console.log(`✓ Successfully processed: ${word}`);
        
      } catch (error) {
        console.error(`✗ Error processing word "${word}":`, error);
        errors.push({
          word,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Step 4: Return response
    const response: ProcessVocabResponse = {
      success: true,
      vocabSet: {
        id: vocabSet.id,
        name: vocabSet.name,
      },
      processedWords: processedWords.length,
      totalWords: parsedWords.length,
      words: processedWords,
      ...(errors.length > 0 && { errors }),
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error in process-batch endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process vocabulary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
