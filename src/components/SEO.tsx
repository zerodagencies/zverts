import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

const SITE = "https://zverts.lovable.app";

export const SEO = ({ title, description, path = "/", type = "website", jsonLd, noindex }: SEOProps) => {
  const url = `${SITE}${path}`;
  const fullTitle = title.includes("ZverT") ? title : `${title} — ZverT`;
  const ldArr = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {ldArr.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEO;
