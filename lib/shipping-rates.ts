import { ShippingRate, DEFAULT_SHIPPING_RATES } from "./shipping";

// Endpoint público del módulo Odoo ooak_shipping_rates.
const ODOO_RATES_URL = "https://erp.oneofakind.com.mx/api/shipping/rates";

type OdooRatesResponse = {
    currency: string;
    rates: Array<{ max_kg: number | null; price: number }>;
};

/**
 * Obtiene la tabla de tarifas de envío desde Odoo (solo servidor).
 * Cachea 5 minutos. Si Odoo no responde o devuelve una tabla vacía,
 * usa DEFAULT_SHIPPING_RATES como respaldo.
 */
export async function fetchShippingRates(): Promise<ShippingRate[]> {
    try {
        const response = await fetch(ODOO_RATES_URL, { next: { revalidate: 300 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch shipping rates (${response.status})`);
        }

        const data: OdooRatesResponse = await response.json();

        const rates: ShippingRate[] = (data.rates || [])
            .filter((r) => typeof r.price === "number" && r.price >= 0)
            .map((r) => ({
                maxKg: r.max_kg === null || r.max_kg === undefined ? null : Number(r.max_kg),
                price: Number(r.price),
            }));

        if (rates.length === 0) {
            console.warn("Shipping rates: Odoo returned empty table, using defaults");
            return DEFAULT_SHIPPING_RATES;
        }

        return rates;
    } catch (error) {
        console.error("Error fetching shipping rates from Odoo:", error);
        return DEFAULT_SHIPPING_RATES;
    }
}
