import { connectDB } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSharedCategoryCatalog } from '@/lib/categoryCatalog';

export const revalidate = 60;

function normalizeSlug(value: any) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatCategoryName(slug: string) {
  if (!slug) return 'Uncategorized';
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();


    const formattedCategories = await getSharedCategoryCatalog();
    console.log('[api/categories] categories', formattedCategories);

    return NextResponse.json(
      {
        success: true,
        totalCategories: formattedCategories.length,
        categories: formattedCategories,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[api/categories] Error fetching categories:', error?.message ?? error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Failed to fetch categories',
        totalCategories: 0,
        categories: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim();
    const slug = normalizeSlug(body.slug || body.name || '');

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Category name is required and must produce a valid slug.' },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findOne({ slug }).lean().exec();
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category already exists.', category: existingCategory },
        { status: 409 }
      );
    }

    const newCategory = new Category({ name, slug, description });
    const savedCategory = await newCategory.save();

    revalidatePath('/');
    revalidatePath('/admin/dashboard');
    revalidatePath('/collections');

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        category: {
          slug: savedCategory.slug,
          name: savedCategory.name,
          description: savedCategory.description || '',
          productCount: 0,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[api/categories] Error creating category:', error?.message ?? error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? 'Failed to create category',
      },
      { status: 500 }
    );
  }
}
