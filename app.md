
## ./app/api/brand-content/route.ts
```ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // El servidor de Next.js hace la petición a Odoo (esto evita el CORS del navegador)
        const res = await fetch('https://erp.oneofakind.com.mx/api/the-brand/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Para evitar caché y siempre traer datos frescos
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching from Odoo' }, { status: res.status });
        }

        const data = await res.json();

        // Convertir todas las URLs http a https para evitar contenido mixto
        const jsonString = JSON.stringify(data).replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://erp.oneofakind.com.mx');
        const secureData = JSON.parse(jsonString);

        // Devolvemos los datos al frontend
        return NextResponse.json(secureData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

```

## ./app/api/checkout/confirm/route.ts
```ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

const ODOO_URL = 'https://erp.oneofakind.com.mx/api/sales/create_from_stripe';
const ODOO_TOKEN = process.env.ODOO_API_TOKEN;

async function syncWithOdoo(session: Stripe.Checkout.Session, lineItems: Stripe.ApiList<Stripe.LineItem>) {
    // Prepare Payload
    const payload = {
        stripe_session_id: session.id,
        customer: {
            name: session.customer_details?.name,
            email: session.customer_details?.email,
            address: {
                line1: session.shipping_details?.address?.line1,
                line2: session.shipping_details?.address?.line2,
                city: session.shipping_details?.address?.city,
                state: session.shipping_details?.address?.state,
                country: session.shipping_details?.address?.country,
                postal_code: session.shipping_details?.address?.postal_code,
            }
        },
        items: lineItems.data.map((item: any) => ({
            product_name: item.description,
            quantity: item.quantity,
            price_unit: item.amount_total / 100, // Stripe uses cents
            // Try to get SKU from product metadata if available
            sku: item.price?.product?.metadata?.sku || null
        }))
    };

    console.log('📦 Sending payload to Odoo (Success Page):', JSON.stringify(payload, null, 2));

    // Send to Odoo
    const response = await fetch(ODOO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ODOO_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    console.log('📡 Odoo Response Status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Odoo Sync Error:', errorText);
        throw new Error(`Odoo responded with ${response.status}`);
    }

    const json = await response.json();
    console.log('✅ Orden creada en Odoo:', json.data?.order_name);
    return json;
}

export async function POST(req: Request) {
    console.log('🔵 /api/checkout/confirm called');

    if (!process.env.STRIPE_SECRET_KEY) console.error('🔴 Missing STRIPE_SECRET_KEY');
    if (!process.env.ODOO_API_TOKEN) console.error('🔴 Missing ODOO_API_TOKEN');

    try {
        const body = await req.json();
        console.log('🔵 Request body:', body);
        const { session_id } = body;

        if (!session_id) {
            console.error('🔴 Missing session_id in body');
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        console.log(`🔵 Retrieving session: ${session_id}`);
        // 1. Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log(`🔵 Session status: ${session.payment_status}`);

        // 2. Verify payment status
        if (session.payment_status !== 'paid') {
            console.error('🔴 Payment not paid');
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // 3. Fetch line items
        console.log('🔵 Fetching line items...');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });
        console.log(`🔵 Found ${lineItems.data.length} items`);

        // 4. Sync with Odoo
        const result = await syncWithOdoo(session, lineItems);

        return NextResponse.json({ success: true, odoo_order: result.data?.order_name });

    } catch (error: any) {
        console.error('🔴 Error confirming checkout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

```

## ./app/api/checkout_sessions/route.ts
```ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia', // Updated to match the installed library version (v17.3.1)
});

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        // Map cart items to Stripe line items
        const lineItems = items.map((item: any) => {
            return {
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image.startsWith('http') ? item.image : `https://oneofakind.com${item.image}`] : [],
                        description: item.description ? item.description.substring(0, 100) : undefined,
                        metadata: {
                            sku: item.slug // Assuming slug is used as SKU/Internal Reference
                        }
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            // automatic_tax: { enabled: true }, // Disabled to avoid configuration error
            shipping_address_collection: {
                allowed_countries: ['US', 'MX', 'CA'],
            },
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

```

## ./app/api/craft-stories-content/route.ts
```ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://erp.oneofakind.com.mx/api/craft-stories/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching from Odoo' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

```

## ./app/api/footer/content/route.ts
```ts
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://erp.oneofakind.com.mx/api/footer/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching footer content' }, { status: res.status });
        }

        const data = await res.json();

        // Enforce HTTPS
        const jsonString = JSON.stringify(data).replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://erp.oneofakind.com.mx');
        const secureData = JSON.parse(jsonString);

        return NextResponse.json(secureData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

```

## ./app/api/legal/page/[slug]/route.ts
```ts
import { NextResponse } from 'next/server';
import { getLegalPage } from '@/lib/legal';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ data: page });
}

```

## ./app/api/legal/pages/route.ts
```ts
import { NextResponse } from 'next/server';
import { getLegalPages } from '@/lib/legal';

export async function GET() {
    const pages = await getLegalPages();
    return NextResponse.json({ data: pages });
}

```

## ./app/api/news-events/[slug]/route.ts
```ts
import { NextResponse } from 'next/server';

// Fallback event details
const FALLBACK_EVENTS: Record<string, any> = {
    "rare-mineral-exhibition-spring-2024": {
        data: {
            id: 1,
            slug: "rare-mineral-exhibition-spring-2024",
            status: "upcoming",
            date: "Spring 2024",
            title: "Rare Mineral Exhibition",
            location: "Main Gallery, NYC",
            description: "Join us for our annual exhibition featuring the most recent acquisitions from our private collection.",
            long_description: "<p>Join us for our annual exhibition featuring the most recent acquisitions from our private collection.</p><p>This exclusive event showcases rare minerals from around the world, each piece carefully selected for its geological significance and aesthetic beauty. Our expert curators will be on hand to discuss the unique properties and origins of each specimen.</p><p>The exhibition will feature interactive displays, educational workshops, and exclusive viewing sessions for collectors.</p>",
            image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1597523920677-24a9d7743d50?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=800&auto=format&fit=crop"
            ],
            time: "10:00 AM - 6:00 PM",
            organizer: "One of a Kind Gallery",
            contact: "events@oneofakind.com"
        }
    },
    "ocean-collection-launch-oct-2023": {
        data: {
            id: 2,
            slug: "ocean-collection-launch-oct-2023",
            status: "past",
            date: "Oct 2023",
            title: "Ocean Collection Launch",
            location: "Design Week, Mexico City",
            description: "Celebrating the debut of our new collection inspired by ocean depths.",
            long_description: "<p>Celebrating the debut of our new collection inspired by ocean depths.</p><p>This collection features fossilized corals, shells, and marine minerals that tell stories of ancient seas. Each piece has been carefully preserved and prepared to showcase the incredible diversity of marine life from millions of years ago.</p><p>The event included a special presentation by marine paleontologists and a cocktail reception featuring ocean-inspired cuisine.</p>",
            image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1600&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=800&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=800&auto=format&fit=crop"
            ],
            time: "7:00 PM - 10:00 PM",
            organizer: "One of a Kind Gallery",
            contact: "events@oneofakind.com"
        }
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Use the live API endpoint provided by the user
        const res = await fetch(`https://erp.oneofakind.com.mx/api/news-events/${slug}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.log('Odoo API not available for event, using fallback data');
            if (FALLBACK_EVENTS[slug]) {
                return NextResponse.json(FALLBACK_EVENTS[slug]);
            }
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const json = await res.json();
        const eventData = json.data || json;

        // Helper to ensure HTTPS
        const toHttps = (url: string) => url ? url.replace(/^http:\/\//, "https://") : "";

        // Process images to ensure HTTPS
        if (eventData) {
            if (eventData.image) eventData.image = toHttps(eventData.image);
            if (eventData.gallery && Array.isArray(eventData.gallery)) {
                eventData.gallery = eventData.gallery.map(toHttps);
            }
        }

        return NextResponse.json({ data: eventData });
    } catch (error) {
        console.log('Error fetching event from Odoo, using fallback data:', error);
        const { slug } = await params;
        // Return fallback data if available
        if (FALLBACK_EVENTS[slug]) {
            return NextResponse.json(FALLBACK_EVENTS[slug]);
        }
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
}

```

## ./app/api/news-events/route.ts
```ts
import { NextResponse } from 'next/server';

// Fallback data in case Odoo API is not ready
const FALLBACK_EVENTS = {
    data: [
        {
            id: 1,
            slug: "rare-mineral-exhibition-spring-2024",
            status: "upcoming",
            date: "Spring 2024",
            title: "Rare Mineral Exhibition",
            location: "Main Gallery, NYC",
            description: "Join us for our annual exhibition featuring the most recent acquisitions from our private collection. Discover rare minerals from around the world, each piece carefully selected for its geological significance and aesthetic beauty.",
            long_description: "<p>Join us for our annual exhibition featuring the most recent acquisitions from our private collection.</p><p>This exclusive event showcases rare minerals from around the world, each piece carefully selected for its geological significance and aesthetic beauty. Our expert curators will be on hand to discuss the unique properties and origins of each specimen.</p><p>The exhibition will feature interactive displays, educational workshops, and exclusive viewing sessions for collectors.</p>",
            image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop",
            time: "10:00 AM - 6:00 PM",
            organizer: "One of a Kind Gallery",
            contact: "events@oneofakind.com"
        },
        {
            id: 2,
            slug: "ocean-collection-launch-oct-2023",
            status: "past",
            date: "Oct 2023",
            title: "Ocean Collection Launch",
            location: "Design Week, Mexico City",
            description: "Celebrating the debut of our new collection inspired by ocean depths. Featuring fossilized corals and shells that tell stories of ancient seas.",
            long_description: "<p>Celebrating the debut of our new collection inspired by ocean depths.</p><p>This collection features fossilized corals, shells, and marine minerals that tell stories of ancient seas. Each piece has been carefully preserved and prepared to showcase the incredible diversity of marine life from millions of years ago.</p><p>The event included a special presentation by marine paleontologists and a cocktail reception featuring ocean-inspired cuisine.</p>",
            image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=1600&auto=format&fit=crop",
            time: "7:00 PM - 10:00 PM",
            organizer: "One of a Kind Gallery",
            contact: "events@oneofakind.com"
        }
    ]
};

export async function GET() {
    try {
        // Use the live API endpoint provided by the user
        const res = await fetch('https://erp.oneofakind.com.mx/api/news-events', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.log('Odoo API error, using fallback data');
            return NextResponse.json(FALLBACK_EVENTS);
        }

        const json = await res.json();

        // Helper to ensure HTTPS for images
        const toHttps = (url: string) => url ? url.replace(/^http:\/\//, "https://") : "";

        // Process data to ensure HTTPS images
        let events = json.data || json;
        if (Array.isArray(events)) {
            events = events.map((event: any) => ({
                ...event,
                image: toHttps(event.image)
            }));
        }

        return NextResponse.json({ data: events });
    } catch (error) {
        console.log('Error fetching from Odoo, using fallback data:', error);
        return NextResponse.json(FALLBACK_EVENTS);
    }
}

```

## ./app/api/newsletter/subscribe/route.ts
```ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const res = await fetch('https://erp.oneofakind.com.mx/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        // Pass through the status code from the backend
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

```

## ./app/api/projects/[slug]/route.ts
```ts
import { NextResponse } from 'next/server';

// Fallback project details
const FALLBACK_PROJECTS: Record<string, any> = {
    "casa-lomas-mexico-city": {
        data: {
            id: 1,
            slug: "casa-lomas-mexico-city",
            title: "Casa Lomas",
            location: "Mexico City",
            category: "Residential",
            year: "2024",
            description: "A dialogue between raw volcanic stone and modern minimalism.",
            long_description: "<p>A dialogue between raw volcanic stone and modern minimalism.</p><p>This residential project in the exclusive Lomas de Chapultepec neighborhood explores the relationship between heavy, grounding materials and light, airy spaces. We curated a selection of large-format volcanic stone slabs for the main living areas, creating a seamless transition between the interior and the lush garden.</p><p>The centerpiece is a custom-designed fireplace clad in Black Basalt, which anchors the double-height living room.</p>",
            image: "/cdmx.png",
            gallery: [
                "/cdmx.png",
                "/tulum.png",
                "/san-miguel.png"
            ],
            architect: "Studio Lomas",
            client: "Private Residence"
        }
    },
    "villa-tulum-riviera-maya": {
        data: {
            id: 2,
            slug: "villa-tulum-riviera-maya",
            title: "Villa Tulum",
            location: "Riviera Maya",
            category: "Hospitality",
            year: "2023",
            description: "Curating energy through massive quartz installations in open spaces.",
            long_description: "<p>Curating energy through massive quartz installations in open spaces.</p><p>For this boutique hotel in Tulum, we were tasked with selecting minerals that would resonate with the spiritual and natural vibe of the region. We installed a series of massive Rose Quartz monoliths in the central courtyard, serving as both sculptural elements and energetic anchors.</p><p>The spa area features translucent Agate panels that are backlit to create a soothing, ethereal atmosphere.</p>",
            image: "/tulum.png",
            gallery: [
                "/tulum.png",
                "/cdmx.png",
                "/san-miguel.png"
            ],
            architect: "Maya Design Group",
            client: "Azulik Hotel"
        }
    },
    "san-miguel-loft-guanajuato": {
        data: {
            id: 3,
            slug: "san-miguel-loft-guanajuato",
            title: "San Miguel Loft",
            location: "Guanajuato",
            category: "Interior Styling",
            year: "2023",
            description: "Integrating fossilized textures into colonial architecture.",
            long_description: "<p>Integrating fossilized textures into colonial architecture.</p><p>This renovation of a historic loft in San Miguel de Allende required a sensitive approach to materials. We introduced fossilized limestone flooring that complements the original stone walls while adding a layer of prehistoric history.</p><p>A statement coffee table made from a single slab of Petrified Wood bridges the gap between the rustic colonial structure and the client's modern furniture collection.</p>",
            image: "/san-miguel.png",
            gallery: [
                "/san-miguel.png",
                "/tulum.png",
                "/cdmx.png"
            ],
            architect: "Colonial Modern",
            client: "Private Collector"
        }
    }
};

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Use the live API endpoint provided by the user
        const res = await fetch(`https://erp.oneofakind.com.mx/api/projects/${slug}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.log('Odoo API not available for project, using fallback data');
            if (FALLBACK_PROJECTS[slug]) {
                return NextResponse.json(FALLBACK_PROJECTS[slug]);
            }
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const json = await res.json();
        const projectData = json.data || json;

        // Helper to ensure proper image URLs
        const processImage = (url: string) => {
            if (!url) return "";
            if (url.startsWith('http')) return url.replace(/^http:\/\//, "https://");
            return url;
        };

        // Process images
        if (projectData) {
            if (projectData.image) projectData.image = processImage(projectData.image);
            if (projectData.gallery && Array.isArray(projectData.gallery)) {
                projectData.gallery = projectData.gallery.map(processImage);
            }
        }

        return NextResponse.json({ data: projectData });
    } catch (error) {
        console.log('Error fetching project from Odoo, using fallback data:', error);
        const { slug } = await params;
        if (FALLBACK_PROJECTS[slug]) {
            return NextResponse.json(FALLBACK_PROJECTS[slug]);
        }
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
}

```

## ./app/api/projects/route.ts
```ts
import { NextResponse } from 'next/server';

// Fallback data in case Odoo API is not ready
const FALLBACK_PROJECTS = {
    data: [
        {
            id: 1,
            slug: "casa-lomas-mexico-city",
            title: "Casa Lomas",
            location: "Mexico City",
            category: "Residential",
            year: "2024",
            description: "A dialogue between raw volcanic stone and modern minimalism.",
            long_description: "<p>A dialogue between raw volcanic stone and modern minimalism.</p><p>This residential project in the exclusive Lomas de Chapultepec neighborhood explores the relationship between heavy, grounding materials and light, airy spaces. We curated a selection of large-format volcanic stone slabs for the main living areas, creating a seamless transition between the interior and the lush garden.</p><p>The centerpiece is a custom-designed fireplace clad in Black Basalt, which anchors the double-height living room.</p>",
            image: "/cdmx.png",
            gallery: [
                "/cdmx.png",
                "/tulum.png",
                "/san-miguel.png"
            ],
            architect: "Studio Lomas",
            client: "Private Residence"
        },
        {
            id: 2,
            slug: "villa-tulum-riviera-maya",
            title: "Villa Tulum",
            location: "Riviera Maya",
            category: "Hospitality",
            year: "2023",
            description: "Curating energy through massive quartz installations in open spaces.",
            long_description: "<p>Curating energy through massive quartz installations in open spaces.</p><p>For this boutique hotel in Tulum, we were tasked with selecting minerals that would resonate with the spiritual and natural vibe of the region. We installed a series of massive Rose Quartz monoliths in the central courtyard, serving as both sculptural elements and energetic anchors.</p><p>The spa area features translucent Agate panels that are backlit to create a soothing, ethereal atmosphere.</p>",
            image: "/tulum.png",
            gallery: [
                "/tulum.png",
                "/cdmx.png",
                "/san-miguel.png"
            ],
            architect: "Maya Design Group",
            client: "Azulik Hotel"
        },
        {
            id: 3,
            slug: "san-miguel-loft-guanajuato",
            title: "San Miguel Loft",
            location: "Guanajuato",
            category: "Interior Styling",
            year: "2023",
            description: "Integrating fossilized textures into colonial architecture.",
            long_description: "<p>Integrating fossilized textures into colonial architecture.</p><p>This renovation of a historic loft in San Miguel de Allende required a sensitive approach to materials. We introduced fossilized limestone flooring that complements the original stone walls while adding a layer of prehistoric history.</p><p>A statement coffee table made from a single slab of Petrified Wood bridges the gap between the rustic colonial structure and the client's modern furniture collection.</p>",
            image: "/san-miguel.png",
            gallery: [
                "/san-miguel.png",
                "/tulum.png",
                "/cdmx.png"
            ],
            architect: "Colonial Modern",
            client: "Private Collector"
        }
    ]
};

export async function GET() {
    try {
        // Use the live API endpoint provided by the user
        const res = await fetch('https://erp.oneofakind.com.mx/api/projects/list', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            console.log('Odoo API error, using fallback data');
            return NextResponse.json(FALLBACK_PROJECTS);
        }

        const json = await res.json();

        // Helper to ensure proper image URLs
        const processImage = (url: string) => {
            if (!url) return "";
            if (url.startsWith('http')) return url.replace(/^http:\/\//, "https://");
            // If it's a relative path like /tulum.png, keep it as is (served from public folder)
            return url;
        };

        // Process data
        let projects = json.data || json;
        if (Array.isArray(projects)) {
            projects = projects.map((project: any) => ({
                ...project,
                image: processImage(project.image)
            }));
        }

        return NextResponse.json({ data: projects });
    } catch (error) {
        console.log('Error fetching from Odoo, using fallback data:', error);
        return NextResponse.json(FALLBACK_PROJECTS);
    }
}

```

## ./app/api/webhooks/stripe/route.ts
```ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const ODOO_URL = 'https://erp.oneofakind.com.mx/api/sales/create_from_stripe';
const ODOO_TOKEN = process.env.ODOO_API_TOKEN;

async function syncWithOdoo(session: Stripe.Checkout.Session, lineItems: Stripe.ApiList<Stripe.LineItem>) {
    // Prepare Payload
    const payload = {
        stripe_session_id: session.id,
        customer: {
            name: session.customer_details?.name,
            email: session.customer_details?.email,
            address: {
                line1: session.shipping_details?.address?.line1,
                line2: session.shipping_details?.address?.line2,
                city: session.shipping_details?.address?.city,
                state: session.shipping_details?.address?.state,
                country: session.shipping_details?.address?.country,
                postal_code: session.shipping_details?.address?.postal_code,
            }
        },
        items: lineItems.data.map((item: any) => ({
            product_name: item.description,
            quantity: item.quantity,
            price_unit: item.amount_total / 100, // Stripe uses cents
            // Try to get SKU from product metadata if available
            sku: item.price?.product?.metadata?.sku || null
        }))
    };

    console.log('📦 Sending payload to Odoo:', JSON.stringify(payload, null, 2));

    // Send to Odoo
    const response = await fetch(ODOO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ODOO_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    console.log('📡 Odoo Response Status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Odoo Sync Error:', errorText);
        throw new Error(`Odoo responded with ${response.status}`);
    }

    const json = await response.json();
    console.log('✅ Orden creada en Odoo:', json.data?.order_name);
    return json;
}

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!endpointSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // Fetch line items (Stripe doesn't send them by default in the webhook)
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product']
            });

            await syncWithOdoo(session, lineItems);

        } catch (error) {
            console.error('Error syncing with Odoo:', error);
            // Return 500 to retry later
            return NextResponse.json({ error: 'Error syncing with Odoo' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

export async function GET() {
    return NextResponse.json({ status: 'Webhook endpoint is active' });
}

```

## ./app/cancel/page.tsx
```tsx
import React from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6">Payment Cancelled</h1>
            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                Your payment was cancelled and you have not been charged. You can try again or continue shopping.
            </p>
            <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                <Link href="/checkout">Try Again</Link>
            </Button>
        </div>
    );
}

```

## ./app/cart/page.tsx
```tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

export default function CartPage() {
    const { items, removeItem, updateQuantity, cartTotal } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <h1 className="text-3xl font-serif mb-4">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added any treasures yet.</p>
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466]">
                    <Link href="/">Explore Collection</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/" className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">Shopping Cart</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[#6C7466]/10 text-xs font-bold tracking-widest uppercase text-gray-400">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Total</div>
                            <div className="col-span-2"></div>
                        </div>

                        {items.map((item) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-[#6C7466]/10 pb-8 last:border-0">
                                {/* Product Info */}
                                <div className="md:col-span-6 flex gap-4">
                                    <div className="relative w-24 h-32 bg-[#EBEBE8] shrink-0 rounded-sm overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h3 className="text-lg font-serif text-[#2B2B2B] mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{item.category}</p>
                                        <p className="text-sm text-[#6C7466] md:hidden">${item.price.toLocaleString("en-US")}</p>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="md:col-span-2 flex justify-center">
                                    <div className="flex items-center border border-[#6C7466]/20 rounded-sm">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-2 hover:bg-[#6C7466]/5 transition-colors"
                                        >
                                            <Minus className="w-3 h-3 text-[#6C7466]" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-[#2B2B2B]">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-2 hover:bg-[#6C7466]/5 transition-colors"
                                        >
                                            <Plus className="w-3 h-3 text-[#6C7466]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="md:col-span-2 text-right hidden md:block">
                                    <p className="text-base font-medium text-[#2B2B2B]">
                                        ${(item.price * item.quantity).toLocaleString("en-US")}
                                    </p>
                                </div>

                                {/* Remove */}
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-sm shadow-sm sticky top-32">
                            <h2 className="text-xl font-serif text-[#2B2B2B] mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-xs text-gray-400">Calculated at checkout</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span className="text-xs text-gray-400">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-[#2B2B2B]">Total</span>
                                    <span className="text-2xl font-serif text-[#2B2B2B]">${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                            </div>

                            <Button
                                asChild
                                className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase mb-4"
                            >
                                <Link href="/checkout">Proceed to Checkout</Link>
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Secure Checkout</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## ./app/checkout/page.tsx
```tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from "@stripe/react-stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const { items, cartTotal } = useCart();
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (items.length > 0) {
            fetch("/api/checkout_sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ items }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret));
        }
    }, [items]);

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <Button asChild variant="link">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/cart" className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Embedded Checkout Form */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-[#6C7466]/10">
                        {clientSecret ? (
                            <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={{ clientSecret }}
                            >
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        ) : (
                            <div className="flex justify-center py-12">
                                <p className="text-gray-500">Loading checkout...</p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#EBEBE8]/30 p-8 rounded-sm h-fit">
                        <h2 className="text-lg font-serif text-[#2B2B2B] mb-6">Order Summary</h2>
                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 bg-[#EBEBE8] rounded-sm overflow-hidden">
                                            <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#2B2B2B]">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-[#2B2B2B]">${(item.price * item.quantity).toLocaleString("en-US")}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#6C7466]/10 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${cartTotal.toLocaleString("en-US")}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>Calculated at checkout</span>
                            </div>
                        </div>

                        <div className="border-t border-[#6C7466]/10 pt-4 mt-4">
                            <div className="flex justify-between items-end">
                                <span className="text-base font-bold text-[#2B2B2B]">Total</span>
                                <span className="text-2xl font-serif text-[#2B2B2B]">${cartTotal.toLocaleString("en-US")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## ./app/collections/[collection]/[category]/page.tsx
```tsx
import { ArrowRight, Star, ArrowDown } from "lucide-react";
import Link from "next/link";
// 1. Importamos el Grid
import { ProductGrid } from "@/components/ProductGrid";
import { fetchCollections, fetchCollectionDetails, mapApiProductDetailToProduct } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ collection: string; category: string }>;
}) {
    const { collection, category } = await params;
    const collections = await fetchCollections();

    // Try to find category in API. The API keys seem to be flat (e.g. "alloys", "antonio").
    // The URL structure is /collections/[collection]/[category].
    // Maybe the category corresponds to a key in the API?
    // Or maybe the API has a hierarchical structure? The user provided API has "parent": "alloys" for "antonio".
    // So "antonio" is a child of "alloys".
    // If URL is /collections/alloys/antonio, then `collection` is alloys, `category` is antonio.
    // We should look up `category` in the API.

    let apiCategoryKey = Object.keys(collections).find(key =>
        key === category ||
        key === category.toLowerCase()
    );

    let apiParentKey = Object.keys(collections).find(key =>
        key === collection ||
        key === collection.toLowerCase() ||
        key === collection + 's' ||
        key === collection.toLowerCase() + 's'
    );

    if (!apiCategoryKey) {
        // Fallback or 404
        // return notFound();
    }

    // Fetch details
    const categoryDetail = apiCategoryKey ? await fetchCollectionDetails(apiCategoryKey) : null;
    const parentDetail = apiParentKey ? await fetchCollectionDetails(apiParentKey) : null;

    const data = categoryDetail ? {
        // Prefer parent description if category description is missing or if user wants inheritance
        description: (parentDetail && parentDetail.collection_info.description) || categoryDetail.collection_info.description,
    } : null;

    const categoryNameDisplay = categoryDetail ? categoryDetail.collection_info.title : category.replace(/-/g, " ").toUpperCase();
    const collectionNameDisplay = parentDetail ? parentDetail.collection_info.title : collection.replace(/-/g, " ").toUpperCase();

    const products = categoryDetail ? categoryDetail.products.map(p => mapApiProductDetailToProduct(p, categoryNameDisplay)) : [];

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Grain & Atmosphere */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />
            {/* Architectural Line */}
            <div className="hidden md:block absolute top-0 left-12 w-px h-full bg-[#6C7466]/10 z-0" />

            <div className="relative z-10 pt-32 pb-24 container mx-auto px-6">

                {/* 2. Breadcrumb */}
                <nav className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase text-[#6C7466]/60 mb-12 md:mb-20 pl-0 md:pl-12">
                    <Link href={`/collections/${collection}`} className="hover:text-[#6C7466] transition-colors border-b border-transparent hover:border-[#6C7466]">
                        {collectionNameDisplay}
                    </Link>
                    <ArrowRight className="w-3 h-3 text-[#6C7466]/40" />
                    <span className="text-[#6C7466]">
                        {categoryNameDisplay}
                    </span>
                </nav>

                {/* 3. Header Section */}
                <div className="container mx-auto px-6 mb-12">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-[#6C7466] leading-[1.1] tracking-tight mb-8">
                            {categoryNameDisplay}
                        </h1>

                        <div className="w-full h-px bg-[#6C7466]/20 mb-8" />

                        {data && (
                            <div className="max-w-2xl mx-auto">
                                <p className="text-lg md:text-xl font-serif text-[#2B2B2B] leading-relaxed italic opacity-80">
                                    "{data.description}"
                                </p>
                                <p className="mt-4 text-sm text-gray-500 font-light leading-relaxed">
                                    Exploring the nuances of texture and form within the {collectionNameDisplay}. A study in material purity.
                                </p>
                            </div>
                        )}

                        <div className="w-full h-px bg-[#6C7466]/20 mt-12" />
                    </div>
                </div>

                {/* 5. Product Gallery Grid */}
                <div className="pl-0 md:pl-12">
                    <div className="flex items-end justify-between mb-12 border-b border-[#6C7466]/10 pb-6">
                        <div>
                            <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase block mb-2">
                                Catalogue
                            </span>
                            <span className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">
                                The Selection
                            </span>
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase hidden md:block">
                            {products.length > 0 ? `${products.length} Series` : 'Available Soon'}
                        </span>
                    </div>

                    {/* @ts-ignore */}
                    <ProductGrid products={products} />

                </div>

            </div>
        </main>
    );
}
```

## ./app/collections/[collection]/page.tsx
```tsx
import { notFound } from "next/navigation";
import { Star, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { fetchCollections, fetchCollectionDetails, mapApiProductDetailToProduct } from "@/lib/api";


export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collection: string }>;
}) {
    const { collection } = await params;
    const collections = await fetchCollections();

    // Try to find collection by slug (assuming API keys are slugs like 'alloys')
    let apiCollectionKey = Object.keys(collections).find(key =>
        key === collection ||
        key === collection.toLowerCase() ||
        key === collection + 's' ||
        key === collection.toLowerCase() + 's'
    );

    if (!apiCollectionKey) {
        return notFound();
    }

    // Fetch detailed data for this collection
    const collectionDetail = await fetchCollectionDetails(apiCollectionKey);

    if (!collectionDetail) {
        return notFound();
    }

    const mainTitle = collectionDetail.collection_info.title;
    const products = collectionDetail.products.map(p => mapApiProductDetailToProduct(p, mainTitle));

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Texture & Architecture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />
            <div className="hidden md:block absolute top-0 left-[15%] w-px h-full bg-[#6C7466]/5 z-0" />
            <div className="hidden md:block absolute top-0 right-[15%] w-px h-full bg-[#6C7466]/5 z-0" />

            <div className="relative z-10 pt-4 pb-0 md:pt-20 md:pb-12">

                {/* 2. HEADER SECTION: Centered & Clean */}
                <div className="container mx-auto px-6 mb-2 md:mb-8">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-1 md:mb-3">
                            <Star className="w-2 h-2 md:w-3 md:h-3 text-[#6C7466] animate-spin-slow" />
                            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase text-[#6C7466]/70">
                                Curated Series
                            </span>
                            <Star className="w-2 h-2 md:w-3 md:h-3 text-[#6C7466] animate-spin-slow" />
                        </div>

                        <h1 className="text-xl md:text-4xl lg:text-5xl font-serif text-[#6C7466] leading-[1.1] tracking-tight mb-2 md:mb-4">
                            {mainTitle}
                        </h1>

                        <div className="w-full h-px bg-[#6C7466]/20 mb-2 md:mb-4 opacity-20 md:opacity-100" />

                        <div className="max-w-2xl mx-auto">
                            <Sparkles className="hidden md:block w-3 h-3 md:w-5 md:h-5 text-[#6C7466]/40 mb-2 md:mb-4 mx-auto" />
                            <p className="text-xs md:text-lg font-serif text-[#2B2B2B] leading-tight md:leading-relaxed whitespace-pre-wrap">
                                {collectionDetail.collection_info.description}
                            </p>
                            {collectionDetail.collection_info.subtitle && (
                                <p className="mt-1 md:mt-4 text-[10px] md:text-sm text-gray-500 font-light leading-tight md:leading-relaxed whitespace-pre-wrap">
                                    {collectionDetail.collection_info.subtitle}
                                </p>
                            )}
                        </div>

                        <div className="hidden md:block w-full h-px bg-[#6C7466]/20 mt-6 md:mt-8" />
                    </div>
                </div>

                {/* 5. GALLERY GRID */}
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mt-4 mb-4 md:mb-6 border-b border-[#6C7466]/10 pb-2 md:pb-4">
                        <span className="text-sm md:text-2xl font-serif text-[#6C7466] italic hidden md:block">
                            The Pieces
                        </span>
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-gray-400 uppercase w-full text-center md:w-auto md:text-right">
                            {products.length || 0} Objects
                        </span>
                    </div>

                    {/* @ts-ignore */}
                    <ProductGrid products={products} />
                </div>

            </div>
        </main>
    );
}
```

## ./app/craft-stories/page.tsx
```tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gem, Hammer, ArrowRight, Star, Clock, Mountain, Microscope, MoveDown, Loader2 } from 'lucide-react';

// Mapeo de strings (API) a Componentes Lucide
const iconMap: any = {
  mountain: Mountain,
  hammer: Hammer,
  clock: Clock,
  gem: Gem,
  microscope: Microscope,
  star: Star,
};

export default function CraftStoriesPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use internal proxy to avoid CORS
        const res = await fetch('/api/craft-stories-content');
        if (!res.ok) throw new Error('Error fetching data');
        const json = await res.json();
        setContent(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return <div className="min-h-screen flex items-center justify-center">Error loading content.</div>;
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

      {/* 1. BACKGROUND LAYERS */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="container mx-auto h-full border-x border-[#6C7466]/5 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12">
          <div className="hidden md:block col-span-1 h-full border-r border-[#6C7466]/5"></div>
          <div className="hidden lg:block col-span-1 h-full border-r border-[#6C7466]/5 col-start-12"></div>
        </div>
      </div>

      <div className="relative z-10">

        {/* 2. HERO SECTION */}
        <section className="flex flex-col justify-center container mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="max-w-screen-2xl mx-auto w-full">
            <div className="flex flex-col md:flex-row items-end justify-between mb-8 border-b border-[#6C7466]/20 pb-8">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center gap-2 text-[#6C7466] mb-4">
                  <Star className="w-4 h-4 animate-spin-slow" />
                  <span className="text-xs font-bold tracking-[0.25em] uppercase">{content.hero.est}</span>
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#1a1a1a] tracking-tight leading-[0.9]">
                  {content.hero.title_raw} <br />
                  <span className="italic font-light text-[#6C7466]">{content.hero.title_pure}</span>
                </h1>
              </div>
              <div className="max-w-sm pb-2">
                <p className="text-sm md:text-base text-gray-500 font-light leading-relaxed text-justify">
                  {content.hero.description}
                </p>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-[#6C7466]/60">SCROLL TO DISCOVER</span>
              <div className="w-10 h-10 rounded-full border border-[#6C7466]/20 flex items-center justify-center animate-bounce duration-3000">
                <MoveDown className="w-4 h-4 text-[#6C7466]" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. INFINITE MARQUEE */}
        <div className="w-full border-y border-[#6C7466]/10 bg-[#6C7466]/5 py-4 overflow-hidden mb-32">
          <div className="whitespace-nowrap animate-marquee flex gap-12">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-4xl font-serif italic text-[#6C7466]/40">
                {content.marquee}
              </span>
            ))}
          </div>
        </div>

        {/* 4. THE CHAPTERS (Dynamic Rendering) */}
        <section className="container mx-auto px-6 mb-40">
          {content.chapters.map((chapter: any, index: number) => {
            const isEven = index % 2 === 0; // Para alternar izquierda/derecha
            const ChapterIcon = iconMap[chapter.icon] || Star;

            // Fallback images si la API viene vacía (para que se vea bonito el demo)
            const fallbackImage = isEven
              ? "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1597523920677-24a9d7743d50?q=80&w=1600&auto=format&fit=crop";

            return (
              <div key={chapter.id} className="grid lg:grid-cols-2 gap-16 items-center mb-40 group">

                {/* Image Side */}
                <div className={`${isEven ? 'order-2 lg:order-1' : 'relative'} relative`}>
                  <div className="aspect-[4/5] overflow-hidden bg-gray-200 relative">
                    <img
                      src={chapter.image_url || fallbackImage}
                      alt={chapter.title.main}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />
                    <div className={`absolute top-4 ${isEven ? 'left-4' : 'right-4'} bg-[#FDFBF7] px-3 py-1 text-xs font-bold tracking-widest uppercase text-[#6C7466]`}>
                      {chapter.fig_label}
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div className={`${isEven ? 'order-1 lg:order-2 lg:pl-12' : 'lg:pr-12'} relative`}>
                  <span className={`text-9xl font-serif text-[#6C7466]/10 absolute -translate-y-16 select-none ${isEven ? '-translate-x-8' : 'right-0 lg:right-12'}`}>
                    {chapter.number}
                  </span>

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <ChapterIcon className="w-5 h-5 text-[#6C7466]" />
                      <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase">
                        {chapter.label_top}
                      </span>
                    </div>

                    <h2 className="text-5xl md:text-6xl font-serif text-[#2B2B2B] mb-8 leading-[1.1]">
                      {chapter.title.main} <br />
                      <span className="italic text-[#6C7466]">{chapter.title.italic}</span>
                    </h2>

                    <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
                      {chapter.description}
                    </p>

                    {/* Features List (Conditional) */}
                    {chapter.features && chapter.features.length > 0 && (
                      <ul className="space-y-4 border-t border-[#6C7466]/20 pt-6">
                        {chapter.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C7466]"></span> {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Video Button (Conditional - solo ejemplo visual si no hay features) */}
                    {(!chapter.features || chapter.features.length === 0) && (
                      <div className="flex gap-4">
                        <div className="px-6 py-3 border border-[#6C7466]/30 text-[#6C7466] text-xs font-bold uppercase tracking-widest hover:bg-[#6C7466] hover:text-white transition-all cursor-pointer">
                          Watch Video
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5. DETAILS BENTO GRID */}
        {content.bento_grid && (
          <section className="bg-[#6C7466] text-[#FDFBF7] py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-xl mb-16">
                <h3 className="text-4xl font-serif mb-4">{content.bento_grid.title}</h3>
                <p className="opacity-80 font-light">It is not just art; it is mineralogy. Understanding the physical properties allows us to push boundaries.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#FDFBF7]/20 border border-[#FDFBF7]/20">
                {content.bento_grid.cards.map((card: any, idx: number) => {
                  const CardIcon = iconMap[card.icon] || Star;
                  return (
                    <div key={idx} className="bg-[#6C7466] p-10 hover:bg-[#5e6659] transition-colors group">
                      <CardIcon className="w-8 h-8 mb-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <h4 className="text-xl font-serif mb-2">{card.title}</h4>
                      <p className="text-sm opacity-70 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 6. BIG QUOTE SECTION */}
        <section className="py-40 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <Star className="w-6 h-6 text-[#6C7466] mx-auto mb-10" />
            <blockquote className="text-4xl md:text-6xl font-serif leading-tight text-[#2B2B2B]">
              {content.quote.text}
            </blockquote>
            <cite className="block mt-8 text-sm font-bold tracking-widest text-[#6C7466] uppercase not-italic">
              — {content.quote.author}
            </cite>
          </div>
        </section>

        {/* 7. FOOTER CTA */}
        <div className="pb-20 text-center relative z-10">
          <div className="inline-block relative group">
            <div className="absolute inset-0 bg-[#6C7466] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <Link href={content.footer.link || "#"} className="relative z-10 flex items-center gap-6 px-12 py-6 bg-[#2B2B2B] rounded-full text-[#FDFBF7] overflow-hidden transition-transform active:scale-95">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6C7466]">
                  {content.footer.label}
                </span>
                <span className="text-xl font-serif italic">{content.footer.cta}</span>
              </div>
              <div className="w-10 h-10 bg-[#6C7466] rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>

          <div className="mt-16 text-[10px] uppercase tracking-widest text-gray-400">
            © 2024 Craft Stories · Designed with purpose
          </div>
        </div>

      </div>
    </main>
  );
}
```

## ./app/globals.css
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.985 0.002 106.423);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.145 0 0);
  --primary-foreground: oklch(0.985 0.002 106.423);
  --secondary: oklch(0.92 0.004 106.423);
  --secondary-foreground: oklch(0.145 0 0);
  --muted: oklch(0.92 0.004 106.423);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.62 0.06 28.62);
  --accent-foreground: oklch(0.985 0.002 106.423);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.88 0.003 106.423);
  --input: oklch(0.88 0.003 106.423);
  --ring: oklch(0.145 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0.002 106.423);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0.002 106.423);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0.002 106.423);
  --primary: oklch(0.985 0.002 106.423);
  --primary-foreground: oklch(0.145 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0.002 106.423);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.62 0.06 28.62);
  --accent-foreground: oklch(0.985 0.002 106.423);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0.002 106.423);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0.002 106.423);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0.002 106.423);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
  --font-sans: "Geist", "Geist Fallback";
  --font-mono: "Geist Mono", "Geist Mono Fallback";
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/* app/globals.css */

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-marquee {
  animation: marquee 40s linear infinite;
}

.animate-spin-slow {
  animation: spin 8s linear infinite;
}
```

## ./app/layout.tsx
```tsx
import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { CartProvider } from "@/context/cart-context"
import { CartSidebar } from "@/components/cart-sidebar"

// 1. Configuramos las variables para que Tailwind las pueda usar
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "One Of A Kind",
  description:
    "One Of A Kind, Unique Artefacts of Exceptional Quality for Your Home Decor and Collections. Handmade and Handcrafted by artisans in Copenhagen, Denmark.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#FDFBF7] text-[#2B2B2B]`}
      >
        <CartProvider>
          <Navbar />
          <CartSidebar />

          {/* 
             2. WRAPPER PRINCIPAL (<main>)
             Aquí es donde ocurre la magia de la armonía. 
             
             - pt-20 (80px): Espacio para el Navbar en Móvil.
             - lg:pt-[220px]: Espacio para el Navbar Expandido en Desktop (Logo grande + Menú).
             - min-h-screen: Asegura que el footer siempre se empuje al final.
          */}
          <main className="relative flex flex-col min-h-screen pt-20 lg:pt-[220px]">
            {children}
          </main>

          <Footer />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
```

## ./app/legal/[slug]/page.tsx
```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import { getLegalPage } from '@/lib/legal';

interface LegalPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
    };
}

export default async function LegalPage({ params }: LegalPageProps) {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Back Button */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#6C7466] hover:text-[#2B2B2B] transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </div>

                {/* Header */}
                <header className="mb-12 border-b border-[#6C7466]/10 pb-8">
                    <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-4">
                        {page.title}
                    </h1>
                    {page.last_updated && (
                        <p className="text-[#6C7466]/70 text-sm">
                            Last updated: {new Date(page.last_updated).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    )}
                </header>

                {/* Content */}
                <article className="
                    prose prose-lg max-w-none
                    prose-headings:font-serif prose-headings:text-[#2B2B2B]
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-p:text-[#2B2B2B]/80 prose-p:leading-relaxed
                    prose-a:text-[#6C7466] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[#2B2B2B] prose-strong:font-medium
                    prose-ul:list-disc prose-ul:pl-4 prose-ul:my-6
                    prose-li:text-[#2B2B2B]/80 prose-li:mb-2
                ">
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                </article>
            </div>
        </main>
    );
}

```

## ./app/legal/page.tsx
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-8">Legal Information</h1>

                <div className="prose prose-stone max-w-none space-y-8 text-gray-600">
                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Terms and Conditions</h2>
                        <p>
                            Welcome to One of a Kind. By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Privacy Policy</h2>
                        <p>
                            Your privacy is important to us. It is One of a Kind's policy to respect your privacy regarding any information we may collect from you across our website. We only ask for personal information when we truly need it to provide a service to you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Shipping and Delivery</h2>
                        <p>
                            We ship worldwide. All orders are processed within 2-3 business days. Shipping charges for your order will be calculated and displayed at checkout.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Returns and Exchanges</h2>
                        <p>
                            We accept returns up to 30 days after delivery, if the item is unused and in its original condition, and we will refund the full order amount minus the shipping costs for the return.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-[#6C7466]/10">
                    <Button asChild variant="outline" className="rounded-none border-[#6C7466] text-[#6C7466] hover:bg-[#6C7466] hover:text-white transition-colors">
                        <Link href="/">Return to Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

```

## ./app/manifest.json
```json
{
 "name": "App",
 "icons": [
  {
   "src": "\/android-icon-36x36.png",
   "sizes": "36x36",
   "type": "image\/png",
   "density": "0.75"
  },
  {
   "src": "\/android-icon-48x48.png",
   "sizes": "48x48",
   "type": "image\/png",
   "density": "1.0"
  },
  {
   "src": "\/android-icon-72x72.png",
   "sizes": "72x72",
   "type": "image\/png",
   "density": "1.5"
  },
  {
   "src": "\/android-icon-96x96.png",
   "sizes": "96x96",
   "type": "image\/png",
   "density": "2.0"
  },
  {
   "src": "\/android-icon-144x144.png",
   "sizes": "144x144",
   "type": "image\/png",
   "density": "3.0"
  },
  {
   "src": "\/android-icon-192x192.png",
   "sizes": "192x192",
   "type": "image\/png",
   "density": "4.0"
  }
 ]
}
```

## ./app/news-events/[slug]/page.tsx
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Calendar,
    MapPin,
    ArrowLeft,
    Clock,
    Share2,
    User,
    Mail,
    ExternalLink,
    Loader2
} from 'lucide-react';

interface EventDetail {
    id: number;
    slug: string;
    status: string;
    date: string;
    title: string;
    location: string;
    description: string;
    long_description?: string;
    image?: string;
    gallery?: string[];
    time?: string;
    organizer?: string;
    contact?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slug, setSlug] = useState<string>('');

    // 1. Resolver params (Next.js 15)
    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
        };
        getParams();
    }, [params]);

    // 2. Fetch de datos
    useEffect(() => {
        if (!slug) return;

        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/news-events/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not-found');
                        return;
                    }
                    throw new Error('Error fetching event');
                }
                const json = await res.json();
                // Maneja si la API devuelve { data: ... } o el objeto directo
                setEvent(json.data || json);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [slug]);

    // 3. Función compartir
    const handleShare = async () => {
        if (navigator.share && event) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard');
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] animate-pulse">
                <div className="h-[50vh] bg-gray-200 w-full" />
                <div className="container mx-auto px-6 py-12 max-w-6xl">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error === 'not-found' || !event) return notFound();

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <p className="text-red-500 mb-4 font-medium">Error loading event.</p>
                <Link href="/news-events" className="text-[#6C7466] hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Try again
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] font-sans selection:bg-[#6C7466] selection:text-white">

            {/* --- HERO SECTION --- */}
            <div className="relative h-[50vh] lg:h-[60vh] w-full overflow-hidden bg-[#EBEBE8]">
                {event.image ? (
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                    // Nota: Asegúrate de que el dominio de la imagen esté en next.config.js
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-[#6C7466]/30 font-serif text-4xl">Event</span>
                    </div>
                )}

                {/* Degradado para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/90 via-[#2B2B2B]/30 to-transparent" />

                {/* Botón Volver */}
                <div className="absolute top-0 left-0 w-full p-6 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <Link
                            href="/news-events"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Título Principal */}
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20">
                    <div className="container mx-auto max-w-6xl">
                        {event.status === 'upcoming' && (
                            <span className="inline-block px-3 py-1 rounded-md bg-[#6C7466] text-white text-xs font-bold tracking-widest uppercase mb-4 shadow-lg shadow-[#6C7466]/20">
                                Upcoming Event
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight max-w-4xl drop-shadow-md">
                            {event.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-12 gap-12">

                    {/* COLUMNA IZQUIERDA: TEXTO RENDERIZADO (8 COLS) */}
                    <div className="lg:col-span-8">

                        {/* 
                           AQUÍ ESTÁ LA CORRECCIÓN DE ESTILO PARA TU JSON:
                           Estas clases transforman el HTML crudo de la API en diseño editorial.
                        */}
                        <article className="
                            prose prose-lg max-w-none
                            
                            // Títulos Generales (H2 en tu JSON)
                            prose-headings:font-serif prose-headings:text-[#2B2B2B]
                            prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:font-medium
                            
                            // SUBTÍTULOS (H3 en tu JSON - AIDA, PAS): 
                            // Los convertimos en texto pequeño, mayúsculas y verde
                            prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-[0.15em] prose-h3:text-[#6C7466] prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-sans
                            
                            // Párrafos
                            prose-p:text-[#2B2B2B]/85 prose-p:leading-[1.8] prose-p:font-light prose-p:mb-6
                            
                            // Negritas (strong): Efecto 'resaltador' sutil verde
                            prose-strong:font-bold prose-strong:text-[#2B2B2B] prose-strong:bg-[#6C7466]/10 prose-strong:px-1 prose-strong:rounded-sm
                            
                            // Listas (ul/li): Puntos (bullets) personalizados verdes
                            prose-ul:my-6 prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3
                            prose-li:pl-6 prose-li:relative prose-li:text-[#2B2B2B]/85
                            prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-[0.6em] prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:bg-[#6C7466] prose-li:before:rounded-full
                            
                            // Enlaces dentro del texto
                            prose-a:text-[#6C7466] prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#555]
                        ">
                            {/* Renderizamos long_description si existe, si no description */}
                            <div dangerouslySetInnerHTML={{ __html: event.long_description || event.description }} />
                        </article>

                        {/* Galería */}
                        {event.gallery && event.gallery.length > 0 && (
                            <div className="border-t border-[#6C7466]/10 pt-16 mt-12">
                                <h3 className="text-2xl font-serif text-[#2B2B2B] mb-8 flex items-center gap-4">
                                    Gallery
                                    <span className="h-px flex-1 bg-[#6C7466]/10"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {event.gallery.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`relative rounded-xl overflow-hidden shadow-sm group bg-gray-100 ${idx === 0 ? 'md:col-span-2 md:aspect-[2.5/1]' : 'aspect-square'}`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Gallery ${idx}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: SIDEBAR STICKY (4 COLS) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">

                            {/* Tarjeta de Información */}
                            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6C7466]/10">
                                <h2 className="text-xl font-serif text-[#2B2B2B] mb-6 border-b border-[#6C7466]/10 pb-4">
                                    Event Details
                                </h2>

                                <div className="space-y-6">
                                    {/* Fecha */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Date</p>
                                            <p className="text-[#2B2B2B] font-medium">{event.date}</p>
                                        </div>
                                    </div>

                                    {/* Hora */}
                                    {event.time && (
                                        <div className="flex items-start gap-4 group">
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Time</p>
                                                <p className="text-[#2B2B2B] font-medium">{event.time}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ubicación */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Location</p>
                                            <p className="text-[#2B2B2B] font-medium leading-tight">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Organizador y Contacto */}
                                {(event.organizer || event.contact) && (
                                    <>
                                        <hr className="my-6 border-[#6C7466]/10" />
                                        <div className="space-y-3">
                                            {event.organizer && (
                                                <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                                    <User className="w-4 h-4 text-[#6C7466]" />
                                                    <span>Org: <span className="text-[#2B2B2B] font-medium">{event.organizer}</span></span>
                                                </div>
                                            )}
                                            {event.contact && (
                                                <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                                    <Mail className="w-4 h-4 text-[#6C7466]" />
                                                    <span className="truncate">{event.contact}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={handleShare}
                                    className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#FDFBF7] text-[#2B2B2B] border border-[#6C7466]/20 rounded-xl hover:bg-[#6C7466] hover:text-white hover:border-transparent transition-all duration-300 font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>

                            {/* Banner CTA */}
                            <div className="bg-[#6C7466] rounded-2xl p-8 text-center text-white relative overflow-hidden group shadow-lg">
                                {/* Efecto decorativo de fondo */}
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                                <h3 className="text-xl font-serif mb-2 relative z-10">Interested in attending?</h3>
                                <p className="text-white/80 text-sm mb-6 relative z-10 font-light">
                                    Don't miss the news and updates for this event.
                                </p>
                                <button className="w-full py-3 px-4 bg-white text-[#6C7466] rounded-xl font-bold text-sm hover:bg-[#FDFBF7] transition-colors relative z-10 flex items-center justify-center gap-2 shadow-md">
                                    More Information <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
```

## ./app/news-events/page.tsx
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowUpRight, MapPin, Loader2 } from 'lucide-react';

interface NewsEvent {
    id: number;
    slug: string;
    status: string;
    date: string;
    title: string;
    location: string;
    description: string;
    image?: string;
}

export default function NewsEventsPage() {
    const [events, setEvents] = useState<NewsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/news-events');
                if (!res.ok) throw new Error('Error fetching events');
                const json = await res.json();

                // Handle both possible API response structures
                let eventsData = json.data || json;

                // Ensure each event has a slug
                eventsData = eventsData.map((event: any) => ({
                    ...event,
                    slug: event.slug || event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                }));

                console.log('Loaded events:', eventsData);
                setEvents(eventsData);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <p className="text-red-500">Error loading events. Please try again later.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6C7466] opacity-[0.03] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-16 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 text-[#6C7466] mb-4">
                            <span className="text-xs font-bold tracking-[0.25em] uppercase">
                                Journal
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] tracking-tight leading-[0.9]">
                            News & Events
                        </h1>
                    </div>
                    <p className="text-gray-500 max-w-sm text-sm md:text-base leading-relaxed">
                        Stay updated with our latest discoveries, gallery openings, and exclusive collection drops.
                    </p>
                </div>

                {/* Events List */}
                <div className="max-w-5xl mx-auto flex flex-col gap-8">
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/news-events/${event.slug}`}
                            onClick={(e) => {
                                console.log('Navigating to:', `/news-events/${event.slug}`);
                            }}
                            className="block group relative bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#6C7466]/10 hover:shadow-xl hover:border-[#6C7466]/30 transition-all duration-500 ease-out"
                        >
                            {/* Flex container para las columnas */}
                            <div className="flex flex-col md:flex-row gap-8 md:gap-12 h-full">

                                {/* Columna Izquierda: Fecha / Status */}
                                <div className="md:w-1/4 shrink-0 flex flex-col justify-start border-l-2 border-[#6C7466]/10 pl-6 md:pl-0 md:border-l-0 md:border-r-2 md:border-[#6C7466]/10 md:pr-12">
                                    {event.status === 'upcoming' ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C7466] text-white text-xs font-bold uppercase tracking-wider w-fit mb-3">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            Upcoming
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider w-fit mb-3">
                                            Past Event
                                        </span>
                                    )}
                                    <div className="text-3xl md:text-4xl font-serif text-[#6C7466] mb-2">
                                        {event.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </div>
                                </div>

                                {/* Columna Derecha: Contenido */}
                                <div className="md:w-3/4 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-[#6C7466] mb-4 group-hover:text-black transition-colors duration-300">
                                            {event.title}
                                        </h2>
                                        <p className="text-gray-600 text-lg leading-relaxed line-clamp-3">
                                            {event.description}
                                        </p>
                                    </div>

                                    {/* Action Area */}
                                    <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        <span className="flex items-center gap-2 text-[#6C7466] font-semibold border-b border-[#6C7466] pb-1 group-hover:text-black group-hover:border-black transition-colors">
                                            View Details <ArrowUpRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>

                            </div>
                        </Link>
                    ))}
                </div>

                {/* Footer Text */}
                <div className="text-center mt-20">
                    <p className="text-[#6C7466]/50 text-sm">Don't miss out on future treasures.</p>
                </div>

            </div>
        </main>
    );
}
```

## ./app/page.tsx
```tsx
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, AlertTriangle } from "lucide-react";

// --- CONFIGURACIÓN DE LA API ---
// Apuntamos directamente a tu instancia de Odoo
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://erp.oneofakind.com.mx";
const PLACEHOLDER_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// --- INTERFACES (Adaptadas a tu respuesta JSON exacta) ---

interface SectionContent {
  background_text?: string;
  badge?: { icon: string; text: string };
  subtitle: string;
  title: { normal: string; highlight: string };
  description: string;
  cta: { text: string; sub_text?: string; href: string };
  image: { src: string; alt: string; show_badge?: boolean };
}

interface Section {
  id: string;
  type: "hero" | "feature" | "brand_story";
  layout: string;
  content: SectionContent;
}

interface PageData {
  data: {
    seo: {
      title: string;
      description: string;
      keywords: string;
      image: string;
    };
    sections: Section[];
  };
}

// --- FETCHING DE DATOS ---

async function getHomeData(): Promise<PageData | null> {
  // Construimos la URL al endpoint que creamos en el controlador de Odoo
  const endpoint = `${API_URL}/api/v1/home`;
  
  console.log(`🚀 [DEBUG] Iniciando petición a: ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      // revalidate: 60 -> ISR: Cachea por 60 segs (bueno para producción)
      // cache: "no-store" -> SSR: Siempre busca dato fresco (bueno para dev)
      next: { revalidate: 60 }, 
      headers: {
        "Content-Type": "application/json",
      }
    });

    console.log(`📡 [DEBUG] Status HTTP: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ [DEBUG] Error del servidor Odoo: ${text}`);
      return null;
    }

    const json = await res.json();

    // Validaciones básicas de estructura
    if (json.data && Array.isArray(json.data.sections)) {
       console.log(`✅ [DEBUG] Datos recibidos correctamente. ${json.data.sections.length} secciones encontradas.`);
    } else {
       console.error("⚠️ [DEBUG] Estructura JSON inesperada:", json);
    }

    return json;

  } catch (error) {
    console.error("❌ [DEBUG] Error de conexión:", error);
    return null;
  }
}

// --- METADATA (SEO) ---

export async function generateMetadata() {
  const pageData = await getHomeData();
  
  // Fallback si falla la API
  if (!pageData?.data?.seo) return {
    title: "One Of A Kind | Jasper",
    description: "Luxury stones and crystals."
  };

  const { seo } = pageData.data;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.image ? [seo.image] : [],
    },
  };
}

// --- COMPONENTE PRINCIPAL ---

export default async function Home() {
  const pageData = await getHomeData();

  // 1. MANEJO DE ERRORES / SIN DATOS
  if (!pageData || !pageData.data || !Array.isArray(pageData.data.sections)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-sm border border-red-100">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-[#6C7466] mb-2">Content Unavailable</h1>
            <p className="text-[#6C7466]/70 mb-4">
              Could not retrieve content from Odoo.
            </p>
            <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono text-gray-500 overflow-auto">
              <p>Target: {API_URL}</p>
              <p className="mt-2">Check server logs or Odoo module status.</p>
            </div>
        </div>
      </main>
    );
  }

  const { sections } = pageData.data;
  
  // Extraemos las secciones específicas usando el "type"
  const heroSection = sections.find((s) => s.type === "hero");
  const featureSection = sections.find((s) => s.type === "feature");
  const brandSection = sections.find((s) => s.type === "brand_story");

  // Helper para renderizar iconos dinámicos si fuera necesario
  const renderIcon = (iconName: string) => {
      // Por ahora solo usamos Star, pero aquí podrías agregar un switch
      return <Star className="w-3 h-3 fill-[#6C7466]" />;
  };

  // 2. RENDERIZADO
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] selection:bg-[#6C7466] selection:text-white">
      <div className="relative pt-24 pb-16 md:pt-28 md:pb-20 px-6 overflow-hidden">
        
        {/* Background Noise effect */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
        <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

        <div className="container mx-auto max-w-7xl relative z-10 space-y-32 md:space-y-48">
          
          {/* --- HERO SECTION --- */}
          {heroSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Image Column */}
              <div className={`order-2 lg:col-span-7 relative group ${heroSection.layout === 'image_right' ? 'lg:order-2' : 'lg:order-1'}`}>
                {heroSection.content.background_text && (
                  <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
                    {heroSection.content.background_text}
                  </div>
                )}

                <div className="relative w-full overflow-hidden rounded-sm shadow-sm z-10">
                  <Image
                    src={heroSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={heroSection.content.image?.alt || "Hero Image"}
                    width={1200}
                    height={1200}
                    className="w-full h-auto transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                    unoptimized={true} // Importante: permite cargar desde dominio externo sin config extra
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </div>

              {/* Text Column */}
              <div className={`order-1 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left ${heroSection.layout === 'image_right' ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <span className="h-px w-6 bg-[#6C7466]"></span>
                  <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                    {heroSection.content.subtitle}
                  </p>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
                  {heroSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B] opacity-80">
                    {heroSection.content.title.highlight}
                  </span>
                </h1>
                <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                  {heroSection.content.description}
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    href={heroSection.content.cta?.href || "#"}
                    className="group relative inline-flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">
                        {heroSection.content.cta?.text}
                      </span>
                      {heroSection.content.cta?.sub_text && (
                        <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                          {heroSection.content.cta.sub_text}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* --- FEATURE SECTION --- */}
          {featureSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              {/* Text (Left usually) */}
              <div className={`order-1 lg:col-span-5 flex flex-col ${featureSection.layout === 'image_left' ? 'lg:order-2 lg:items-start lg:text-left' : 'lg:order-1 lg:items-end lg:text-right'} items-center text-center`}>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  {featureSection.layout !== 'image_left' && featureSection.content.subtitle}
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>
                  {featureSection.layout === 'image_left' && featureSection.content.subtitle}
                </span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8">
                  {featureSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B]">
                    {featureSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md">
                  {featureSection.content.description}
                </p>
                <Link
                  href={featureSection.content.cta?.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  {featureSection.layout !== 'image_left' && (
                    <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </span>
                  )}
                  <span>{featureSection.content.cta?.text}</span>
                  {featureSection.layout === 'image_left' && (
                    <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Link>
              </div>

              <div className={`order-2 lg:col-span-6 relative group ${featureSection.layout === 'image_left' ? 'lg:order-1 lg:col-start-1' : 'lg:order-2 lg:col-start-7'}`}>
                <div className="relative w-full overflow-hidden rounded-sm shadow-sm">
                  <Image
                    src={featureSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={featureSection.content.image?.alt || "Feature Image"}
                    width={1000}
                    height={1000}
                    className="w-full h-auto transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                </div>
              </div>
            </div>
          )}

          {/* --- BRAND STORY SECTION --- */}
          {brandSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              <div className={`order-2 lg:col-span-5 relative group ${brandSection.layout === 'image_right' ? 'lg:order-2 lg:col-start-8' : 'lg:order-1'}`}>
                <div className="relative w-full overflow-hidden rounded-sm shadow-sm">
                  <Image
                    src={brandSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={brandSection.content.image?.alt || "Brand Image"}
                    width={1000}
                    height={1000}
                    className="w-full h-auto transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                </div>
              </div>

              {/* Text (Right usually) */}
              <div className={`order-1 lg:col-span-6 flex flex-col items-center text-center ${brandSection.layout === 'image_right' ? 'lg:order-1 lg:items-end lg:text-right lg:col-start-1' : 'lg:order-2 lg:items-start lg:text-left lg:col-start-7'}`}>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>{" "}
                  {brandSection.content.subtitle}
                </span>
                <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
                  {brandSection.content.title.normal} <br />
                  <span className="italic font-light opacity-80 text-[#2B2B2B]">
                    {brandSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 max-w-md">
                  {brandSection.content.description}
                </p>
                <Link
                  href={brandSection.content.cta?.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  <span>{brandSection.content.cta?.text}</span>
                  <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
```

## ./app/product/[slug]/page.tsx
```tsx
import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/api";
import { ProductView } from "@/components/ProductView";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const products = await getAllProducts();
    const productIndex = products.findIndex((p) => p.slug === slug);
    const product = products[productIndex];

    if (!product) {
        notFound();
    }


    // We need to determine the collection slug. 
    // Ideally use the collectionKey from the product if available.
    const collectionSlug = product.collectionKey || product.category.toLowerCase().replace(/ /g, "-");

    return <ProductView product={product} collectionSlug={collectionSlug} />;
}

```

## ./app/projects/[slug]/page.tsx
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    MapPin,
    ArrowLeft,
    Share2,
    Loader2,
    Calendar,
    User,
    Briefcase,
    Layers
} from 'lucide-react';

interface ProjectDetail {
    id: number;
    slug: string;
    title: string;
    location: string;
    category: string;
    year: string;
    description: string;
    long_description?: string;
    image: string;
    gallery?: string[];
    architect?: string;
    client?: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slug, setSlug] = useState<string>('');

    // 1. Resolver params (Next.js 15)
    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
        };
        getParams();
    }, [params]);

    // 2. Fetch de datos
    useEffect(() => {
        if (!slug) return;

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not-found');
                        return;
                    }
                    throw new Error('Error fetching project');
                }
                const json = await res.json();
                setProject(json.data || json);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [slug]);

    const handleShare = async () => {
        if (navigator.share && project) {
            try {
                await navigator.share({
                    title: project.title,
                    text: project.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard');
        }
    };

    // --- Loading State (Skeleton) ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] animate-pulse">
                <div className="h-[60vh] bg-gray-200 w-full" />
                <div className="container mx-auto px-6 py-12 max-w-6xl">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                        </div>
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error === 'not-found' || !project) return notFound();

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <p className="text-red-500 mb-4 font-medium">Error loading project.</p>
                <Link href="/projects" className="text-[#6C7466] hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to projects
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] font-sans selection:bg-[#6C7466] selection:text-white">

            {/* --- HERO SECTION --- */}
            <div className="relative h-[60vh] lg:h-[70vh] w-full overflow-hidden bg-[#EBEBE8]">
                <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/90 via-[#2B2B2B]/30 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-0 left-0 w-full p-6 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-md text-white text-xs font-bold uppercase tracking-widest mb-4 border border-white/30">
                            {project.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight max-w-5xl drop-shadow-md">
                            {project.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-12 gap-12">

                    {/* COLUMNA IZQUIERDA: TEXTO CON ESTILO PROSE (8 COLS) */}
                    <div className="lg:col-span-8">

                        {/* Intro / Short Description en tamaño grande */}
                        <p className="text-xl md:text-2xl font-serif text-[#2B2B2B] leading-relaxed mb-10 border-l-4 border-[#6C7466] pl-6 py-1">
                            {project.description}
                        </p>

                        {/* 
                            MAGIA DEL TEXTO: Misma configuración que en Eventos 
                            para arreglar el HTML de la API 
                        */}
                        <article className="
                            prose prose-lg max-w-none
                            
                            // Títulos
                            prose-headings:font-serif prose-headings:text-[#2B2B2B]
                            prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:font-medium
                            
                            // Subtítulos estilizados (AIDA/PAS Style)
                            prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-[0.15em] prose-h3:text-[#6C7466] prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-sans
                            
                            // Cuerpo de texto
                            prose-p:text-[#2B2B2B]/85 prose-p:leading-[1.8] prose-p:font-light prose-p:mb-6
                            
                            // Negritas tipo resaltador
                            prose-strong:font-bold prose-strong:text-[#2B2B2B] prose-strong:bg-[#6C7466]/10 prose-strong:px-1 prose-strong:rounded-sm
                            
                            // Listas con bullets verdes
                            prose-ul:my-6 prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3
                            prose-li:pl-6 prose-li:relative prose-li:text-[#2B2B2B]/85
                            prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-[0.6em] prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:bg-[#6C7466] prose-li:before:rounded-full
                            
                            // Enlaces
                            prose-a:text-[#6C7466] prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#555]
                        ">
                            <div dangerouslySetInnerHTML={{ __html: project.long_description || '' }} />
                        </article>

                        {/* Gallery Grid */}
                        {project.gallery && project.gallery.length > 0 && (
                            <div className="border-t border-[#6C7466]/10 pt-16 mt-16">
                                <h3 className="text-2xl font-serif text-[#2B2B2B] mb-8 flex items-center gap-4">
                                    Project Gallery
                                    <span className="h-px flex-1 bg-[#6C7466]/10"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {project.gallery.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`relative rounded-xl overflow-hidden shadow-sm group bg-gray-100 ${idx === 0 ? 'md:col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Project view ${idx}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: SIDEBAR STICKY (4 COLS) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">

                            {/* Card de Ficha Técnica */}
                            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6C7466]/10">
                                <h2 className="text-xl font-serif text-[#2B2B2B] mb-6 border-b border-[#6C7466]/10 pb-4">
                                    Technical Sheet
                                </h2>

                                <div className="space-y-6">
                                    {/* Location */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Location</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.location}</p>
                                        </div>
                                    </div>

                                    {/* Year */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Year</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.year}</p>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Category</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.category}</p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-6 border-[#6C7466]/10" />

                                <div className="space-y-4">
                                    {project.architect && (
                                        <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                            <User className="w-4 h-4 text-[#6C7466]" />
                                            <span>Arq: <span className="text-[#2B2B2B] font-medium">{project.architect}</span></span>
                                        </div>
                                    )}
                                    {project.client && (
                                        <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                            <Briefcase className="w-4 h-4 text-[#6C7466]" />
                                            <span>Client: <span className="text-[#2B2B2B] font-medium">{project.client}</span></span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleShare}
                                    className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#FDFBF7] text-[#2B2B2B] border border-[#6C7466]/20 rounded-xl hover:bg-[#6C7466] hover:text-white hover:border-transparent transition-all duration-300 font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Project
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
```

## ./app/projects/page.tsx
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Project {
    id: number;
    slug: string;
    title: string;
    location: string;
    category: string;
    year: string;
    description: string;
    image: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) throw new Error('Error fetching projects');
                const json = await res.json();

                let projectsData = json.data || json;

                // Ensure slug exists
                projectsData = projectsData.map((p: any) => ({
                    ...p,
                    slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                }));

                setProjects(projectsData);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#6C7466] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-16 relative z-10">

                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <div className="flex items-center justify-center gap-2 text-[#6C7466] mb-4">
                        <span className="text-xs font-bold tracking-[0.25em] uppercase">
                            Portfolio
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] mb-6 tracking-tight leading-[0.9]">
                        Selected Projects
                    </h1>
                    <p className="text-base md:text-lg text-gray-600 leading-relaxed font-light">
                        Collaborations with visionary architects and interior designers to create bespoke spaces where nature acts as the ultimate centerpiece.
                    </p>
                </div>

                {/* Projects Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 max-w-7xl mx-auto">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.slug}`}
                            className="group cursor-pointer flex flex-col h-full block"
                        >

                            {/* Image Container */}
                            <div className="relative overflow-hidden rounded-2xl bg-[#EBEBE8] aspect-[4/5] mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">

                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />

                                {/* Overlay Effect */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />

                                {/* Floating 'View' Button */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 shadow-sm z-10">
                                    <ArrowUpRight className="w-5 h-5 text-[#6C7466]" />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col grow">
                                {/* Meta info row */}
                                <div className="flex justify-between items-center mb-3 border-b border-[#6C7466]/10 pb-3">
                                    <span className="text-xs font-bold tracking-widest text-[#6C7466]/60 uppercase">
                                        {project.category}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        {project.year}
                                    </span>
                                </div>

                                {/* Title & Desc */}
                                <h3 className="text-2xl font-serif font-medium text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors duration-300 mb-2">
                                    {project.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                    <MapPin className="w-3 h-3" />
                                    {project.location}
                                </div>

                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 group-hover:text-gray-700 transition-colors">
                                    {project.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 text-center">
                    <p className="text-xl font-serif text-[#6C7466] mb-6">Have a project in mind?</p>
                    <button className="px-8 py-3 bg-white border border-[#6C7466] text-[#6C7466] rounded-full hover:bg-[#6C7466] hover:text-white transition-all duration-300 uppercase text-xs tracking-[0.15em] font-bold">
                        Get in Touch
                    </button>
                </div>

            </div>
        </main>
    );
}
```

## ./app/success/page.tsx
```tsx
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [orderName, setOrderName] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('success'); // Assume success if no session_id (e.g. direct visit or dev)
            return;
        }

        // Call our internal API to confirm order and sync with Odoo
        fetch('/api/checkout/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOrderName(data.odoo_order);
                    setStatus('success');
                } else {
                    console.error("Sync failed:", data.error);
                    setStatus('error');
                }
            })
            .catch(err => {
                console.error("Sync error:", err);
                setStatus('error');
            });
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 text-[#6C7466] animate-spin mb-4" />
                <h1 className="text-2xl font-serif text-[#2B2B2B] mb-2">Finalizing your order...</h1>
                <p className="text-gray-500">Please do not close this window.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-8">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-serif text-[#2B2B2B] mb-4">Order Confirmed, but...</h1>
                <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                    Your payment was successful, but we encountered an issue syncing your order details.
                    Please contact support with your payment reference.
                </p>
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full">
                    <Link href="/contact">Contact Support</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6">Payment Successful!</h1>
            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                Thank you for your purchase. Your order {orderName ? `(${orderName})` : ''} has been confirmed and will be shipped shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                    <Link href="/">Return to Home</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-white h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                    <Link href="/projects">View Projects <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}

```

## ./app/the-brand/page.tsx
```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Star, ArrowDown, MapPin, Search, Diamond, Loader2 } from 'lucide-react';

export default function TheBrandPage() {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch de datos a la API
    useEffect(() => {
        const fetchContent = async () => {
            try {
                // CAMBIO AQUÍ: Usamos nuestra ruta interna en lugar de la externa
                const response = await fetch('/api/brand-content');

                if (!response.ok) throw new Error('Error al cargar los datos');

                const jsonData = await response.json();

                // Nota: Dependiendo de si tu proxy devuelve { data: {...} } o directo el objeto
                // Si la API de Odoo devuelve { "data": ... }, nuestro proxy devuelve lo mismo.
                // Así que mantenemos la lógica:
                if (jsonData.data) {
                    setContent(jsonData.data);
                } else {
                    // Fallback por si la estructura cambia
                    setContent(jsonData);
                }

            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    // Helper para asignar iconos según el índice del capítulo
    const getChapterIcon = (index: number) => {
        const icons = [
            <MapPin key="map" className="w-4 h-4" />,
            <Search key="search" className="w-4 h-4" />,
            <Diamond key="diamond" className="w-4 h-4" />
        ];
        return icons[index] || <Star className="w-4 h-4" />;
    };

    // 2. Estado de Carga
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#6C7466]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-serif italic tracking-widest">Loading Earth's Soul...</p>
                </div>
            </div>
        );
    }

    // 3. Estado de Error
    if (error || !content) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-900/50">
                <p>Error loading content. Please try again later.</p>
            </div>
        );
    }

    // Desestructuración para facilitar uso en el render
    const { hero, manifesto, chapters } = content;

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative selection:bg-[#6C7466] selection:text-white font-sans">

            {/* 1. Global Noise & Grid Lines (Architectural Feel) */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Líneas verticales sutiles */}
            <div className="fixed inset-0 container mx-auto px-6 border-l border-r border-[#6C7466]/5 pointer-events-none z-0 hidden md:block">
                <div className="absolute left-1/3 h-full w-px bg-[#6C7466]/5"></div>
                <div className="absolute left-2/3 h-full w-px bg-[#6C7466]/5"></div>
            </div>

            <div className="relative z-10">

                {/* 2. Hero Section: Editorial & Minimal */}
                <section className="pt-24 pb-12 md:pt-32 md:pb-16 container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-start justify-between border-b border-[#6C7466] pb-8">
                        <div className="md:w-1/3 mb-6 md:mb-0">
                            <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466]">
                                <span className="w-4 h-4 border border-[#6C7466] flex items-center justify-center rounded-full text-[8px]">
                                    {hero.number}
                                </span>
                                {hero.label}
                            </div>
                        </div>
                        <div className="md:w-2/3">
                            {/* Usamos dangerouslySetInnerHTML porque el título viene con etiquetas <p> y <br> desde la API */}
                            <div
                                className="text-4xl md:text-6xl lg:text-7xl font-serif leading-[0.9] text-[#6C7466] mix-blend-multiply [&>p>br]:block"
                                dangerouslySetInnerHTML={{ __html: hero.title }}
                            />
                        </div>
                    </div>
                </section>

                {/* 3. The Manifesto: Typography Focus */}
                <section className="container mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                        <div className="md:col-span-4 md:sticky md:top-32 h-fit">
                            <h2 className="text-xl md:text-2xl font-serif text-[#2B2B2B] leading-tight">
                                {manifesto.title}
                            </h2>
                            <div className="mt-8 flex items-center gap-2">
                                <div className="h-px w-12 bg-[#6C7466]"></div>
                                <Star className="w-4 h-4 text-[#6C7466]" />
                            </div>
                        </div>
                        <div className="md:col-span-8 md:col-start-6">
                            <p className="text-lg md:text-2xl font-light leading-relaxed text-[#2B2B2B]/80">
                                {manifesto.text}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. The Brand History: Renderizado Dinámico desde API */}
                <section className="border-t border-[#6C7466]/20 bg-[#FDFBF7]">
                    {/* Header de la sección */}
                    <div className="container mx-auto px-6 py-12 border-b border-[#6C7466]/10">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6C7466]">
                            Legacy & Timeline
                        </span>
                    </div>

                    {/* Loop de Capítulos obtenidos de la API */}
                    {chapters.map((chapter: any, index: number) => (
                        <div key={chapter.id || index} className="group border-b border-[#6C7466]/10 transition-colors duration-500 hover:bg-[#6C7466]/5">
                            <div className="container mx-auto px-6 py-20 md:py-32">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                                    {/* Columna Izquierda: Año y Metadatos */}
                                    <div className="md:col-span-3 md:sticky md:top-32">
                                        <span className="block text-6xl md:text-8xl font-serif text-[#6C7466]/20 group-hover:text-[#6C7466] transition-colors duration-500">
                                            {chapter.year}
                                        </span>
                                        <div className="mt-4 flex items-center gap-2 text-[#6C7466] text-xs tracking-widest uppercase font-bold">
                                            {getChapterIcon(index)}
                                            {chapter.subtitle}
                                        </div>
                                    </div>

                                    {/* Columna Central: Contenido Textual */}
                                    <div className="md:col-span-4 md:col-start-5 pt-4">
                                        <h3 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-6">
                                            {chapter.title}
                                        </h3>
                                        <p className="text-base md:text-lg leading-relaxed text-gray-600 font-light">
                                            {chapter.description}
                                        </p>
                                    </div>

                                    {/* Columna Derecha: Visual (Video o Imagen) */}
                                    <div className="md:col-span-4 md:col-start-9 mt-8 md:mt-0">
                                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 border border-[#6C7466]/20">

                                            {/* Lógica para diferenciar Video vs Imagen */}
                                            {chapter.media_type === 'video' ? (
                                                <video
                                                    src={chapter.video_url}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={chapter.image_url}
                                                    alt={chapter.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            )}

                                            {/* Decoración esquina */}
                                            <div className="absolute bottom-4 right-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <ArrowDown className="w-6 h-6 -rotate-45" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 5. Footer / Signature Section */}
                <section className="py-32 container mx-auto px-6 text-center">
                    <Star className="w-6 h-6 text-[#6C7466] mx-auto mb-8 animate-spin-slow" />
                    <h4 className="text-sm md:text-base tracking-[0.4em] uppercase text-[#6C7466] mb-2">
                        One of a Kind
                    </h4>
                    <p className="font-serif italic text-2xl text-[#2B2B2B]/40">
                        {content.hero.subtitle}
                    </p>
                </section>

            </div>
        </main>
    );
}
```

## ./components.json
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}

```

## ./components/Footer.tsx
```tsx
// components/footer.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFooterData } from "@/hooks/useFooterData"

export function Footer() {
  const { footerData, loading, subscribeEmail } = useFooterData()
  const [email, setEmail] = React.useState("")
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = React.useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubscriptionStatus('loading')
    try {
      await subscribeEmail(email)
      setSubscriptionStatus('success')
      setMessage("Thank you for subscribing!")
      setEmail("")
      setTimeout(() => {
        setSubscriptionStatus('idle')
        setMessage("")
      }, 3000)
    } catch (err: any) {
      setSubscriptionStatus('error')
      setMessage(err.message)
      setTimeout(() => {
        setSubscriptionStatus('idle')
        setMessage("")
      }, 3000)
    }
  }

  if (loading) {
    return (
      <footer className="bg-[#F5F3F0] border-t border-[#6C7466]/10 py-20">
        <div className="flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6C7466]" />
        </div>
      </footer>
    )
  }

  if (!footerData) return null

  return (
    <footer className="bg-[#F5F3F0] border-t border-[#6C7466]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Main Footer Content */}
        <div className="py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 xl:gap-16">

            {/* Company Info */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-base sm:text-lg tracking-wider">
                {footerData.brandName}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed max-w-xs">
                {footerData.tagline}
              </p>
              <div className="flex items-center gap-3 pt-2">
                {footerData.social?.facebook && (
                  <Link
                    href={footerData.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
                {footerData.social?.instagram && (
                  <Link
                    href={footerData.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
                {footerData.social?.email && (
                  <Link
                    href={footerData.social.email}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Email"
                  >
                    <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {footerData.quickLinks?.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {footerData.quickLinks?.links?.map((link: any) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#6C7466]/70 hover:text-[#6C7466] text-sm sm:text-base transition-colors duration-200 inline-block hover:translate-x-1 transform"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {footerData.legalLinks?.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {footerData.legalLinks?.links?.map((link: any) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#6C7466]/70 hover:text-[#6C7466] text-sm sm:text-base transition-colors duration-200 inline-block hover:translate-x-1 transform"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {footerData.newsletter?.title}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed">
                {footerData.newsletter?.description}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder={footerData.newsletter?.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-[#6C7466]/20 text-[#6C7466] placeholder:text-[#6C7466]/40 focus:border-[#6C7466] focus:ring-[#6C7466]/20 h-11 sm:h-12 text-sm sm:text-base"
                  required
                  disabled={subscriptionStatus === 'loading' || subscriptionStatus === 'success'}
                />
                <Button
                  type="submit"
                  disabled={subscriptionStatus === 'loading' || subscriptionStatus === 'success'}
                  className={cn(
                    "w-full transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base font-medium",
                    subscriptionStatus === 'success'
                      ? "bg-green-600 hover:bg-green-700"
                      : subscriptionStatus === 'error'
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[#6C7466] hover:bg-[#6C7466]/90"
                  )}
                >
                  {subscriptionStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : subscriptionStatus === 'success' ? (
                    "Subscribed!"
                  ) : subscriptionStatus === 'error' ? (
                    "Error"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
                {message && (
                  <p className={cn("text-xs mt-2", subscriptionStatus === 'error' ? "text-red-500" : "text-green-600")}>
                    {message}
                  </p>
                )}
              </form>
              <p className="text-[#6C7466]/50 text-xs sm:text-sm leading-relaxed">
                {footerData.newsletter?.privacyText}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="border-t border-[#6C7466]/10 py-6 sm:py-7 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
            {footerData.contact?.location && (
              <div className="flex items-center gap-2 text-[#6C7466]/70 group">
                <MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 group-hover:text-[#6C7466] transition-colors" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.location}</span>
              </div>
            )}
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            {footerData.contact?.phone && (
              <Link
                href={`tel:${footerData.contact.phone}`}
                className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
              >
                <Phone className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.phone}</span>
              </Link>
            )}
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            {footerData.contact?.email && (
              <Link
                href={`mailto:${footerData.contact.email}`}
                className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
              >
                <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.email}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#6C7466]/10 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[#6C7466]/60 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} {footerData.bottom?.copyright}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              {footerData.bottom?.links?.map((link: any, index: number) => (
                <React.Fragment key={link.href}>
                  {index > 0 && <span className="text-[#6C7466]/30 text-xs">•</span>}
                  <Link
                    href={link.href}
                    className="text-[#6C7466]/60 hover:text-[#6C7466] text-xs sm:text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

## ./components/Navbar.tsx
```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingCart, Search, Menu, X, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useCart } from "@/context/cart-context"

const topBarLinks = [
  { name: "SHOP", href: "#", hasMenu: true },
  { name: "THE BRAND", href: "/the-brand", hasMenu: false },
  { name: "CRAFT STORIES", href: "/craft-stories", hasMenu: false },
  { name: "NEWS & EVENTS", href: "/news-events", hasMenu: false },
  { name: "PROJECTS", href: "/projects", hasMenu: false },
]

// Definimos la interfaz. Agregamos _parentKey opcional para uso interno durante el armado
interface CollectionMenuItem {
  name: string;
  href: string;
  items: CollectionMenuItem[]; // Permitimos anidación recursiva
  _parentKey?: string | null;  // Temporal para lógica de armado
}

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isShopMenuOpen, setIsShopMenuOpen] = React.useState(false)
  const [isShopPanelOpen, setIsShopPanelOpen] = React.useState(false)
  
  const [collections, setCollections] = React.useState<CollectionMenuItem[]>([])
  const [selectedCollection, setSelectedCollection] = React.useState<CollectionMenuItem | null>(null)
  
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)
  const pathname = usePathname()
  const { cartCount, toggleCart } = useCart()
  const shopMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // --- LÓGICA DE FETCH Y ANIDACIÓN AUTOMÁTICA ---
  React.useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('https://erp.oneofakind.com.mx/api/collections_data');
        if (!res.ok) throw new Error('Error fetching menu');
        const data = await res.json();

        // 1. Crear un mapa plano de todos los nodos (items del menú)
        //    Esto nos permite buscar padres rápidamente por su 'key'.
        const nodesMap: Record<string, CollectionMenuItem> = {};

        Object.entries(data).forEach(([key, value]: [string, any]) => {
            nodesMap[key] = {
                name: value.title ? value.title.toUpperCase() : key.toUpperCase().replace(/_/g, " "),
                // Por defecto url base, luego la ajustaremos si es hijo
                href: `/collections/${key}`, 
                items: [],
                _parentKey: value.parent // Guardamos quien es el padre (ej: "alloys")
            };
        });

        // 2. Construir el árbol (Tree)
        const tree: CollectionMenuItem[] = [];

        Object.keys(nodesMap).forEach((key) => {
            const node = nodesMap[key];
            const parentKey = node._parentKey;

            if (parentKey && nodesMap[parentKey]) {
                // ES UN HIJO:
                // 1. Ajustamos su URL para que sea /collections/padre/hijo
                node.href = `/collections/${parentKey}/${key}`;
                
                // 2. Lo metemos dentro del array 'items' del padre
                nodesMap[parentKey].items.push(node);
            } else {
                // ES UN PADRE (RAÍZ) o huérfano:
                tree.push(node);
            }
        });

        // 3. Ordenar alfabéticamente los padres
        tree.sort((a, b) => a.name.localeCompare(b.name));

        // 4. Ordenar alfabéticamente los hijos dentro de cada padre
        tree.forEach(root => {
            if (root.items.length > 0) {
                root.items.sort((a, b) => a.name.localeCompare(b.name));
            }
        });

        setCollections(tree);
      } catch (error) {
        console.error("Failed to load collections for navbar", error);
      }
    };

    fetchCollections();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleShopMouseEnter = () => {
    if (shopMenuTimeoutRef.current) {
      clearTimeout(shopMenuTimeoutRef.current)
    }
    setIsShopMenuOpen(true)
  }

  const handleShopMouseLeave = () => {
    shopMenuTimeoutRef.current = setTimeout(() => {
      setIsShopMenuOpen(false)
    }, 200)
  }

  const handleShopClick = () => {
    setIsShopPanelOpen(true)
    setSelectedCollection(null)
  }

  const showCompactNav = isScrolled && !isHovering
  const smoothTransition = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu backface-invisible"

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-[#6C7466]/95",
        "will-change-[background-color,backdrop-filter]",
        smoothTransition
      )}
      style={{ backgroundColor: '#6C7466' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo grande colapsable */}
      <div
        className={cn(
          "hidden lg:block border-b border-white/15 overflow-hidden py-6",
          "will-change-[max-height,opacity]",
          smoothTransition,
          showCompactNav
            ? "max-h-0 opacity-0 border-none py-0"
            : "max-h-40 opacity-100"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={490}
                height={290}
                className="h-24 w-auto"
                priority
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de navegación principal */}
      <div className="hidden lg:block border-b border-white/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between",
            "will-change-[height]",
            smoothTransition,
            showCompactNav ? "h-14" : "h-20"
          )}>
            {/* Logo compacto */}
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8 pointer-events-none"
            )}>
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="OOAK Logo"
                  width={490}
                  height={290}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Enlaces de navegación */}
            <nav className={cn(
              "flex items-center justify-center gap-8 flex-1",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-0 -translate-y-4 pointer-events-none"
                : "opacity-100 translate-y-0"
            )}>
              {topBarLinks.map((link) => (
                <div key={link.name} className="relative">
                  {link.hasMenu ? (
                    <button
                      onClick={handleShopClick}
                      className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Iconos Derecha */}
            <div className={cn(
              "flex items-center gap-2 justify-end",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-0 translate-x-8 pointer-events-none"
                : "opacity-100 translate-x-0"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/10 hover:text-white h-10 w-10"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel SHOP */}
      <Sheet open={isShopPanelOpen} onOpenChange={setIsShopPanelOpen}>
        <SheetContent
          side="left"
          className="w-full sm:w-[400px] overflow-y-auto p-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            backgroundColor: '#6C7466',
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="p-6">
            <SheetTitle className="text-white text-xl font-bold mb-6">
              SHOP
            </SheetTitle>

            <nav className="flex flex-col gap-2">
              {collections.length === 0 && (
                <div className="text-white/50 text-sm animate-pulse">Loading collections...</div>
              )}

              {collections.map((collection) => (
                <div key={collection.name}>
                  <button
                    onClick={() => {
                      if (collection.items && collection.items.length > 0) {
                        setSelectedCollection(
                          selectedCollection?.name === collection.name ? null : collection
                        )
                      } else {
                        window.location.href = collection.href
                        setIsShopPanelOpen(false)
                      }
                    }}
                    className="flex items-center justify-between w-full text-left py-4 px-4 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors border-b border-white/10"
                  >
                    <span className="font-semibold tracking-wide">
                      {collection.name}
                    </span>
                    {collection.items && collection.items.length > 0 && (
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                          selectedCollection?.name === collection.name && "rotate-90"
                        )}
                      />
                    )}
                  </button>

                  <div className={cn(
                    "grid transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[grid-template-rows]",
                    selectedCollection?.name === collection.name && collection.items.length > 0
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden">
                      <div className="ml-4 mt-2 space-y-1 pb-2">
                        <Link
                          href={collection.href}
                          onClick={() => setIsShopPanelOpen(false)}
                          className="block py-3 px-4 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          VIEW ALL
                        </Link>
                        {collection.items.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsShopPanelOpen(false)}
                            className="block py-3 px-4 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* MÓVIL */}
      <nav className="lg:hidden container mx-auto px-4 sm:px-6">
        <div className="flex h-[84px] sm:h-[104px] items-center justify-between">
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] sm:w-[400px] overflow-y-auto p-6"
                style={{
                  backgroundColor: '#6C7466',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <SheetTitle className="text-white text-xl font-bold mb-6">
                  MENU
                </SheetTitle>
                <nav className="flex flex-col gap-3">
                  {topBarLinks.map((link) => (
                    link.hasMenu ? (
                      <button
                        key={link.name}
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsShopPanelOpen(true)
                        }}
                        className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider py-3 px-3 hover:bg-white/10 rounded-md text-left"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider py-3 px-3 hover:bg-white/10 rounded-md"
                      >
                        {link.name}
                      </Link>
                    )
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={490}
                height={290}
                className="h-[62px] sm:h-[72px] w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-white/10 hover:text-white h-10 w-10"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {cartCount}
                </Badge>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      {isSearchOpen && (
        <div
          className={cn(
            "border-t border-white/20 overflow-hidden",
            "will-change-[max-height,opacity]",
            smoothTransition,
            isSearchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          )}
          style={{ backgroundColor: '#6C7466' }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50 h-10"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(false)}
                className="text-white hover:bg-white/10 hover:text-white h-9 w-9 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
```

## ./components/ProductGrid.tsx
```tsx
"use client";
import * as React from "react";
import Image from "next/image";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Star,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { products, Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

// ========================================
// 🧩 MAIN COMPONENT
// ========================================
export function ProductGrid({ products: propProducts }: { products?: Product[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Use passed products or fallback to empty array (or static if we wanted, but let's prefer props)
  const displayProducts = propProducts || products;

  const currentPage = Number(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);

  const currentProducts = displayProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (pageNumber: number) => {
    replace(createPageURL(pageNumber));
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#FDFBF7] text-[#2B2B2B] overflow-hidden selection:bg-[#6C7466] selection:text-white">
      {/* Background Atmosphere */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />
      <div className="hidden md:block absolute top-0 left-12 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden md:block absolute top-0 right-12 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Gallery */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-16 md:pl-12">
          {currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-24 flex justify-center items-center gap-8 md:pl-12">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#6C7466] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#2B2B2B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-xs font-serif transition-all duration-300 rounded-full",
                    currentPage === page ? "bg-[#6C7466] text-white" : "text-gray-400 hover:text-[#6C7466]"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#6C7466] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#2B2B2B] transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ========================================
// 🎨 PRODUCT CARD
// ========================================
function ProductCard({
  product,
}: {
  product: Product;
}) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { addItem } = useCart();

  return (
    <Link href={`/product/${product.slug}`} className="group cursor-pointer flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EBEBE8] rounded-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={product.featured}
        />
        <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {product.featured && <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">Featured</span>}
          {product.inStock && <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">In Stock</span>}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 delay-75",
            isFavorite ? "bg-red-500 text-white" : "bg-white text-[#6C7466] hover:bg-[#6C7466] hover:text-white"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(product);
          }}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#6C7466] shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#6C7466] hover:text-white"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 leading-none">
          {product.category}
        </span>
        <h3 className="text-sm md:text-lg font-serif text-[#2B2B2B] leading-tight group-hover:text-[#6C7466] transition-colors duration-300">
          {product.name}
        </h3>
        <span className="text-xs md:text-sm font-medium text-[#2B2B2B]">
          ${product.price.toLocaleString("en-US")}
        </span>
      </div>
    </Link>
  );
}
```

## ./components/ProductView.tsx
```tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    X,
    Package,
    TruckIcon,
    ShieldCheck,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

interface ProductViewProps {
    product: Product;
    collectionSlug?: string;
}

export function ProductView({ product, collectionSlug }: ProductViewProps) {
    const { addItem } = useCart();
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<"measurements" | "shipping">("measurements");
    const [showMoreDescription, setShowMoreDescription] = React.useState(false);


    const images = product.images || [product.image];

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
            {/* Floating Close Button (Back to Home) */}
            {/* Floating Close Button (Back) */}
            {/* Floating Close Button (Back) */}
            <Link
                href={collectionSlug ? `/collections/${collectionSlug}` : "/"}
                className="fixed top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-md shadow-sm"
            >
                <X className="w-5 h-5 text-[#2B2B2B]" strokeWidth={1.5} />
            </Link>

            {/* LEFT SIDE: Image Gallery */}
            <div className="relative w-full md:w-[55%] lg:w-[60%] shrink-0 bg-[#EBEBE8] overflow-hidden group h-[50vh] md:h-screen sticky top-0">
                {/* Navigation Buttons */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/40 backdrop-blur-md rounded-full hover:bg-white text-[#2B2B2B] shadow-sm transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/40 backdrop-blur-md rounded-full hover:bg-white text-[#2B2B2B] shadow-sm transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </>
                )}

                {/* Image Container */}
                <div className="w-full h-full relative flex items-center justify-center p-8 bg-[#EBEBE8]">
                    <Image
                        src={images[selectedImageIndex]}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 60vw"
                        priority
                    />
                </div>

                {/* Thumbnails */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 bg-white/30 backdrop-blur-md rounded-full z-20">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                selectedImageIndex === index ? "bg-[#2B2B2B] scale-150" : "bg-white/80 hover:bg-white"
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: Details */}
            <div className="flex-1 w-full md:w-[45%] lg:w-[40%] flex flex-col min-h-screen bg-[#FDFBF7]">

                {/* Scrollable Content Area */}
                <div className="flex-1 p-6 md:p-8 lg:p-12 pb-32"> {/* Added pb-32 for footer space */}

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <Link href="/" className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-gray-400 hover:text-[#6C7466] uppercase transition-colors">
                            Home
                        </Link>
                        <span className="h-px w-4 bg-[#6C7466]/30"></span>
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase truncate">
                            {product.category}
                        </span>
                    </div>

                    {/* Header Info */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2B2B2B] mb-2 md:mb-4 leading-[1.1]">
                        {product.name}
                    </h1>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#6C7466] mb-6 md:mb-8">
                        ${product.price.toLocaleString("en-US")} <span className="text-xs text-gray-400">MXN</span>
                    </p>

                    {/* Description */}
                    <div className="mb-8 text-gray-500 font-light leading-relaxed text-sm md:text-base">
                        <div className="prose prose-sm max-w-none text-gray-500">
                            <div dangerouslySetInnerHTML={{
                                __html: showMoreDescription
                                    ? (product.longDescription || product.description || "")
                                    : (product.shortDescription || (product.description?.substring(0, 180) + "...") || "")
                            }} />
                        </div>
                        {(product.longDescription || (product.description && product.description.length > 180)) && (
                            <button
                                onClick={() => setShowMoreDescription(!showMoreDescription)}
                                className="text-[#6C7466] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2 hover:text-[#2B2B2B] transition-colors"
                            >
                                {showMoreDescription ? "Read Less" : "Read More"}
                                <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreDescription && "rotate-90")} />
                            </button>
                        )}
                    </div>

                    <div className="border-t border-b border-[#6C7466]/10 py-4 md:py-6 mb-6">
                        <div className="flex gap-6 mb-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {["measurements", "shipping"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={cn(
                                        "text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap pb-1 border-b-2",
                                        activeTab === tab ? "text-[#2B2B2B] border-[#2B2B2B]" : "text-gray-400 border-transparent hover:text-[#2B2B2B]"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[80px]">
                            {activeTab === "measurements" && (
                                <div className="grid grid-cols-2 gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                    <div><span className="block text-[10px] text-gray-400 uppercase">Dimensions</span><span className="text-[#2B2B2B]">{product.dimensions?.height} x {product.dimensions?.width} x {product.dimensions?.depth}</span></div>
                                    {product.dimensions?.weight && parseFloat(String(product.dimensions.weight)) !== 0 && !isNaN(parseFloat(String(product.dimensions.weight))) && (
                                        <div><span className="block text-[10px] text-gray-400 uppercase">Weight</span><span className="text-[#2B2B2B]">{product.dimensions.weight}</span></div>
                                    )}
                                    <div className="col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Material</span><span className="text-[#2B2B2B]">{product.material}</span></div>
                                </div>
                            )}
                            {activeTab === "shipping" && (
                                <div className="space-y-2 text-sm text-gray-500 font-light animate-in fade-in slide-in-from-left-2 duration-300">
                                    <p className="flex items-center gap-2"><TruckIcon className="w-3.5 h-3.5 text-[#6C7466]" /> CDMX: 2-3 days</p>
                                    <p className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-[#6C7466]" /> National: 3-5 days</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Fixed at bottom right on desktop, fixed bottom on mobile) */}
                <div className="p-6 md:p-8 lg:p-10 border-t border-[#6C7466]/10 bg-[#FDFBF7] shrink-0 sticky bottom-0 z-40">
                    <Button
                        onClick={() => addItem(product)}
                        className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] transition-colors h-12 md:h-14 rounded-none text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-3"
                    >
                        Add to Cart — ${product.price.toLocaleString("en-US")}
                    </Button>
                    <div className="flex justify-center items-center gap-3 text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
                        <span>•</span>
                        <span>Worldwide Shipping</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## ./components/brand-story.tsx
```tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export function BrandStory() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">
      
      {/* 1. Background Grain & Lines (Consistencia Visual) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
      />
      {/* Línea vertical decorativa */}
      <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#6C7466]/10 -translate-x-1/2 z-0" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* 2. Columna Imagen: Estilo Marco de Galería */}
          <div className="order-2 lg:order-1 relative group">
            <div className="relative w-full overflow-hidden rounded-sm">
              <Image
                src="/producto3.png" // Asegúrate que esta ruta sea correcta en tu carpeta public
                alt="Curated crystal collection"
                width={1000}
                height={1000}
                className="w-full h-auto transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply pointer-events-none" />
            </div>
          </div>

          {/* 3. Columna Texto: Estilo Editorial */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="h-px w-8 bg-[#6C7466]"></span>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase">
                    Our Philosophy
                </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
              Unearthing <br />
              <span className="italic font-light opacity-80 text-[#2B2B2B]">The Extraordinary.</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed font-light mb-8 max-w-md mx-auto lg:mx-0">
              One of a Kind unveils unique masterpieces of nature that tell millennial stories. Every mineral, gem, and fossil is authentic and meticulously selected, offering a tangible connection to the Earth's fascinating geological history.
            </p>

            <div className="flex justify-center lg:justify-start">
              <Link
                href="/the-brand"
                className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
              >
                Read our story
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
```

## ./components/cart-sidebar.tsx
```tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

export function CartSidebar() {
    const { items, isCartOpen, toggleCart, removeItem, updateQuantity, cartTotal } = useCart();

    return (
        <Sheet open={isCartOpen} onOpenChange={toggleCart}>
            <SheetContent className="w-full sm:max-w-md flex flex-col bg-[#FDFBF7] border-l border-[#6C7466]/10 p-0">
                <SheetHeader className="px-6 py-4 border-b border-[#6C7466]/10 flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="text-lg font-serif text-[#2B2B2B] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#6C7466]" />
                        Your Cart
                    </SheetTitle>
                    {/* Close button is handled by Sheet primitive, but we can add custom if needed */}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                            <ShoppingBag className="w-12 h-12 text-[#6C7466]" strokeWidth={1} />
                            <p className="text-sm font-light text-[#2B2B2B]">Your cart is empty</p>
                            <Button
                                variant="outline"
                                onClick={toggleCart}
                                className="border-[#6C7466] text-[#6C7466] hover:bg-[#6C7466] hover:text-white"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="relative w-20 h-24 bg-[#EBEBE8] shrink-0 rounded-sm overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-sm font-medium text-[#2B2B2B] line-clamp-2 leading-tight">
                                                    {item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center border border-[#6C7466]/20 rounded-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 hover:bg-[#6C7466]/5 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3 text-[#6C7466]" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-medium text-[#2B2B2B]">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-[#6C7466]/5 transition-colors"
                                                >
                                                    <Plus className="w-3 h-3 text-[#6C7466]" />
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-[#2B2B2B]">
                                                ${(item.price * item.quantity).toLocaleString("en-US")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-[#6C7466]/10 bg-[#FDFBF7] space-y-4">
                        <div className="flex justify-between items-center text-lg font-serif text-[#2B2B2B]">
                            <span>Subtotal</span>
                            <span>${cartTotal.toLocaleString("en-US")}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
                            Shipping & taxes calculated at checkout
                        </p>
                        <div className="grid gap-3">
                            <Button
                                asChild
                                className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase"
                                onClick={toggleCart}
                            >
                                <Link href="/checkout">Checkout</Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-[#6C7466]/20 text-[#6C7466] hover:bg-[#6C7466]/5 h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase"
                                onClick={toggleCart}
                            >
                                <Link href="/cart">View Cart</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

```

## ./components/feature-section.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface FeatureSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaText: string;
  href?: string; // Agregué esto para que el link sea funcional
  reverse?: boolean;
}

export function FeatureSection({
  title,
  description,
  imageSrc,
  imageAlt,
  ctaText,
  href = "#",
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">
      
      {/* 1. Background Grain (Textura de papel/film) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
      />

      {/* Líneas Arquitectónicas Verticales */}
      <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          
          {/* 
             2. Lógica de Reversión vía CSS Grid 
             Si es reverse: La imagen va a la col-start-8 (derecha) y el texto a la izquierda.
             Si no es reverse: La imagen va a la col-span-5 (izquierda) y el texto a la derecha.
          */}
          
          {/* --- COLUMNA IMAGEN --- */}
          <div className={`relative group ${reverse ? "lg:col-span-6 lg:col-start-7 lg:order-2" : "lg:col-span-5 lg:order-1"}`}>
            <div className="relative w-full overflow-hidden rounded-sm shadow-sm">
              <Image 
                src={imageSrc || "/placeholder.svg"} 
                alt={imageAlt} 
                width={1000}
                height={1000}
                className="w-full h-auto transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Filtro sutil para unificar tono */}
              <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
            </div>
          </div>

          {/* --- COLUMNA TEXTO --- */}
          <div className={`flex flex-col justify-center ${reverse ? "lg:col-span-5 lg:col-start-1 lg:order-1 lg:text-right lg:items-end" : "lg:col-span-6 lg:col-start-7 lg:order-2 lg:text-left lg:items-start"}`}>
            
            {/* Tag decorativo */}
            <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
               {!reverse && <span className="w-8 h-px bg-[#6C7466]/40"></span>}
               Featured Story
               {reverse && <span className="w-8 h-px bg-[#6C7466]/40"></span>}
            </span>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8">
              {title}
            </h2>
            
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md">
              {description}
            </p>

            <Link
              href={href}
              className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
            >
              {reverse && (
                 <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                 </span>
              )}
              
              <span>{ctaText}</span>

              {!reverse && (
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
```

## ./components/hero-section.tsx
```tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-28 md:pb-20 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">

      {/* 1. Background Atmosphere (Noise & Lines) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />

      {/* Línea arquitectónica asimétrica */}
      <div className="hidden md:block absolute top-0 right-1/3 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* --- COLUMNA IMAGEN (Hero Visual) --- */}
          <div className="order-2 lg:order-1 lg:col-span-7 relative group">

            {/* Texto de fondo decorativo (Parallax Effect simulado) */}
            <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
              JASPER
            </div>

            {/* Contenedor de Imagen */}
            <div className="relative w-full overflow-hidden rounded-sm shadow-sm z-10">
              <Image
                src="/producto5.png"
                alt="Polished Landscape Jasper - Luxury Object"
                width={1200}
                height={1200}
                className="w-full h-auto transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority // Carga prioritaria por ser Hero
              />

              {/* Overlay suave al hover */}
              <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
          </div>

          {/* --- COLUMNA TEXTO (Product Story) --- */}
          <div className="order-1 lg:order-2 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left">

            {/* Pre-header */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="h-px w-6 bg-[#6C7466]"></span>
              <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                The November Edit
              </p>
            </div>

            {/* Title Monumental */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
              Polished <br />
              <span className="italic font-light text-[#2B2B2B] opacity-80">Landscape Jasper.</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes. A study in contrast, light, and modern nature.
            </p>

            {/* CTA High-End */}
            <div className="flex justify-center lg:justify-start">
              <Link href="/product/prod-5" className="group relative inline-flex items-center gap-4">
                {/* Circle Button */}
                <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                </div>

                {/* Text Label */}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">
                    Shop Now
                  </span>
                  <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                    Limited Availability
                  </span>
                </div>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
```

## ./components/navigation.tsx
```tsx
import Link from "next/link"
import { ShoppingCart } from "lucide-react"

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-sm tracking-widest font-medium">
              {"TIENDA"}
            </Link>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <div className="text-center">
              <div className="text-xl tracking-widest font-semibold">{"REFLECTIONS"}</div>
              <div className="text-[10px] tracking-[0.3em]">{"COPENHAGEN"}</div>
            </div>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/the-brand" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"LA MARCA"}
            </Link>
            <Link href="/events" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"EVENTOS"}
            </Link>
            <Link href="/bespoke" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"BESPOKE"}
            </Link>
            <Link href="/cart" className="hover:opacity-70 transition-opacity">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

```

## ./components/ui/accordion.tsx
```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

```

## ./components/ui/badge.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

```

## ./components/ui/button.tsx
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

```

## ./components/ui/dialog.tsx
```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}

```

## ./components/ui/dropdown-menu.tsx
```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}

```

## ./components/ui/input.tsx
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

```

## ./components/ui/navigation-menu.tsx
```tsx
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1"
)

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        "absolute top-full left-0 isolate z-50 flex justify-center"
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
}

```

## ./components/ui/sheet.tsx
```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

```

## ./context/cart-context.tsx
```tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/products";

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addItem = (product: Product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const cartTotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isCartOpen,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                toggleCart,
                cartTotal,
                cartCount,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

```

## ./data/collections.json
```json
{
  "earth": "Formed by time itself, the Earth Collection brings together nature’s most extraordinary creations, each shaped over millions of years. This curated assortment celebrates the raw beauty, history, and artistry found beneath the surface of our planet. Every piece is unique and full of character. Whether used for décor, collecting, or inspiring connection to the natural world, the Collection offers timeless elements that ground any space with depth, authenticity, and organic elegance.",
  "mineral specimens": "Discover the raw beauty of the earth through our curated collection of natural minerals and stones. Each piece is hand-selected for its unique colors, textures, and formations—showcasing the incredible artistry created by nature over millions of years. From vibrant crystals to polished freeforms and rare mineral specimens, every stone carries its own story and energy.\n\nPerfect for décor lovers, collectors, and those who appreciate organic elegance, this collection celebrates authenticity, natural detail, and one-of-a-kind beauty. Bring timeless earth elements into your space with stones that elevate, inspire, and connect you to nature’s quiet power.",
  "fossils": "Step into the ancient world with our Fossil Collection, a curated selection of natural wonders formed over millions of years. From spiraled ammonites to striking septarian nodules and other geological relics, each piece carries the story of Earth’s earliest life and shifting landscapes.\n\nRich in texture, pattern, and history, these fossils make captivating décor accents and meaningful collector’s items. Their organic shapes and timeless beauty add depth, character, and a sense of discovery to any space.\n\nCelebrate nature’s past through fossils that inspire, educate, and bring prehistoric artistry into the modern home.",
  "alloy": "Celebrate the bold beauty of metal transformed into art with our Alloy Collection. Crafted from durable, high-quality alloys, these sculptures are designed to make a statement. Each piece blends strength with creativity, featuring striking lines, fluid shapes, and imaginative forms that elevate any space.\n\nFrom large outdoor installations to smaller indoor accents, each sculpture blends artistry with craftsmanship. Weather-resistant and visually striking, they bring modern elegance and sculptural impact to any space.\n\nDiscover metal reimagined: expressive, enduring, and artfully engineered.",
  "crystal": "Crystal Collection \n\nBorn from craftsmanship and clarity, the collection presents sculptural crystal pieces that enhance any space. Inspired by architectural lines and modern glamour, each item is crafted to capture and reflect light with striking brilliance.\n\nBold geometric forms, refined edges, and vibrant colors make every piece a functional work of art. Whether displayed as a centerpiece or used in everyday rituals, these crystal creations bring sophistication, sparkle, and timeless elegance to any space.\n\nExplore a collection where design meets radiance — crystal décor that transforms light, ambiance, and the feel of your home.",
  "ocean": "Dive into the Ocean Collection, where corals, shells, and rare marine treasures reveal the raw beauty of the sea. Each piece showcases natural textures, intricate patterns, and sculptural forms shaped by the ocean itself. From striking corals to exotic shells, this collection brings coastal elegance and the timeless magic of underwater worlds into any space.Bring a touch of the sea’s magic into your home with nature’s own ocean-born masterpieces.",
  "heritage": "Where history becomes art, the Heritage Collection brings together ancient vessels, rare forms, and modern handcrafted décor. Every piece is unique, chosen for its story, texture, and enduring elegance, offering a refined balance of heritage and contemporary style.",
  "lumen": "A tribute to timeless radiance, the Lumen Collection reimagines the power of light as a form of art. Each piece is designed to shape atmosphere, sculpt shadows, and bring depth and dimension to any space. With a focus on refined materials, thoughtful craftsmanship, and expressive silhouettes, this collection transforms illumination into an experience—one that enhances architecture, elevates mood, and creates a sense of warmth and modern sophistication. More than functional design, Lumen is a celebration of light as a living, breathing element within contemporary interiors.",
  "serenity": "Embrace the calming presence of natural textures and flowing forms with our Serenity Collection.  Inspired by stillness and organic beauty, each piece is designed to bring balance, grounding, and quiet elegance into any space. With soft stone finishes, soothing silhouettes, and an earth-rooted aesthetic, this collection creates peaceful environments that invite reflection, relaxation, and a sense of harmonious living."
}
```

## ./docker-compose.yml
```yml
version: "3.9"

services:
  nextapp:
    container_name: next15-prod_local
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
    ports:
      - "2025:3000"
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
    networks:
      - webnet

networks:
  webnet:
    driver: bridge

```

## ./eslint.config.mjs
```mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

```

## ./hooks/useFooterData.ts
```ts
import { useState, useEffect } from 'react';

const API_URL = '';

export function useFooterData() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/footer/content`)
            .then((res) => res.json())
            .then((json) => {
                if (json.status === 200) {
                    setData(json.data);
                }
            })
            .catch((err) => console.error("Error fetching footer CMS:", err))
            .finally(() => setLoading(false));
    }, []);

    const subscribeEmail = async (email: string) => {
        try {
            const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();

            if (json.status !== 200) throw new Error(json.error);
            return true;
        } catch (error: any) {
            throw new Error(error.message || "Error al suscribirse");
        }
    };

    return { footerData: data, loading, subscribeEmail };
}

```

## ./lib/api.ts
```ts
import { Product } from "./products";

// ... existing imports ...

const API_URL = "https://erp.oneofakind.com.mx/api/collections_data";
const API_COLLECTION_URL = "https://erp.oneofakind.com.mx/api/collection";

export interface ApiProduct {
    id: number;
    name: string;
    slug: string;
    image: string;
}

export interface ApiProductDetail {
    id: number;
    name: string;
    slug: string;
    price: number;
    currency: string;
    short_description: string;
    long_description: string;
    material: string;
    specs: {
        weight_kg: number;
        volume_m3: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
            display: string;
        };
    };
    images: {
        main: string;
        image_1: string | null;
        image_2: string | null;
        image_3: string | null;
        image_4: string | null;
    };
    seo: {
        keyword: string;
        meta_title: string;
        meta_description: string;
    };
}

export interface ApiCollection {
    id: number;
    title: string;
    description: string;
    parent: string | null;
    products_preview: ApiProduct[];
}

export interface ApiCollectionDetail {
    collection_info: {
        title: string;
        subtitle?: string;
        description: string;
        key: string;
    };
    products: ApiProductDetail[];
}

export type ApiResponse = Record<string, ApiCollection>;

export async function fetchCollections(): Promise<ApiResponse> {
    try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error("Failed to fetch collections");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching collections:", error);
        return {};
    }
}

export async function fetchCollectionDetails(key: string): Promise<ApiCollectionDetail | null> {
    try {
        const response = await fetch(`${API_COLLECTION_URL}/${key}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to fetch collection details for ${key}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching collection details for ${key}:`, error);
        return null;
    }
}

export function mapApiProductDetailToProduct(apiProduct: ApiProductDetail, category: string, collectionKey?: string): Product {
    // Helper to ensure HTTPS
    const toHttps = (url: string) => url ? url.replace(/^http:\/\//, "https://") : "";

    const mainImage = toHttps(apiProduct.images.main);
    const images = [
        mainImage,
        toHttps(apiProduct.images.image_1 || ""),
        toHttps(apiProduct.images.image_2 || ""),
        toHttps(apiProduct.images.image_3 || ""),
        toHttps(apiProduct.images.image_4 || ""),
    ].filter(Boolean);

    return {
        id: apiProduct.id.toString(),
        name: apiProduct.name,
        slug: apiProduct.slug,
        price: apiProduct.price,
        image: mainImage,
        images: images,
        category: category,
        collectionKey: collectionKey,
        featured: false,
        description: apiProduct.long_description || apiProduct.short_description, // Use HTML description
        shortDescription: apiProduct.short_description,
        longDescription: apiProduct.long_description,
        dimensions: {
            height: apiProduct.specs.dimensions.height + " cm",
            width: apiProduct.specs.dimensions.width + " cm",
            depth: apiProduct.specs.dimensions.length + " cm", // Assuming length is depth
            weight: apiProduct.specs.weight_kg + " kg",
        },
        material: apiProduct.material,
        colors: "", // API doesn't provide colors yet
        inStock: true,
    };
}

// Keep the old mapper for preview if needed, or just use the detailed one if we fetch everything.
export function mapApiProductToProduct(apiProduct: ApiProduct, category: string, collectionKey?: string): Product {
    // Ensure image URL is HTTPS to avoid mixed content errors
    const imageUrl = apiProduct.image.replace(/^http:\/\//, "https://");

    return {
        id: apiProduct.id.toString(),
        name: apiProduct.name,
        slug: apiProduct.slug,
        price: 0,
        image: imageUrl,
        images: [imageUrl],
        category: category,
        collectionKey: collectionKey,
        featured: false,
        description: "",
        dimensions: { height: "", width: "", depth: "", weight: "" },
        material: "",
        colors: "",
        inStock: true,
    };
}

export async function getAllProducts(): Promise<Product[]> {
    // 1. Get all collection keys
    const collections = await fetchCollections();
    const keys = Object.keys(collections);

    // 2. Fetch details for each collection in parallel
    const detailsPromises = keys.map(key => fetchCollectionDetails(key));
    const detailsResults = await Promise.all(detailsPromises);

    let allProducts: Product[] = [];

    detailsResults.forEach((detail, index) => {
        if (detail && detail.products) {
            const category = detail.collection_info.title;
            const collectionKey = detail.collection_info.key;
            const products = detail.products.map(p => mapApiProductDetailToProduct(p, category, collectionKey));
            allProducts = [...allProducts, ...products];
        } else {
            // Fallback to preview data if details fail? 
            // For now, if details fail, we might miss products.
            // But let's assume it works.
        }
    });

    // Remove duplicates
    return Array.from(new Map(allProducts.map(item => [item.id, item])).values());
}

```

## ./lib/collections.ts
```ts
export const COLLECTIONS_DATA: Record<string, { description: string; image: string }> = {
    "ALLOY COLLECTION": {
        description: "Celebrate the bold beauty of metal transformed into art with our Alloy Collection. Crafted from durable, high-quality alloys, these sculptures are designed to make a statement. Each piece blends strength with creativity, featuring striking lines, fluid shapes, and imaginative forms that elevate any space.\n\nFrom large outdoor installations to smaller indoor accents, each sculpture blends artistry with craftsmanship. Weather-resistant and visually striking, they bring modern elegance and sculptural impact to any space.\n\nDiscover metal reimagined: expressive, enduring, and artfully engineered.",
        image: "/producto8.png",
    },
    "CRYSTAL COLLECTION": {
        description: "Crystal Collection \n\nBorn from craftsmanship and clarity, the collection presents sculptural crystal pieces that enhance any space. Inspired by architectural lines and modern glamour, each item is crafted to capture and reflect light with striking brilliance.\n\nBold geometric forms, refined edges, and vibrant colors make every piece a functional work of art. Whether displayed as a centerpiece or used in everyday rituals, these crystal creations bring sophistication, sparkle, and timeless elegance to any space.\n\nExplore a collection where design meets radiance — crystal décor that transforms light, ambiance, and the feel of your home.",
        image: "/producto4.png",
    },
    "EARTH COLLECTION": {
        description: "Formed by time itself, the Earth Collection brings together nature’s most extraordinary creations, each shaped over millions of years. This curated assortment celebrates the raw beauty, history, and artistry found beneath the surface of our planet. Every piece is unique and full of character. Whether used for décor, collecting, or inspiring connection to the natural world, the Collection offers timeless elements that ground any space with depth, authenticity, and organic elegance.",
        image: "/producto10.png",
    },
    "FOSSILS": {
        description: "Step into the ancient world with our Fossil Collection, a curated selection of natural wonders formed over millions of years. From spiraled ammonites to striking septarian nodules and other geological relics, each piece carries the story of Earth’s earliest life and shifting landscapes.\n\nRich in texture, pattern, and history, these fossils make captivating décor accents and meaningful collector’s items. Their organic shapes and timeless beauty add depth, character, and a sense of discovery to any space.\n\nCelebrate nature’s past through fossils that inspire, educate, and bring prehistoric artistry into the modern home.",
        image: "/producto9.png",
    },
    "PETRIFIED WOOD": {
        description: "Discover the timeless beauty of Petrified Wood, where ancient forests have been transformed into stone over millions of years. Each piece preserves the original structure of the wood, replaced by minerals to create stunning patterns and colors. A perfect blend of history and natural art.",
        image: "/producto5.png",
    },
    "HERITAGE COLLECTION": {
        description: "Where history becomes art, the Heritage Collection brings together ancient vessels, rare forms, and modern handcrafted décor. Every piece is unique, chosen for its story, texture, and enduring elegance, offering a refined balance of heritage and contemporary style.",
        image: "/producto2.png",
    },
    "LUMEN COLLECTION": {
        description: "A tribute to timeless radiance, the Lumen Collection reimagines the power of light as a form of art. Each piece is designed to shape atmosphere, sculpt shadows, and bring depth and dimension to any space. With a focus on refined materials, thoughtful craftsmanship, and expressive silhouettes, this collection transforms illumination into an experience—one that enhances architecture, elevates mood, and creates a sense of warmth and modern sophistication. More than functional design, Lumen is a celebration of light as a living, breathing element within contemporary interiors.",
        image: "/producto6.png",
    },
    "OCEAN COLLECTION": {
        description: "Dive into the Ocean Collection, where corals, shells, and rare marine treasures reveal the raw beauty of the sea. Each piece showcases natural textures, intricate patterns, and sculptural forms shaped by the ocean itself. From striking corals to exotic shells, this collection brings coastal elegance and the timeless magic of underwater worlds into any space.Bring a touch of the sea’s magic into your home with nature’s own ocean-born masterpieces.",
        image: "/producto3.png",
    },
    "SERENITY COLLECTION": {
        description: "Embrace the calming presence of natural textures and flowing forms with our Serenity Collection.  Inspired by stillness and organic beauty, each piece is designed to bring balance, grounding, and quiet elegance into any space. With soft stone finishes, soothing silhouettes, and an earth-rooted aesthetic, this collection creates peaceful environments that invite reflection, relaxation, and a sense of harmonious living.",
        image: "/producto1.png",
    },
    "MINERAL SPECIMENS": {
        description: "Discover the raw beauty of the earth through our curated collection of natural minerals and stones. Each piece is hand-selected for its unique colors, textures, and formations—showcasing the incredible artistry created by nature over millions of years. From vibrant crystals to polished freeforms and rare mineral specimens, every stone carries its own story and energy.\n\nPerfect for décor lovers, collectors, and those who appreciate organic elegance, this collection celebrates authenticity, natural detail, and one-of-a-kind beauty. Bring timeless earth elements into your space with stones that elevate, inspire, and connect you to nature’s quiet power.",
        image: "/producto10.png",
    }
};

```

## ./lib/legal.ts
```ts
const API_BASE_URL = "https://erp.oneofakind.com.mx/api/legal";

export interface LegalPageSummary {
    title: string;
    slug: string;
    updated_at: string;
}

export interface LegalPageDetail {
    title: string;
    slug: string;
    content: string;
    last_updated: string;
    meta_title: string;
    meta_description: string;
}

export async function getLegalPages(): Promise<LegalPageSummary[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/pages`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) throw new Error("Failed to fetch legal pages list");

        const json = await res.json();
        return json.data || [];
    } catch (error) {
        console.error("Error fetching legal pages:", error);
        return [];
    }
}

export async function getLegalPage(slug: string): Promise<LegalPageDetail | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/page/${slug}`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;

        const json = await res.json();
        const page = json.data;

        if (!page) return null;

        // Enforce HTTPS in content
        const secureContent = page.content.replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://erp.oneofakind.com.mx');

        return {
            ...page,
            content: secureContent,
            meta_description: typeof page.meta_description === 'string' ? page.meta_description : ''
        };
    } catch (error) {
        console.error(`Error fetching legal page ${slug}:`, error);
        return null;
    }
}

```

## ./lib/products.ts
```ts
export interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    images?: string[];
    category: string;
    collectionKey?: string;
    featured?: boolean;
    description?: string; // Keep for backward compatibility or fallbacks
    shortDescription?: string;
    longDescription?: string;
    dimensions?: {
        height: string;
        width: string;
        depth: string;
        weight: string;
    };
    material?: string;
    colors?: string;
    inStock?: boolean;
}

export const products: Product[] = [
    {
        id: "prod-1",
        name: "Green Fluorite on Acrylic Base",
        slug: "green-fluorite-acrylic-base",
        price: 38500,
        image: "/producto1.png",
        images: ["/producto1.png", "/producto1.png", "/producto1.png", "/producto1.png"],
        category: "Minerals & Crystals",
        featured: true,
        description: "An exceptional piece of natural Green Fluorite mounted on a transparent acrylic base. Its natural geometry and translucent tones capture light with depth, generating sparkles that evoke serenity and balance. Ideal for spaces seeking a touch of authentic mineral luxury.",
        dimensions: { height: "17.5 cm", width: "12.3 cm", depth: "6.8 cm", weight: "2.4 kg" },
        material: "Natural Fluorite on high-transparency acrylic base",
        colors: "Emerald Green / Translucent White",
        inStock: true,
    },
    {
        id: "prod-2",
        name: "Polished Fossil Ammonite",
        slug: "polished-fossil-ammonite",
        price: 42000,
        image: "/producto2.png",
        images: ["/producto2.png", "/producto2.png", "/producto2.png", "/producto2.png"],
        category: "Fossils & Paleontology",
        featured: true,
        description: "Authentic ammonite fossil, carefully polished to highlight its spiral structure and the natural earthy tones of the mineral.",
        dimensions: { height: "19.2 cm", width: "15.8 cm", depth: "6.0 cm", weight: "3.1 kg" },
        material: "Mineralized natural fossil on polished acrylic base",
        colors: "Amber, Brown, Metallic Grey",
        inStock: true,
    },
    {
        id: "3",
        name: "Quartz Crystal Cluster",
        slug: "quartz-crystal-cluster",
        price: 1200,
        image: "/producto3.png",
        images: ["/producto3.png", "/producto3.png", "/producto3.png", "/producto3.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Piece of natural raw Amazonite, recognized for its blue-green color with white veins evoking serenity.",
        dimensions: { height: "14.0 cm", width: "20.0 cm", depth: "10.5 cm", weight: "4.2 kg" },
        material: "Unpolished natural Amazonite",
        colors: "Turquoise Green / White",
        inStock: true,
    },
    {
        id: "7",
        name: "Labradorite Slab",
        slug: "labradorite-slab",
        price: 2100,
        image: "/producto4.png",
        images: ["/producto4.png", "/producto4.png", "/producto4.png", "/producto4.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "High-purity natural Smoky Quartz crystal with natural terminations and deep transparencies.",
        dimensions: { height: "16.0 cm", width: "18.5 cm", depth: "10.0 cm", weight: "3.6 kg" },
        material: "Natural Smoky Quartz",
        colors: "Dark Brown / Smoke Grey",
        inStock: true,
    },
    {
        id: "1",
        name: "Polished Landscape Jasper",
        slug: "polished-landscape-jasper",
        price: 2400,
        image: "/producto5.png",
        images: ["/producto5.png", "/producto5.png", "/producto5.png", "/producto5.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes.",
        dimensions: { height: "18.0 cm", width: "12.0 cm", depth: "9.0 cm", weight: "3.0 kg" },
        material: "Polished natural Jasper",
        colors: "Sand, Grey, Amber",
        inStock: true,
    },
    {
        id: "2",
        name: "Amethyst Geode Cathedral",
        slug: "amethyst-geode-cathedral",
        price: 4500,
        image: "/producto6.png",
        images: ["/producto6.png", "/producto6.png", "/producto6.png", "/producto6.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Impressive natural amethyst geode with deep formation crystals in lavender and light violet tones.",
        dimensions: { height: "22.0 cm", width: "25.0 cm", depth: "14.0 cm", weight: "6.5 kg" },
        material: "Natural Amethyst",
        colors: "Violet, Lavender",
        inStock: true,
    },
    {
        id: "prod-7",
        name: "Polished Septarian Geode",
        slug: "polished-septarian-geode",
        price: 69000,
        image: "/producto7.png",
        images: ["/producto7.png", "/producto7.png", "/producto7.png", "/producto7.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Polished Septarian geode with internal cavity of black crystals and natural veins.",
        dimensions: { height: "20.5 cm", width: "14.0 cm", depth: "13.0 cm", weight: "4.8 kg" },
        material: "Natural Septarian",
        colors: "Black, Ochre, Gold",
        inStock: true,
    },
    {
        id: "4",
        name: "Obsidian Sphere",
        slug: "obsidian-sphere",
        price: 850,
        image: "/producto8.png",
        images: ["/producto8.png", "/producto8.png", "/producto8.png", "/producto8.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Mineral work of polished Septarian with internal cavity of dark crystals.",
        dimensions: { height: "21.0 cm", width: "14.8 cm", depth: "13.5 cm", weight: "5.0 kg" },
        material: "Polished natural Septarian",
        colors: "Black, Gold, Brown",
        inStock: true,
    },
];

```

## ./lib/utils.ts
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

## ./next-env.d.ts
```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

## ./next.config.ts
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "erp.oneofakind.com.mx",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "erp.oneofakind.com.mx",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "erp.oneofakind.com.mx",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
```

## ./package.json
```json
{
  "name": "my-v0-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "1.2.2",
    "@radix-ui/react-alert-dialog": "1.1.4",
    "@radix-ui/react-aspect-ratio": "1.1.1",
    "@radix-ui/react-avatar": "1.1.2",
    "@radix-ui/react-checkbox": "1.1.3",
    "@radix-ui/react-collapsible": "1.1.2",
    "@radix-ui/react-context-menu": "2.2.4",
    "@radix-ui/react-dialog": "1.1.4",
    "@radix-ui/react-dropdown-menu": "2.1.4",
    "@radix-ui/react-hover-card": "1.1.4",
    "@radix-ui/react-label": "2.1.1",
    "@radix-ui/react-menubar": "1.1.4",
    "@radix-ui/react-navigation-menu": "1.2.3",
    "@radix-ui/react-popover": "1.1.4",
    "@radix-ui/react-progress": "1.1.1",
    "@radix-ui/react-radio-group": "1.2.2",
    "@radix-ui/react-scroll-area": "1.2.2",
    "@radix-ui/react-select": "2.1.4",
    "@radix-ui/react-separator": "1.1.1",
    "@radix-ui/react-slider": "1.2.2",
    "@radix-ui/react-slot": "1.1.1",
    "@radix-ui/react-switch": "1.1.2",
    "@radix-ui/react-tabs": "1.1.2",
    "@radix-ui/react-toast": "1.2.4",
    "@radix-ui/react-toggle": "1.1.1",
    "@radix-ui/react-toggle-group": "1.1.1",
    "@radix-ui/react-tooltip": "1.1.6",
    "@stripe/react-stripe-js": "^5.4.1",
    "@stripe/stripe-js": "^4.9.0",
    "@tailwindcss/typography": "^0.5.19",
    "@vercel/analytics": "1.3.1",
    "autoprefixer": "^10.4.20",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.4",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.5.1",
    "input-otp": "1.4.1",
    "lucide-react": "^0.454.0",
    "next": "16.0.0",
    "next-themes": "^0.4.6",
    "react": "19.2.0",
    "react-day-picker": "9.8.0",
    "react-dom": "19.2.0",
    "react-hook-form": "^7.60.0",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.4",
    "sonner": "^1.7.4",
    "stripe": "^17.3.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.9",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8.5",
    "tailwindcss": "^4.1.9",
    "tw-animate-css": "1.3.3",
    "typescript": "^5"
  }
}

```

## ./postcss.config.mjs
```mjs
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;

```

## ./tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}

```
