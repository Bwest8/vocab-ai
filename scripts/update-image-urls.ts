import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateImageUrls() {
  try {
    // Update all existing image URLs to use API route
    const result = await prisma.$executeRaw`
      UPDATE vocab_examples
      SET "imageUrl" = REPLACE("imageUrl", '/vocab-sets/', '/api/images/vocab-sets/')
      WHERE "imageUrl" LIKE '/vocab-sets/%'
        AND "imageUrl" NOT LIKE '/api/images/vocab-sets/%';
    `;

    console.log(`Updated ${result} image URLs to use API route`);

    // Verify the update
    const examples = await prisma.vocabExample.findMany({
      where: {
        imageUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        imageUrl: true,
      },
      take: 10,
    });

    console.log('\nSample updated URLs:');
    examples.forEach((ex) => {
      console.log(`  ${ex.id}: ${ex.imageUrl}`);
    });
  } catch (error) {
    console.error('Error updating image URLs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateImageUrls();
