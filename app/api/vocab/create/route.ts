import { NextResponse } from 'next/server';
import { generateExampleImage, processVocabularyWordWithExamples, parseVocabText } from '@/lib/gemini';
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

    // Parse the raw text into individual words
    console.log('Parsing vocab text...');
    const parsedWords = parseVocabText(rawText);
    
    if (parsedWords.length === 0) {
      return NextResponse.json(
        { error: 'No vocabulary words found in the provided text' },
        { status: 400 }
      );
    }

    console.log(`Found ${parsedWords.length} words to process`);

    // Create the vocabulary set
    const vocabSet = await prisma.vocabSet.create({
      data: {
        name: vocabSetName || `Vocabulary Set ${new Date().toLocaleDateString()}`,
        description: description || null,
        grade: grade || null,
      },
    });

    console.log(`Created vocab set: ${vocabSet.name} (${vocabSet.id})`);

    // Process each word with AI
    const processedWords = [];
    const errors = [];

    for (const parsedWord of parsedWords) {
      try {
        console.log(`Processing word: ${parsedWord.word}`);
        
        // Use Gemini to generate comprehensive details
        const aiResult = await processVocabularyWordWithExamples(parsedWord.word);
        
        // Save to database with examples
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
                `Error generating image for example ${example.id} of word "${vocabWord.word}":`,
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
        console.log(`✓ Successfully processed: ${parsedWord.word} with ${vocabWord.examples?.length || 0} examples`);
      } catch (error) {
        console.error(`Error processing word "${parsedWord.word}":`, error);
        errors.push({ 
          word: parsedWord.word, 
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
      totalWords: parsedWords.length,
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
