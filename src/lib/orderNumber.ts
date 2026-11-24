import { Counter } from '@/models/Counter';
import { Order } from '@/models/Order';
import { ClientSession } from 'mongoose';

const ORDER_NUMBER_COUNTER_ID = 'orderNumber';

export async function initializeOrderNumberCounter() {
  const latestOrder = await Order.findOne({ orderNumber: { $type: 'number' } })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();
  const sequence = latestOrder?.orderNumber ?? 0;

  try {
    await Counter.updateOne(
      { _id: ORDER_NUMBER_COUNTER_ID },
      { $max: { sequence } },
      { upsert: true }
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;

    await Counter.updateOne(
      { _id: ORDER_NUMBER_COUNTER_ID },
      { $max: { sequence } }
    );
  }
}

export async function incrementOrderNumberCounter(session?: ClientSession): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { _id: ORDER_NUMBER_COUNTER_ID },
    { $inc: { sequence: 1 } },
    { new: true, ...(session ? { session } : {}) }
  );

  if (!counter) {
    throw new Error('Order number counter is not initialized');
  }

  return counter.sequence;
}

export async function getNextOrderNumber(): Promise<number> {
  await initializeOrderNumberCounter();
  return incrementOrderNumberCounter();
}
