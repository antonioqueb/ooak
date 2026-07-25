import { NextResponse } from "next/server";
import { fetchShippingRates } from "@/lib/shipping-rates";

// Proxy para el cliente: evita CORS/fallbacks en el navegador y
// reutiliza el caché del servidor (5 min).
export async function GET() {
    const rates = await fetchShippingRates();
    return NextResponse.json({ rates });
}
