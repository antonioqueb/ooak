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
