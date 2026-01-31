import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    name?: string;
    type?: string;
    image?: string;
    url?: string;
}

export default function SEO({
    title,
    description = "Kuasai AI Automation tanpa perlu coding. Platform belajar AI untuk mahasiswa dan profesional non-IT.",
    name = "LearnAI",
    type = "website",
    image = "/icon-512.png",
    url
}: SEOProps) {
    const siteUrl = window.location.origin;
    const fullUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : window.location.href;
    const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;
    const fullTitle = `${title} | ${name}`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />
        </Helmet>
    );
}
