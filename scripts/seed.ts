/**
 * Seed Script - Run once to populate initial data
 * Usage: npx tsx scripts/seed.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Product } from '@/models/Product';
import { hashPassword } from '@/lib/auth';
import { User } from '@/models/User';

const sampleProducts = [
  {
    name: 'Silk Slip Dress',
    description: 'Our signature bias-cut slip dress, meticulously crafted from 30 momme mulberry silk for an unparalleled drape and liquid-like luster.',
    price: 380,
    collection: 'The Core Collection',
    category: 'women',
    images: [
      'https://images.unsplash.com/photo-1595777707802-221b8fbe3c5f?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1568101190563-137573c3e808?w=600&h=800&fit=crop',
    ],
    materials: ['100% Mulberry Silk (30 momme)'],
    sizes: [
      { size: 'XS', stock: 5 },
      { size: 'S', stock: 8 },
      { size: 'M', stock: 12 },
      { size: 'L', stock: 10 },
      { size: 'XL', stock: 6 },
    ],
    colors: [
      { color: 'Champagne', stock: 24 },
      { color: 'Black', stock: 20 },
      { color: 'White', stock: 18 },
    ],
    tags: ['new-arrival', 'best-seller'],
    rating: 4.5,
    featured: true,
    active: true,
  },
  {
    name: 'Premium Wool Blazer',
    description: 'Tailored excellence in a timeless blazer crafted from Italian wool with peak lapels and internal silk lining.',
    price: 520,
    collection: 'Structured Excellence',
    category: 'women',
    images: [
      'https://images.unsplash.com/photo-1539533057440-7bf458871b78?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop',
    ],
    materials: ['100% Italian Virgin Wool', 'Silk Lining'],
    sizes: [
      { size: 'XS', stock: 4 },
      { size: 'S', stock: 7 },
      { size: 'M', stock: 10 },
      { size: 'L', stock: 8 },
      { size: 'XL', stock: 5 },
    ],
    colors: [
      { color: 'Black', stock: 18 },
      { color: 'Navy', stock: 16 },
      { color: 'Charcoal', stock: 14 },
    ],
    tags: ['best-seller', 'trending'],
    rating: 4.8,
    featured: true,
    active: true,
  },
  {
    name: 'Classic White Shirt',
    description: 'The foundation of every wardrobe. Premium cotton oxford cloth with mother-of-pearl buttons.',
    price: 245,
    collection: 'Essentials',
    category: 'men',
    images: [
      'https://images.unsplash.com/photo-1598033129519-f96dcd007ca1?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1612946141387-b464b471b798?w=600&h=800&fit=crop',
    ],
    materials: ['100% Cotton Oxford'],
    sizes: [
      { size: 'S', stock: 15 },
      { size: 'M', stock: 20 },
      { size: 'L', stock: 18 },
      { size: 'XL', stock: 12 },
    ],
    colors: [
      { color: 'White', stock: 35 },
      { color: 'Light Blue', stock: 32 },
    ],
    tags: ['essential'],
    rating: 4.7,
    featured: false,
    active: true,
  },
  {
    name: 'Leather Crossbody Bag',
    description: 'Italian leather crossbody with adjustable strap and internal organization. Timeless design for everyday elegance.',
    price: 650,
    collection: 'best-sellers',
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1546996121-7bcc792b5efd?w=600&h=800&fit=crop',
    ],
    materials: ['Genuine Italian Leather'],
    sizes: [
      { size: 'One Size', stock: 12 },
    ],
    colors: [
      { color: 'Black', stock: 8 },
      { color: 'Caramel', stock: 7 },
      { color: 'Burgundy', stock: 5 },
    ],
    tags: ['best-seller', 'trending'],
    rating: 4.9,
    featured: true,
    active: true,
  },
  {
    name: 'Formal Evening Gown',
    description: 'Elegant black tie gown crafted from luxurious fabric with intricate beading and a flowing silhouette.',
    price: 890,
    collection: 'best-sellers',
    category: 'bridal',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&h=800&fit=crop',
    ],
    materials: ['Silk Charmeuse', 'Hand-sewn Details'],
    sizes: [
      { size: 'XS', stock: 3 },
      { size: 'S', stock: 5 },
      { size: 'M', stock: 8 },
      { size: 'L', stock: 4 },
    ],
    colors: [
      { color: 'Black', stock: 12 },
      { color: 'Navy', stock: 10 },
    ],
    tags: ['best-seller', 'bridal'],
    rating: 4.9,
    featured: true,
    active: true,
  },
  {
    name: 'Kids Dress',
    description: 'Charming and comfortable children\'s dress perfect for special occasions with easy care fabrics.',
    price: 120,
    collection: 'Kids Collection',
    category: 'children',
    images: [
      'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1595342342585-bc7173509b91?w=600&h=800&fit=crop',
    ],
    materials: ['100% Cotton'],
    sizes: [
      { size: '2Y', stock: 8 },
      { size: '4Y', stock: 10 },
      { size: '6Y', stock: 12 },
      { size: '8Y', stock: 10 },
    ],
    colors: [
      { color: 'Pink', stock: 20 },
      { color: 'Blue', stock: 18 },
    ],
    tags: ['kids', 'new-arrival'],
    rating: 4.6,
    featured: false,
    active: true,
  },
  {
    name: 'Groom Suit',
    description: 'Impeccably tailored suit designed for the groom featuring classic cuts and premium fabrics.',
    price: 1200,
    collection: 'Groom Collection',
    category: 'groom',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=800&fit=crop',
    ],
    materials: ['Wool Blend', 'Silk Lining'],
    sizes: [
      { size: 'S', stock: 4 },
      { size: 'M', stock: 6 },
      { size: 'L', stock: 5 },
      { size: 'XL', stock: 3 },
    ],
    colors: [
      { color: 'Black', stock: 12 },
      { color: 'Navy', stock: 10 },
    ],
    tags: ['groom', 'formal'],
    rating: 4.8,
    featured: true,
    active: true,
  },
  {
    name: 'Designer Shoes',
    description: 'Handcrafted shoes combining comfort with elegance for all occasions.',
    price: 380,
    collection: 'Footwear',
    category: 'accessories',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=800&fit=crop',
    ],
    materials: ['Genuine Leather'],
    sizes: [
      { size: '36', stock: 6 },
      { size: '37', stock: 8 },
      { size: '38', stock: 10 },
      { size: '39', stock: 8 },
      { size: '40', stock: 6 },
    ],
    colors: [
      { color: 'Black', stock: 20 },
      { color: 'Brown', stock: 18 },
    ],
    tags: ['new-arrival'],
    rating: 4.7,
    featured: false,
    active: true,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} products`);

    // Create admin user (optional)
    const adminExists = await User.findOne({ email: 'admin@theatelier.com' });
    if (!adminExists) {
      const hashedPassword = await hashPassword('admin123456');
      const admin = new User({
        email: 'admin@theatelier.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      });
      await admin.save();
      console.log('✅ Created admin user (email: admin@theatelier.com, password: admin123456)');
    }

    // Create test customer user
    const userExists = await User.findOne({ email: 'customer@test.com' });
    if (!userExists) {
      const hashedPassword = await hashPassword('customer123456');
      const user = new User({
        email: 'customer@test.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
      });
      await user.save();
      console.log('✅ Created test user (email: customer@test.com, password: customer123456)');
    }

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
