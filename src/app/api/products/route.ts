import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { saveUploadedFile } from '@/lib/uploadHandler';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'default';

    const skip = (page - 1) * limit;
    let query: any = { active: true };

    if (category) query.category = category;
    if (collection) query.collection = collection;
    if (featured === 'true') query.featured = true;
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { collection: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
      ];
    }

    // Build sort object
    let sortObj: any = {};
    switch (sort) {
      case 'price-low':
        sortObj = { price: 1 };
        break;
      case 'price-high':
        sortObj = { price: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'trending':
        sortObj = { rating: -1, createdAt: -1 };
        break;
      default:
        sortObj = { featured: -1, createdAt: -1 };
    }

    const products = await Product.find(query).skip(skip).limit(limit).sort(sortObj);

    const total = await Product.countDocuments(query);

    return createSuccessResponse(
      {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Products fetched successfully'
    );
  } catch (error) {
    console.error('Get products error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let body: any = {};
    let uploadedImages: string[] = [];

    // Check if this is FormData (file upload) or JSON
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData with file uploads
      const formData = await request.formData();
      
      // Extract form fields
      body = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        discountPrice: formData.get('discountPrice'),
        category: formData.get('category'),
        collection: formData.get('collection'),
        careInstructions: formData.get('careInstructions'),
        fit: formData.get('fit'),
        featured: formData.get('featured') === 'true',
        active: formData.get('active') !== 'false',
      };

      // Parse JSON arrays
      try {
        body.materials = JSON.parse(formData.get('materials') as string || '[]');
        body.sizes = JSON.parse(formData.get('sizes') as string || '[]');
        body.colors = JSON.parse(formData.get('colors') as string || '[]');
        body.tags = JSON.parse(formData.get('tags') as string || '[]');
      } catch (e) {
        console.error('Error parsing form arrays:', e);
      }

      // Handle file uploads
      const files = formData.getAll('images') as File[];
      if (files && files.length > 0) {
        for (const file of files) {
          if (file && file.size > 0) {
            try {
              const uploadResult = await saveUploadedFile(file);
              // Extract just the URL from the upload result
              // The result can be a string (URL) or an object with url property
              const imageUrl = typeof uploadResult === 'string' 
                ? uploadResult 
                : (uploadResult as any)?.url || uploadResult;
              uploadedImages.push(imageUrl);
            } catch (uploadError) {
              console.error('Error uploading file:', uploadError);
              // Continue with other files even if one fails
            }
          }
        }
      }
      body.images = uploadedImages;
    } else {
      // Handle JSON request
      body = await request.json();
    }

    // Validate required fields
    const requiredFields = ['name', 'price', 'category', 'description', 'collection'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`Missing required field: ${field}`, 400);
      }
    }

    // Validate category - accept new category types
    const validCategories = [
      'bridal',
      'groom',
      'formal',
      'informal',
      'children',
      'men',
      'women',
      'old-people',
      'young',
      'new-arrival',
      'accessories',
    ];
    if (!validCategories.includes(body.category)) {
      return createErrorResponse(
        `Invalid category. Valid categories: ${validCategories.join(', ')}`,
        400
      );
    }

    // Create new product
    const newProduct = new Product({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      collection: body.collection,
      category: body.category,
      images: Array.isArray(body.images) ? body.images : [],
      materials: Array.isArray(body.materials) ? body.materials : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      careInstructions: body.careInstructions || '',
      fit: body.fit || '',
      featured: body.featured || false,
      active: body.active !== false,
    });

    // Save to database
    const savedProduct = await newProduct.save();

    return createSuccessResponse(
      {
        product: savedProduct,
        message: 'Product created successfully',
      },
      'Product saved successfully',
      201
    );
  } catch (error) {
    console.error('Create product error:', error);
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400);
    }
    return createErrorResponse('Internal server error', 500);
  }
}
