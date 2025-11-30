import { useState, useEffect } from 'react';

const API_URL = 'https://odoo-ooak.alphaqueb.com';

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
