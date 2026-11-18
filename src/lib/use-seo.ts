import { useEffect } from "react";

export interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "event";
  jsonLd?: object;
}

const DEFAULT_TITLE = "BlackWhite Event — Platform Pendaftaran Event & Tiket Barcode QR";
const DEFAULT_DESC =
  "Platform resmi pendaftaran berbagai event, seminar, olahraga, dan pelatihan di Indonesia. Dapatkan tiket QR barcode resmi dan check-in cepat di lokasi acara.";
const DEFAULT_IMAGE = "https://www.e-blackwhite.site/icon-512.png";
const BASE_URL = "https://www.e-blackwhite.site";

function setMetaTag(selector: string, attrName: string, attrValue: string, content: string) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

export function useSeo({ title, description, image, url, type = "website", jsonLd }: SeoProps = {}) {
  useEffect(() => {
    // 1. Page Title
    const fullTitle = title ? `${title} — BlackWhite Event` : DEFAULT_TITLE;
    document.title = fullTitle;

    // 2. Meta Description
    const metaDesc = description || DEFAULT_DESC;
    setMetaTag('meta[name="description"]', "name", "description", metaDesc);

    // 3. Open Graph
    setMetaTag('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", metaDesc);
    setMetaTag('meta[property="og:type"]', "property", "og:type", type);
    const fullImage = image ? (image.startsWith("http") ? image : `${BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`) : DEFAULT_IMAGE;
    setMetaTag('meta[property="og:image"]', "property", "og:image", fullImage);

    const fullUrl = url ? (url.startsWith("http") ? url : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`) : window.location.href;
    setMetaTag('meta[property="og:url"]', "property", "og:url", fullUrl);
    setCanonical(fullUrl);

    // 4. Twitter Cards
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", metaDesc);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", fullImage);

    // 5. Dynamic JSON-LD (if provided)
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = "dynamic-seo-jsonld";
      scriptEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
    };
  }, [title, description, image, url, type, jsonLd]);
}
