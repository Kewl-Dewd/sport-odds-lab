import { canTrack } from "@/lib/consent";

/** Facebook pixel for the Sports Market Lab ad account. */
export const META_PIXEL_ID = "2604991250010358";

/** Only public marketing pages and sign-up are measured; signed-in class pages never load the pixel. */
export const PIXEL_PATHS = ["/", "/instructors", "/for-administrators", "/how-it-works", "/auth"];

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let initialised = false;

function loadBase() {
  if (window.fbq) return;
  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod.apply(fbq, args);
    else fbq.queue!.push(args);
  } as Fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  window.fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
}

/** Loads or re-grants the pixel when advertising is permitted, otherwise revokes it. Returns whether it may send. */
export async function syncPixelConsent(): Promise<boolean> {
  const allowed = await canTrack("advertising");
  if (!allowed) {
    if (initialised) window.fbq?.("consent", "revoke");
    return false;
  }
  if (!initialised) {
    loadBase();
    window.fbq?.("init", META_PIXEL_ID, {}, { agent: "lovable" });
    initialised = true;
  } else {
    window.fbq?.("consent", "grant");
  }
  return true;
}

export async function trackPixelPageView() {
  if (await syncPixelConsent()) window.fbq?.("track", "PageView");
}

/** A new instructor account was created. */
export async function trackInstructorSignup() {
  if (!(await syncPixelConsent())) return;
  const eventID = `reg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.fbq?.("track", "CompleteRegistration", { content_name: "instructor" }, { eventID });
}
