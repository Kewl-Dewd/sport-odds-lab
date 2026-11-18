import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { onConsentChange } from "@/lib/consent";
import { PIXEL_PATHS, syncPixelConsent, trackPixelPageView } from "@/lib/metaPixel";

/** Sends a page view on public pages, and follows cookie choices without a reload. */
export function MetaPixelTracker() {
  const { pathname } = useLocation();
  const measured = PIXEL_PATHS.includes(pathname);

  useEffect(() => {
    if (measured) void trackPixelPageView();
  }, [pathname, measured]);

  useEffect(
    () =>
      onConsentChange(() => {
        if (PIXEL_PATHS.includes(window.location.pathname)) void trackPixelPageView();
        else void syncPixelConsent();
      }),
    [],
  );

  return null;
}
