import React from 'react';

interface Collection {
    _id: string;
    title: string;
    tag: string;
    img: string;
    stock: number;
    price: number;
    category: string;
    description?: string;
}

interface InventoryProps {
    collections: Collection[];
}

export const Inventory: React.FC<InventoryProps> = ({ collections }) => (
    <div className="text-neutral-400">Inventory management view coming soon...</div>
);
