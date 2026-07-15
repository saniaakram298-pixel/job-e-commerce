import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { Category } from '@/models/Category';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import { uploadToCloudinary } from '@/lib/cloudinary';
import mongoose from 'mongoose';
import { getTotalStock, normalizeProductVariants } from '@/lib/productStock';
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

const buildStrictCategoryProductQuery = (categoryValue: string) => {
  const normalizedValue = String(categoryValue || '').trim().toLowerCase();

  // Build a flexible regex from the slug so it matches stored category names
  // regardless of separators (spaces, hyphens, underscores).
  const words = normalizedValue.split(/[^a-z0-9]+/).filter(Boolean);
  const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = `^${escapedWords.join('[\\s\\-_]*')}$`;
  const flexibleRegex = new RegExp(pattern, 'i');

  return {
    active: true,
    $or: [
      { category: { $regex: flexibleRegex } },
      { subcategory: { $regex: flexibleRegex } },
    ],
  };
};

const getProductStock = (product: any) => getTotalStock(product);

export async function GET(request: NextRequest) {
  try {
    const connection = await connectDB();
    if (!connection) {
      return createSuccessResponse(
        {
          products: [],
          pagination: { page: 1, limit: 12, total: 0, pages: 0 },
        },
        'Products fetched successfully'
      );
    }

    const { searchParams } = new URL(request.url);
    const offsetParam = searchParams.get('offset');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = offsetParam !== null && !Number.isNaN(Number(offsetParam)) ? Number(offsetParam) : (page - 1) * limit;
    const category = searchParams.get('category') || searchParams.get('categorySlug') || searchParams.get('slug');
    const collection = searchParams.get('collection');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'default';
    const bestSellerParam = searchParams.get('bestSeller') ?? searchParams.get('isBestSeller');
    const trendingParam = searchParams.get('trending') ?? searchParams.get('isTrending');

    const skip = Math.max(0, offset);
    const requestedLimit = Number.isFinite(limit) ? limit : 12;
    const effectiveLimit = Math.min(1000, Math.max(1, requestedLimit));
    let query: any = { active: true };

    if (category) {
      Object.assign(query, buildStrictCategoryProductQuery(category));
    }
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

    let products = await Product.find(query)
      .select('name description price discountPrice images img category subcategory collection stock sizes colors featured isBestSeller isTrending active createdAt updatedAt averageRating totalReviews rating')
      .skip(skip)
      .limit(effectiveLimit)
      .sort(sortObj)
      .lean();
    let total = await Product.countDocuments(query);

    // Fallback: if no products found, try resolving the category via Category
    // documents and attempt alternative matches (name, slug, _id string).
    if (total === 0 && category) {
      try {
        const lookupSlug = String(category || '').trim().toLowerCase();
        const catDoc = await Category.findOne({ slug: lookupSlug }).lean();

        const altQueries: any[] = [];

        // try direct exact match on provided value
        altQueries.push({ category: String(category) });

        if (catDoc) {
          if (typeof catDoc.name === 'string' && catDoc.name.trim()) {
            altQueries.push({ category: catDoc.name });
            altQueries.push({ subcategory: catDoc.name });
          }
          if (catDoc.slug) {
            altQueries.push({ category: catDoc.slug });
            altQueries.push({ subcategory: catDoc.slug });
          }
          // also try matching by _id stored as string
          if (catDoc._id) {
            altQueries.push({ category: String(catDoc._id) });
            altQueries.push({ subcategory: String(catDoc._id) });
          }
        }

        // build a union query using $or for the alternative matchers
        const fallbackQuery = { active: true, $or: altQueries };

        const fbResults = await Product.find(fallbackQuery)
          .select('name description price discountPrice images img category subcategory collection stock sizes colors featured isBestSeller isTrending active createdAt updatedAt averageRating totalReviews rating')
          .skip(skip)
          .limit(effectiveLimit)
          .sort(sortObj)
          .lean();

        const fbTotal = await Product.countDocuments(fallbackQuery);

        if ((fbResults || []).length > 0 || fbTotal > 0) {
          products = fbResults;
          total = fbTotal;
        }
      } catch (fallbackError) {
        console.error('Fallback category lookup error:', fallbackError);
      }
    }

    const serializedProducts = (products || []).map((product: any) => ({
      _id: product._id?.toString?.() ?? String(product._id),
      title: product.name || product.title || 'Untitled product',
      name: product.name || product.title || 'Untitled product',
      price: Number(product.price || 0),
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : undefined,
      img: product.mainImage || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : product.img || ''),
      mainImage: product.mainImage || product.img || '',
      thumbnails: Array.isArray(product.thumbnails) ? product.thumbnails : [],
      video: product.video || '',
      images: Array.isArray(product.images) ? product.images : [],
      category: product.category || '',
      subcategory: product.subcategory || '',
      collection: product.collection || '',
      stock: getProductStock(product),
      averageRating: Number(product.averageRating ?? product.rating ?? 0),
      totalReviews: Number(product.totalReviews ?? 0),
      rating: Number(product.averageRating ?? product.rating ?? 0),
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
          limit: effectiveLimit,
          total,
          pages: Math.ceil(total / effectiveLimit),
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
    const connection = await connectDB();
    if (!connection) {
      return createErrorResponse('Database unavailable', 503);
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      body = {
        name: formData.get('name')?.toString() || '',
        description: formData.get('description')?.toString() || '',
        price: formData.get('price')?.toString() || '',
        discountPrice: formData.get('discountPrice')?.toString() || '',
        category: formData.get('category')?.toString() || '',
        collection: formData.get('collection')?.toString() || '',
        careInstructions: formData.get('careInstructions')?.toString() || '',
        fit: formData.get('fit')?.toString() || '',
        featured: parseBoolean(formData.get('featured')),
        isBestSeller: parseBoolean(formData.get('isBestSeller')),
        isTrending: parseBoolean(formData.get('isTrending')),
        active: formData.get('active') === null ? true : parseBoolean(formData.get('active')),
        subcategory: formData.get('subcategory')?.toString() || '',
      };

      try {
        body.materials = JSON.parse((formData.get('materials')?.toString() || '[]'));
        body.sizes = JSON.parse((formData.get('sizes')?.toString() || '[]'));
        body.colors = JSON.parse((formData.get('colors')?.toString() || '[]'));
        body.tags = JSON.parse((formData.get('tags')?.toString() || '[]'));
      } catch (e) {
        console.error('Error parsing form arrays:', e);
        body.materials = [];
        body.sizes = [];
        body.colors = [];
        body.tags = [];
      }

      const mainImageFile = formData.get('mainImage');
      const thumbnailFiles = formData.getAll('thumbnails');
      const videoFile = formData.get('video');

      const uploadedThumbnails: string[] = [];
      let mainImageUrl = '';
      let videoUrl = '';

      if (mainImageFile instanceof File && mainImageFile.size > 0) {
        const uploaded = await uploadToCloudinary(mainImageFile, { folder: 'products/main' });
        mainImageUrl = uploaded.secureUrl;
      }

      for (const file of thumbnailFiles) {
        if (file instanceof File && file.size > 0) {
          const uploaded = await uploadToCloudinary(file, { folder: 'products/thumbnails' });
          uploadedThumbnails.push(uploaded.secureUrl);
        }
      }

      if (videoFile instanceof File && videoFile.size > 0) {
        const uploaded = await uploadToCloudinary(videoFile, { folder: 'products/videos', resourceType: 'video' });
        videoUrl = uploaded.secureUrl;
      }

      body.mainImage = mainImageUrl;
      body.thumbnails = uploadedThumbnails;
      body.video = videoUrl;
      body.images = [mainImageUrl, ...uploadedThumbnails].filter(Boolean);
      body.img = mainImageUrl;
    } else {
      body = await request.json();
      body.isBestSeller = body.isBestSeller === undefined ? false : parseBoolean(body.isBestSeller);
      body.isTrending = body.isTrending === undefined ? (body.trending === undefined ? false : parseBoolean(body.trending)) : parseBoolean(body.isTrending);
      body.featured = body.featured === undefined ? false : parseBoolean(body.featured);
      body.active = body.active === undefined ? true : parseBoolean(body.active);
    }

    const requiredFields = ['name', 'price', 'category'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createErrorResponse(`Missing required field: ${field}`, 400);
      }
    }

    const category = String(body.category || '').trim();
    if (!category) {
      return createErrorResponse('Invalid category. Category must be a non-empty string.', 400);
    }

    const description = typeof body.description === 'string' ? body.description : '';
    const collection = typeof body.collection === 'string' && body.collection.trim()
      ? body.collection.trim()
      : 'general';

    const normalizedImages = Array.isArray(body.images)
      ? body.images.filter((image: unknown) => typeof image === 'string' && image.trim())
      : [];
    const normalizedImg = typeof body.img === 'string' && body.img.trim()
      ? body.img
      : normalizedImages[0] || '';

    const { sizes, colors } = normalizeProductVariants(body.sizes, body.colors);

    if (sizes.length === 0) {
      return createErrorResponse('At least one size is required', 400);
    }

    const newProduct = new Product({
      name: String(body.name || '').trim(),
      description,
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      collection,
      category,
      subcategory: body.subcategory || '',
      images: normalizedImages,
      img: normalizedImg,
      mainImage: body.mainImage || normalizedImg,
      thumbnails: Array.isArray(body.thumbnails) ? body.thumbnails.filter((item: unknown) => typeof item === 'string' && item.trim()) : [],
      video: body.video || '',
      materials: Array.isArray(body.materials) ? body.materials : [],
      sizes,
      colors,
      tags: Array.isArray(body.tags) ? body.tags : [],
      careInstructions: body.careInstructions || '',
      fit: body.fit || '',
      featured: parseBoolean(body.featured),
      isBestSeller: parseBoolean(body.isBestSeller),
      isTrending: parseBoolean(body.isTrending),
      active: body.active === undefined ? true : parseBoolean(body.active),
    });

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
      'subcategory',
      'collection',
      'img',
      'mainImage',
      'thumbnails',
      'video',
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

    if (body.stock !== undefined) {
      return createErrorResponse('The stock field is no longer supported. Use sizes[].stock and colors[].stock instead.', 400);
    }

    const { sizes, colors } = normalizeProductVariants(updatePayload.sizes, updatePayload.colors);

    if (Array.isArray(updatePayload.sizes)) {
      if (sizes.length === 0) {
        return createErrorResponse('At least one size is required', 400);
      }
      updatePayload.sizes = sizes;
    }

    if (Array.isArray(updatePayload.colors)) {
      updatePayload.colors = colors;
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
