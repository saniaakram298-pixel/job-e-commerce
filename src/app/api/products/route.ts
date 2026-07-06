import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { saveUploadedFile } from '@/lib/uploadHandler';
import mongoose from 'mongoose';
export const dynamic = 'force-dynamic';

const parseBoolean = (value: unknown, fallback = false) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const offsetParam = searchParams.get('offset');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = offsetParam !== null && !Number.isNaN(Number(offsetParam)) ? Number(offsetParam) : (page - 1) * limit;
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'default';
    const bestSellerParam = searchParams.get('bestSeller') ?? searchParams.get('isBestSeller');
    const trendingParam = searchParams.get('trending') ?? searchParams.get('isTrending');

    const skip = Math.max(0, offset);
    let query: any = { active: true };

    if (category) query.category = category;
    if (collection) query.collection = collection;
    if (featured === 'true') query.featured = true;
    if (bestSellerParam !== null) query.isBestSeller = parseBoolean(bestSellerParam);
    if (trendingParam !== null) {
      const trendingFlag = parseBoolean(trendingParam);
      query.isTrending = trendingFlag;
      if (!trendingFlag) {
        query.$or = [{ isTrending: false }, { trending: false }];
      }
    }
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

    const products = await Product.find(query)
      .select('name description price discountPrice images img category collection stock sizes colors featured isBestSeller isTrending active createdAt updatedAt')
      .skip(skip)
      .limit(limit)
      .sort(sortObj)
      .lean();
    const total = await Product.countDocuments(query);

    const serializedProducts = (products || []).map((product: any) => ({
      _id: product._id?.toString?.() ?? String(product._id),
      title: product.name || product.title || 'Untitled product',
      name: product.name || product.title || 'Untitled product',
      price: Number(product.price || 0),
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
      img: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.img || '',
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      collection: product.collection || '',
      stock: Number(product.stock ?? 0),
      sizes: Array.isArray(product.sizes)
        ? product.sizes.map((size: any) => ({ size: size.size, stock: size.stock }))
        : [],
      colors: Array.isArray(product.colors)
        ? product.colors.map((color: any) => ({ color: color.color, stock: color.stock }))
        : [],
      description: product.description || '',
      featured: Boolean(product.featured),
      isBestSeller: Boolean(product.isBestSeller),
      isTrending: Boolean(product.isTrending),
      trending: Boolean(product.isTrending),
      active: product.active !== false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return createSuccessResponse(
      {
        products: serializedProducts,
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
        featured: parseBoolean(formData.get('featured')),
        isBestSeller: parseBoolean(formData.get('isBestSeller')),
        isTrending: parseBoolean(formData.get('isTrending')),
        active: formData.get('active') === null ? true : parseBoolean(formData.get('active')),
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
      body.isBestSeller = body.isBestSeller === undefined ? false : parseBoolean(body.isBestSeller);
      body.isTrending = body.isTrending === undefined ? (body.trending === undefined ? false : parseBoolean(body.trending)) : parseBoolean(body.isTrending);
      body.featured = body.featured === undefined ? false : parseBoolean(body.featured);
      body.active = body.active === undefined ? true : parseBoolean(body.active);
    }

    // Validate required fields
    const requiredFields = ['name', 'price', 'category', 'description', 'collection'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`Missing required field: ${field}`, 400);
      }
    }

    const category = String(body.category || '').trim();
    if (!category) {
      return createErrorResponse('Invalid category. Category must be a non-empty string.', 400);
    }

    const normalizedImages = Array.isArray(body.images)
      ? body.images.filter((image: unknown) => typeof image === 'string' && image.trim())
      : [];
    const normalizedImg = typeof body.img === 'string' && body.img.trim()
      ? body.img
      : normalizedImages[0] || '';

    // Create new product
    const newProduct = new Product({
      name: body.name,
      description: body.description,
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      collection: body.collection,
      category: body.category,
      images: normalizedImages,
      img: normalizedImg,
      materials: Array.isArray(body.materials) ? body.materials : [],
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      careInstructions: body.careInstructions || '',
      fit: body.fit || '',
      featured: parseBoolean(body.featured),
      isBestSeller: parseBoolean(body.isBestSeller),
      isTrending: parseBoolean(body.isTrending),
      active: body.active === undefined ? true : parseBoolean(body.active),
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return createErrorResponse('Invalid product ID', 400);
    }

    const body = await request.json();
    const updatePayload: any = {};

    const allowedFields = [
      'name',
      'description',
      'price',
      'discountPrice',
      'category',
      'collection',
      'img',
      'images',
      'materials',
      'sizes',
      'colors',
      'tags',
      'careInstructions',
      'fit',
      'featured',
      'isBestSeller',
      'isTrending',
      'active',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field];
      }
    }

    if (updatePayload.price !== undefined) {
      updatePayload.price = Number(updatePayload.price);
    }

    if (body.isBestSeller !== undefined) {
      updatePayload.isBestSeller = parseBoolean(body.isBestSeller);
    }

    if (body.isTrending !== undefined) {
      updatePayload.isTrending = parseBoolean(body.isTrending);
    }

    if (body.featured !== undefined) {
      updatePayload.featured = parseBoolean(body.featured);
    }

    if (body.active !== undefined) {
      updatePayload.active = parseBoolean(body.active);
    }

    if (updatePayload.discountPrice !== undefined) {
      updatePayload.discountPrice = updatePayload.discountPrice !== null
        ? Number(updatePayload.discountPrice)
        : undefined;
    }

    if (Array.isArray(updatePayload.sizes)) {
      updatePayload.sizes = updatePayload.sizes
        .map((item: any) => ({
          size: String(item?.size || '').trim(),
          stock: Number(item?.stock || 0),
        }))
        .filter((item: any) => item.size);
    }

    if (Array.isArray(updatePayload.colors)) {
      updatePayload.colors = updatePayload.colors
        .map((item: any) => ({
          color: String(item?.color || '').trim(),
          stock: Number(item?.stock || 0),
        }))
        .filter((item: any) => item.color);
    }

    if (Array.isArray(updatePayload.images)) {
      updatePayload.images = updatePayload.images.filter(
        (image: unknown) => typeof image === 'string' && image.trim()
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return createErrorResponse('Product not found', 404);
    }

    return createSuccessResponse(
      { product: updatedProduct },
      'Product updated successfully'
    );
  } catch (error) {
    console.error('Update product error:', error);
    return createErrorResponse('Failed to update product', 500);
  }
}
