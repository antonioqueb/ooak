// Crea la venta en Odoo a partir de una orden de PayPal capturada.
// El payload replica el de Stripe (create_from_stripe) cambiando el
// identificador: `paypal_order_id` en lugar de `stripe_session_id`.
// Odoo debe deduplicar por `paypal_order_id`, ya que puede llegar tanto desde
// /api/paypal/orders/[id]/capture como desde el webhook.
import type { PayPalOrder } from '@/lib/paypal';

const ODOO_PAYPAL_URL = process.env.ODOO_PAYPAL_SALES_URL
    || 'https://erp.oneofakind.com.mx/api/sales/create_from_paypal';
const ODOO_TOKEN = process.env.ODOO_API_TOKEN;

const toNumber = (v: string | undefined) => (v ? parseFloat(v) : 0);

export async function syncPayPalOrderWithOdoo(order: PayPalOrder) {
    const pu = order.purchase_units[0];
    const payer = order.payer || {};
    const addr = pu?.shipping?.address || {};
    const breakdown = pu?.amount?.breakdown || {};

    const customerName = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ')
        || pu?.shipping?.name?.full_name
        || 'Unknown';
    const customPhone = pu?.custom_id?.startsWith('phone:') ? pu.custom_id.slice(6) : '';
    const phone = customPhone || payer.phone?.phone_number?.national_number || null;

    const address = {
        line1: addr.address_line_1 || null,
        line2: addr.address_line_2 || null,
        city: addr.admin_area_2 || null,
        state: addr.admin_area_1 || null,
        country: addr.country_code || null,
        postal_code: addr.postal_code || null,
    };

    // Misma forma que las líneas de Stripe: los productos, más una línea de
    // IVA y otra de envío. `price_unit` es el total de la línea (paridad con
    // `amount_total` de Stripe).
    const items = (pu?.items || []).map((item) => ({
        product_name: item.name,
        quantity: Number(item.quantity),
        price_unit: toNumber(item.unit_amount.value) * Number(item.quantity),
        sku: item.sku || null,
    }));
    const tax = toNumber(breakdown.tax_total?.value);
    if (tax > 0) items.push({ product_name: 'VAT (IVA 16%)', quantity: 1, price_unit: tax, sku: null });
    const shipping = toNumber(breakdown.shipping?.value);
    if (shipping > 0) items.push({ product_name: 'Shipping', quantity: 1, price_unit: shipping, sku: null });

    const captureId = pu?.payments?.captures?.find((c) => c.status === 'COMPLETED')?.id || null;

    const payload = {
        payment_provider: 'paypal',
        paypal_order_id: order.id,
        paypal_capture_id: captureId,
        customer: {
            name: customerName,
            email: payer.email_address || '',
            phone,
            address,
        },
        shipping: {
            name: pu?.shipping?.name?.full_name || customerName,
            address,
        },
        items,
    };

    // No registrar el payload: contiene PII del cliente.
    const response = await fetch(ODOO_PAYPAL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ODOO_TOKEN}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Odoo Sync Error (PayPal):', errorText);
        throw new Error(`Odoo responded with ${response.status}`);
    }

    const json = await response.json();
    console.log('✅ Orden creada en Odoo (PayPal):', json.data?.order_name);
    return json;
}
