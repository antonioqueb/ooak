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
        const res = await fetch(`https://odoo-ooak.alphaqueb.com/api/projects/${slug}`, {
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
