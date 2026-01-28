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
