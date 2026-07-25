type ShippableItem = {
    quantity: number;
    dimensions?: { weight: string };
};

// Un rango de la tabla de envíos. maxKg = null significa "sin límite superior"
// (cubre cualquier peso mayor al último rango).
export type ShippingRate = {
    maxKg: number | null;
    price: number;
};

// Tabla de respaldo: se usa solo si Odoo no responde.
// La tabla real se administra en Odoo (módulo ooak_shipping_rates).
export const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
    { maxKg: 1, price: 500 },
    { maxKg: 5, price: 750 },
    { maxKg: 15, price: 1000 },
    { maxKg: null, price: 1500 },
];

export function parseWeightKg(weight: string | undefined): number {
    if (!weight) return 0;
    const match = weight.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

// Ordena los rangos por límite ascendente, con el "sin límite" al final.
function sortRates(rates: ShippingRate[]): ShippingRate[] {
    return [...rates].sort((a, b) => {
        if (a.maxKg === null) return 1;
        if (b.maxKg === null) return -1;
        return a.maxKg - b.maxKg;
    });
}

export function getShippingCostForWeight(
    weightKg: number,
    rates: ShippingRate[] = DEFAULT_SHIPPING_RATES
): number {
    if (weightKg <= 0) return 0;
    for (const rate of sortRates(rates)) {
        if (rate.maxKg === null || weightKg <= rate.maxKg) {
            return rate.price;
        }
    }
    return 0;
}

export function getItemUnitShipping(
    item: ShippableItem,
    rates: ShippingRate[] = DEFAULT_SHIPPING_RATES
): number {
    return getShippingCostForWeight(parseWeightKg(item.dimensions?.weight), rates);
}

export function getItemShipping(
    item: ShippableItem,
    rates: ShippingRate[] = DEFAULT_SHIPPING_RATES
): number {
    return getItemUnitShipping(item, rates) * item.quantity;
}

export function getCartShipping(
    items: ShippableItem[],
    rates: ShippingRate[] = DEFAULT_SHIPPING_RATES
): number {
    return items.reduce((sum, item) => sum + getItemShipping(item, rates), 0);
}
