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
