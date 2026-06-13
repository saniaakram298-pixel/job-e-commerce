import React from 'react';

interface Order {
    _id: string;
    status: string;
    totalAmount: number;
}

interface OrdersProps {
    orders: Order[];
}

export const Orders: React.FC<OrdersProps> = ({ orders }) => (
    <div className="text-neutral-400">Orders view coming soon...</div>
);
