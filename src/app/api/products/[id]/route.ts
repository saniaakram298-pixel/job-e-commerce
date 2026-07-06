import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/response';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';

// Next.js latest versions mein params ek Promise hota hai
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        // Pehle params ko await karein
        const { id } = await params;

        const product = await Product.findById(id);

        if (!product) {
            return createErrorResponse('Product not found', 404);
        }

        return createSuccessResponse(product, 'Product fetched successfully');
    } catch (error) {
        console.error('Get product error:', error);
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
        const body = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return createErrorResponse('Invalid product ID', 400);
        }

        // Product update karein
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: body }, // Sirf wahi fields update hongi jo body mein aayengi
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return createErrorResponse('Product not found', 404);
        }

        // Revalidate cache agar zaroori ho
        try {
            revalidatePath('/');
            revalidatePath('/products');
        } catch (e) {
            // non-fatal
        }

        return createSuccessResponse(updatedProduct, 'Product updated successfully');
    } catch (error) {
        console.error('Update product error:', error);
        return createErrorResponse('Failed to update product', 500);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return createErrorResponse('Invalid product ID', 400);
        }

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return createErrorResponse('Product not found', 404);
        }

        try {
            revalidatePath('/');
            revalidatePath('/products');
        } catch (e) {
            // non-fatal
        }

        return createSuccessResponse({ id }, 'Product deleted successfully');
    } catch (error) {
        console.error('Delete product error:', error);
        return createErrorResponse('Failed to delete product', 500);
    }
}
