type ShippableItem = {
    quantity: number;
    dimensions?: { weight: string };
};

export function parseWeightKg(weight: string | undefined): number {
    if (!weight) return 0;
    const match = weight.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

export function getShippingCostForWeight(weightKg: number): number {
    if (weightKg <= 0) return 0;
    if (weightKg <= 1) return 500;
    if (weightKg <= 5) return 750;
    if (weightKg <= 15) return 1000;
    return 1500;
}

export function getItemUnitShipping(item: ShippableItem): number {
    return getShippingCostForWeight(parseWeightKg(item.dimensions?.weight));
}

export function getItemShipping(item: ShippableItem): number {
    return getItemUnitShipping(item) * item.quantity;
}

export function getCartShipping(items: ShippableItem[]): number {
    return items.reduce((sum, item) => sum + getItemShipping(item), 0);
}
