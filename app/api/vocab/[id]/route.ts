import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vocabSet = await prisma.vocabSet.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            progress: true,
            examples: true,
          },
        },
      },
    });

    if (!vocabSet) {
      return NextResponse.json(
        { error: 'Vocabulary set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vocabSet);
  } catch (error) {
    console.error('Error fetching vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary set' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, grade } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const updatedSet = await prisma.vocabSet.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        grade: grade?.trim() || null,
      },
      include: {
        words: {
          include: {
            examples: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSet);
  } catch (error) {
    console.error('Error updating vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to update vocabulary set' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete the vocab set (cascade will handle words and examples)
    await prisma.vocabSet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vocabulary set:', error);
    return NextResponse.json(
      { error: 'Failed to delete vocabulary set' },
      { status: 500 }
    );
  }
}
