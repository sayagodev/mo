// oat — TypeScript declarations
// Compatible with Next.js / React projects using @sayagodev/oat

/* ============================================================
 * CSS Custom Properties
 * ============================================================ */
interface OatCSSVariables {
  // Colors
  "--background": string;
  "--foreground": string;
  "--card": string;
  "--card-foreground": string;
  "--primary": string;
  "--primary-foreground": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--muted": string;
  "--muted-foreground": string;
  "--faint": string;
  "--faint-foreground": string;
  "--accent": string;
  "--danger": string;
  "--danger-foreground": string;
  "--success": string;
  "--success-foreground": string;
  "--warning": string;
  "--warning-foreground": string;
  "--border": string;
  "--input": string;
  "--ring": string;
  // Spacing
  "--space-1": string;
  "--space-2": string;
  "--space-3": string;
  "--space-4": string;
  "--space-5": string;
  "--space-6": string;
  "--space-8": string;
  "--space-10": string;
  "--space-12": string;
  "--space-14": string;
  "--space-16": string;
  "--space-18": string;
  // Radii
  "--radius-small": string;
  "--radius-medium": string;
  "--radius-large": string;
  "--radius-full": string;
  // Typography
  "--font-sans": string;
  "--font-mono": string;
  "--text-1": string;
  "--text-2": string;
  "--text-3": string;
  "--text-4": string;
  "--text-5": string;
  "--text-6": string;
  "--text-7": string;
  "--text-8": string;
  "--text-regular": string;
  "--leading-normal": string;
  "--font-normal": string;
  "--font-medium": string;
  "--font-semibold": string;
  "--font-bold": string;
  // Shadows
  "--shadow-small": string;
  "--shadow-medium": string;
  "--shadow-large": string;
  // Transitions
  "--transition-fast": string;
  "--transition": string;
  // Z-index
  "--z-dropdown": string;
  "--z-modal": string;
  // Layout
  "--sidebar-width": string;
  "--grid-cols": string;
  "--grid-gap": string;
  "--container-max": string;
  "--container-pad": string;
  // Misc
  "--bar-height": string;
  "--switch-height": string;
  "--switch-inset": string;
  "--switch-thumb": string;
}

declare namespace React {
  interface CSSProperties extends Partial<OatCSSVariables> {}
}

/* ============================================================
 * Global data attributes
 * ============================================================ */
interface OatDataAttributes {
  // Variant system (alert, badge, toast, button, etc.)
  "data-variant"?: "primary" | "secondary" | "success" | "warning" | "danger" | "error" | "info";
  // Tooltip
  "data-tooltip"?: string;
  "data-tooltip-placement"?: "top" | "bottom" | "left" | "right";
  // Sidebar
  "data-sidebar-layout"?: "always" | "overlay";
  "data-sidebar-open"?: boolean;
  "data-sidebar-toggle"?: boolean;
  "data-sidebar-header"?: boolean;
  "data-sidebar"?: boolean;
  "data-topnav"?: boolean;
  // Spinner
  "data-spinner"?: "small" | "large" | "overlay" | string;
  // Field / form
  "data-field"?: boolean;
  "data-hint"?: boolean;
  // Upload
  "data-files"?: boolean;
  "data-drag"?: boolean;
  // Tabs anchor
  "data-anchor"?: string;
  // Toast
  "data-placement"?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  "data-entering"?: boolean;
  "data-exiting"?: boolean;
  "data-close"?: boolean;
  // Avatar
  "data-variant"?: "avatar";
}

interface HTMLElement extends Partial<OatDataAttributes> {}

/* ============================================================
 * Custom Elements
 * ============================================================ */

/** ot-tabs: accessible tab component with keyboard navigation */
interface OtTabsElement extends HTMLElement {
  /** Get or set the active tab index */
  activeIndex: number;
  addEventListener<K extends keyof OtTabsEventMap>(
    type: K,
    listener: (this: OtTabsElement, ev: OtTabsEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof OtTabsEventMap>(
    type: K,
    listener: (this: OtTabsElement, ev: OtTabsEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface OtTabsEventMap extends HTMLElementEventMap {
  "ot-tab-change": CustomEvent<{ index: number; tab: HTMLElement }>;
}

/** ot-dropdown: popover-based dropdown with positioning and keyboard nav */
interface OtDropdownElement extends HTMLElement {}

/** ot-upload: file upload with drag-and-drop and badge preview */
interface OtUploadElement extends HTMLElement {}

/** ot-taginput: tag input with autocomplete support */
interface OtTaginputElement extends HTMLElement {
  /** The internal <input> element */
  readonly input: HTMLInputElement | null;
  /** Get or set tags as an array of strings or objects */
  value: (string | { toString(): string })[];
  addEventListener(
    type: "input",
    listener: (this: OtTaginputElement, ev: CustomEvent<(string | { toString(): string })[]>) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "input",
    listener: (this: OtTaginputElement, ev: CustomEvent<(string | { toString(): string })[]>) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "ot-tabs": OtTabsElement;
    "ot-dropdown": OtDropdownElement;
    "ot-upload": OtUploadElement;
    "ot-taginput": OtTaginputElement;
  }

  // JSX support for React / Preact
  namespace JSX {
    interface IntrinsicElements {
      "ot-tabs": React.DetailedHTMLProps<React.HTMLAttributes<OtTabsElement>, OtTabsElement>;
      "ot-dropdown": React.DetailedHTMLProps<React.HTMLAttributes<OtDropdownElement>, OtDropdownElement>;
      "ot-upload": React.DetailedHTMLProps<React.HTMLAttributes<OtUploadElement>, OtUploadElement>;
      "ot-taginput": React.DetailedHTMLProps<React.HTMLAttributes<OtTaginputElement>, OtTaginputElement>;
    }
  }
}

/* ============================================================
 * window.ot — Toast API
 * ============================================================ */
interface OtToastOptions {
  variant?: "info" | "success" | "warning" | "danger" | "error";
  placement?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  duration?: number;
}

interface OtToastAPI {
  (message: string, title?: string, options?: OtToastOptions): HTMLElement;
  el(element: HTMLElement | HTMLTemplateElement, options?: OtToastOptions): HTMLElement | undefined;
  clear(placement?: string): void;
}

interface OtWindow {
  toast: OtToastAPI;
}

interface Window {
  ot?: OtWindow;
}

/* ============================================================
 * Utility class names
 * ============================================================ */
interface OatUtilityClasses {
  "align-left": unknown;
  "align-center": unknown;
  "align-right": unknown;
  "text-light": unknown;
  "text-lighter": unknown;
  "flex": unknown;
  "flex-col": unknown;
  "items-center": unknown;
  "justify-center": unknown;
  "justify-between": unknown;
  "justify-end": unknown;
  "hstack": unknown;
  "vstack": unknown;
  "gap-1": unknown;
  "gap-2": unknown;
  "gap-4": unknown;
  "gap-6": unknown;
  "mt-2": unknown;
  "mt-4": unknown;
  "mt-6": unknown;
  "mt-8": unknown;
  "mb-2": unknown;
  "mb-4": unknown;
  "mb-6": unknown;
  "mb-8": unknown;
  "p-4": unknown;
  "w-100": unknown;
  "unstyled": unknown;
  "card": unknown;
  "badge": unknown;
  "skeleton": unknown;
  "box": unknown;
  "line": unknown;
  "small": unknown;
  "large": unknown;
  "icon": unknown;
  "outline": unknown;
  "ghost": unknown;
  "container": unknown;
  "row": unknown;
  "col": unknown;
  "col-1": unknown;
  "col-2": unknown;
  "col-3": unknown;
  "col-4": unknown;
  "col-5": unknown;
  "col-6": unknown;
  "col-7": unknown;
  "col-8": unknown;
  "col-9": unknown;
  "col-10": unknown;
  "col-11": unknown;
  "col-12": unknown;
  "offset-1": unknown;
  "offset-2": unknown;
  "offset-3": unknown;
  "offset-4": unknown;
  "offset-5": unknown;
  "offset-6": unknown;
  "col-end": unknown;
}

export type {};
