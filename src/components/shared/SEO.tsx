import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title = "LearnInk - Modern Learning Management System",
  description = "An interactive learning platform with in-browser code execution, automatic notes, and real-time progress tracking.",
  image = "/og-image.png", // Assuming this exists or will be added
  url = "https://learnink.vercel.app",
  type = "website",
}: SEOProps) {
  const siteTitle = title.includes("LearnInk") ? title : `${title} | LearnInk`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Theme Color for mobile browsers */}
      <meta name="theme-color" content="#09090b" />
    </Helmet>
  );
}
