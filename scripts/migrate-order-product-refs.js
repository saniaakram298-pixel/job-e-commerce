const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const Order = require('./../src/models/Order').Order;
const Product = require('./../src/models/Product').Product;

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri, { autoIndex: true });
  console.log('Connected to MongoDB');

  const orders = await Order.find({}).lean();
  let updated = 0;

  for (const order of orders) {
    let changed = false;

    for (const item of order.items || []) {
      const rawId = item?.productId;
      if (!rawId) continue;

      if (typeof rawId === 'string' && /^[a-fA-F0-9]{24}$/.test(rawId)) {
        const product = await Product.findById(rawId).select('_id').lean();
        if (product) {
          item.productId = product._id;
          changed = true;
        }
      }
    }

    if (changed) {
      await Order.updateOne({ _id: order._id }, { $set: { items: order.items } });
      updated += 1;
    }
  }

  console.log(`Migration complete. Updated ${updated} orders.` );
  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
