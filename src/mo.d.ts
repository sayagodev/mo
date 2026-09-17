// mo — TypeScript declarations
// Compatible with Next.js / React projects using @sayagodev/mo
//
// Zero hard dependencies: the JSX section resolves React types lazily via
// `import('react')`, so vanilla TS consumers never need @types/react.

/* ============================================================
 * CSS Custom Properties
 * ============================================================
 * Theme tokens (01-theme.css) and per-component override hooks
 * (--mo-*, documented next to their component below). Augmenting
 * React.CSSProperties lets JSX users write style={{ "--mo-card-padding": ... }}.
 */
interface MoCSSVariables {
  // Colors — core palette
  "--background": string;
  "--foreground": string;
  "--card": string;
  "--card-foreground": string;
  "--popover": string;
  "--popover-foreground": string;
  "--primary": string;
  "--primary-foreground": string;
  "--secondary": string;
  "--secondary-foreground": string;
  "--muted": string;
  "--muted-foreground": string;
  "--faint": string;
  "--faint-foreground": string;
  "--accent": string;
  "--accent-foreground": string;
  "--danger": string;
  "--danger-foreground": string;
  "--destructive": string; // shadcn alias of --danger
  "--destructive-foreground": string;
  "--success": string;
  "--success-foreground": string;
  "--warning": string;
  "--warning-foreground": string;
  "--border": string;
  "--input": string;
  "--ring": string;
  // Colors — charts (shadcn-compatible slots)
  "--chart-1": string;
  "--chart-2": string;
  "--chart-3": string;
  "--chart-4": string;
  "--chart-5": string;
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
  "--radius": string;
  "--radius-small": string;
  "--radius-medium": string;
  "--radius-large": string;
  "--radius-xlarge": string;
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
  // Shadows (shadcn aliases: --shadow-xs/sm/md/lg)
  "--shadow-small": string;
  "--shadow-medium": string;
  "--shadow-large": string;
  "--shadow-xs": string;
  "--shadow-sm": string;
  "--shadow-md": string;
  "--shadow-lg": string;
  // Transitions
  "--transition-fast": string;
  "--transition": string;
  // Z-index
  "--z-dropdown": string;
  "--z-modal": string;
  // Layout
  "--grid-cols": string;
  "--grid-gap": string;
  "--container-max": string;
  "--container-pad": string;
  // Misc
  "--bar-height": string;
  "--switch-height": string;
  "--switch-inset": string;
  "--switch-thumb": string;

  /* Sidebar tokens (sidebar.css) */
  "--sidebar": string;
  "--sidebar-foreground": string;
  "--sidebar-primary": string;
  "--sidebar-primary-foreground": string;
  "--sidebar-accent": string;
  "--sidebar-accent-foreground": string;
  "--sidebar-border": string;
  "--sidebar-width": string; // default 16rem
  "--sidebar-width-icon": string; // default 3rem

  /* Per-component override hooks (--mo-*) */

  // Accordion — trigger/content spacing
  "--mo-accordion-padding": string;
  // Alert
  "--mo-alert-padding": string;
  "--mo-alert-radius": string;
  // Aspect ratio — any ratio value ("3/2"); --ratio is the alias
  "--mo-aspect-ratio": string;
  // Attachment chips
  "--mo-attachment-gap": string;
  "--mo-attachment-group-gap": string;
  "--mo-attachment-media-size": string;
  "--mo-attachment-radius": string;
  // Avatar — explicit size override
  "--mo-avatar-size": string;
  // Badge
  "--mo-badge-padding-x": string;
  "--mo-badge-padding-y": string;
  "--mo-badge-radius": string;
  // Button
  "--mo-button-height": string;
  "--mo-button-height-small": string;
  "--mo-button-height-large": string;
  "--mo-button-height-xs": string;
  "--mo-button-padding-x": string;
  "--mo-button-padding-y": string;
  "--mo-button-radius": string;
  "--mo-button-font-size": string;
  // Button group
  "--mo-button-group-gap": string;
  "--mo-button-group-divider": string;
  // Card
  "--mo-card-bg": string;
  "--mo-card-padding": string;
  "--mo-card-radius": string;
  "--mo-card-shadow": string;
  // Carousel — slide widths and track
  "--mo-carousel-basis": string;
  "--mo-carousel-dot": string;
  "--mo-carousel-gap": string;
  "--mo-carousel-gap-tight": string;
  "--mo-carousel-height": string;
  "--mo-carousel-size-sm": string;
  "--mo-carousel-size-lg": string;
  // Combobox
  "--mo-combobox-height": string;
  "--mo-combobox-min-width": string;
  "--mo-combobox-max-height": string;
  "--mo-combobox-radius": string;
  // Command palette / inline card
  "--mo-command-width": string;
  "--mo-command-list-height": string;
  "--mo-command-radius": string;
  // Context menu
  "--mo-context-menu-min-width": string;
  "--mo-context-menu-radius": string;
  // Dialog
  "--mo-dialog-max-width": string;
  "--mo-dialog-radius": string;
  // Dropdown menu surface
  "--mo-dropdown-min-width": string;
  "--mo-dropdown-radius": string;
  // Empty state
  "--mo-empty-padding": string;
  "--mo-empty-radius": string;
  // Form field composition
  "--mo-field-gap": string;
  "--mo-input-radius": string;
  "--mo-input-padding-x": string;
  // Input group
  "--mo-input-group-height": string;
  "--mo-input-group-radius": string;
  // Item rows
  "--mo-item-padding": string;
  "--mo-item-radius": string;
  // Marker highlight tint (also drives data-marker="border")
  "--mo-marker-color": string;
  // Menubar
  "--mo-menubar-height": string;
  "--mo-menubar-min-width": string;
  "--mo-menubar-radius": string;
  // OTP cells
  "--mo-otp-cell-size": string;
  // Popover
  "--mo-popover-min-width": string;
  "--mo-popover-radius": string;
  // Resizable handles
  "--mo-resizable-line": string;
  "--mo-resizable-hit": string;
  "--mo-resizable-active": string;
  // Scroll area
  "--mo-scroll-area-height": string;
  "--mo-scroll-area-width": string;
  "--mo-scroll-fade-size": string;
  // Select
  "--mo-select-height": string;
  "--mo-select-min-width": string;
  "--mo-select-max-height": string;
  "--mo-select-padding-x": string;
  "--mo-select-radius": string;
  // Sheet
  "--mo-sheet-max-width": string;
  "--mo-sheet-max-block-size": string;
  "--mo-sheet-handle-width": string;
  "--mo-sheet-handle-height": string;
  // Switch
  "--mo-switch-width": string;
  "--mo-switch-thumb": string;
  // Table
  "--mo-table-cell-padding-x": string;
  "--mo-table-cell-padding-y": string;
  // Tabs
  "--mo-tabs-height": string;
  "--mo-tabs-list-bg": string;
  "--mo-tabs-radius": string;
  "--mo-tabs-vertical-gap": string;
  // Tag input
  "--mo-taginput-padding": string;
  // Toast
  "--mo-toast-min-width": string;
  "--mo-toast-max-width": string;
  "--mo-toast-padding": string;
  // Toggle
  "--mo-toggle-bg": string;
  // Toggle group
  "--mo-toggle-group-gap": string;
  // Tooltip
  "--mo-tooltip-delay": string;

  // Variant system extension point (set by variant classes/toast variants)
  "--variant-color": string;
}

/* ============================================================
 * Global data attributes
 * ============================================================
 * Mo is attribute-driven: these selectors ARE the components.
 * Declared on every HTMLElement so plain DOM code and JSX both get
 * autocomplete. Booleans model presence-only attributes.
 */
interface MoDataAttributes {
  /* Variant system (alert, badge, button, toast, item, empty, mark…) */
  "data-variant"?:
    | "primary"
    | "secondary"
    | "outline"
    | "muted"
    | "success"
    | "warning"
    | "danger"
    | "destructive"
    | "error"
    | "info"
    | "line" // tablist underline look
    | "icon" // empty/attachment media slot
    | "image" // attachment/item media slot
    | "avatar"; // figure avatar

  /* Sizes (avatar .small/.large alt API, compact items) */
  "data-size"?: "sm" | "lg";

  /* State chip (attachment) */
  "data-state"?: "idle" | "uploading" | "processing" | "error" | "done";

  /* Side / orientation pickers (sheet, hover card, carousel, resizable, button group) */
  "data-side"?: "top" | "bottom" | "left" | "right";
  "data-orientation"?: "horizontal" | "vertical";

  /* Tooltip — title attributes are auto-converted to data-tooltip */
  "data-tooltip"?: string;
  "data-tooltip-placement"?: "top" | "bottom" | "left" | "right";

  /* Toast declarative triggers */
  "data-toast"?: string; // message (required to trigger)
  "data-toast-title"?: string;
  "data-toast-variant"?: "info" | "success" | "warning" | "danger";
  "data-toast-placement"?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  "data-toast-duration"?: number | string; // ms
  "data-placement"?: string; // toast container position
  "data-entering"?: boolean; // managed by toast.js
  "data-exiting"?: boolean; // managed by toast.js
  "data-close"?: boolean; // toast dismiss button

  /* Sidebar app shell */
  "data-sidebar-layout"?: "always" | "overlay";
  "data-sidebar-open"?: boolean; // toggled by JS / Ctrl+B
  "data-sidebar-toggle"?: boolean; // toggle button marker
  "data-sidebar-shortcut"?: string; // accelerator key (default "b")
  "data-collapsible"?: "icon"; // with layout="always": collapse to icons
  "data-sidebar"?: boolean; // <aside> panel
  "data-topnav"?: boolean; // top navigation bar in the shell grid
  "data-sidebar-header"?: boolean;
  "data-sidebar-group"?: boolean;
  "data-sidebar-label"?: boolean;
  "data-sidebar-menu"?: boolean;
  "data-sidebar-item"?: boolean; // pair with aria-current="page"
  "data-sidebar-sub"?: boolean; // <ul> inside details sub menu
  "data-sidebar-sub-trigger"?: boolean; // <summary> of a sub menu
  "data-sidebar-sub-item"?: boolean;
  "data-sidebar-badge"?: boolean; // count chip
  "data-sidebar-action"?: boolean; // right-side action icon
  "data-sidebar-media"?: boolean; // leading media slot
  "data-show-on-hover"?: boolean; // reveal action on row hover

  /* Field composition */
  "data-field"?: boolean; // column flex wrapper owning spacing
  "data-hint"?: boolean; // muted hint line (<small>)
  "data-error"?: boolean; // error line (<small class="error">)

  /* Empty states */
  "data-empty"?: boolean; // also used by mo-select placeholder state
  "data-empty-header"?: boolean;
  "data-empty-title"?: boolean;
  "data-empty-description"?: boolean;
  "data-empty-content"?: boolean;
  "data-empty-media"?: boolean; // pair with data-variant="icon|image"

  /* Scroll area */
  "data-scroll-area"?: boolean; // styled scrollable box
  "data-fades"?: boolean | "x" | "xy"; // edge fades per axis
  "data-at-top"?: boolean; // managed by scroll-area.js
  "data-at-bottom"?: boolean;
  "data-at-left"?: boolean;
  "data-at-right"?: boolean;

  /* Aspect ratio — any CSS ratio ("16/9", named values 1/1 · 4/3 · 9/16 · 21/9) */
  "data-aspect-ratio"?: string;

  /* Attachment list */
  "data-attachment"?: boolean; // chip row
  "data-attachment-group"?: boolean;
  "data-attachment-media"?: boolean;
  "data-attachment-content"?: boolean;
  "data-attachment-title"?: boolean;
  "data-attachment-description"?: boolean;
  "data-attachment-trigger"?: boolean; // file-picker label
  "data-attachment-actions"?: boolean;
  "data-attachment-remove"?: boolean; // remove button

  /* Marker (<mark> compositions) */
  "data-marker"?: "border" | "status" | "shimmer";

  /* Questionnaire wizard */
  "data-questionnaire-step"?: boolean; // one step (a <form>)
  "data-questionnaire-progress"?: boolean; // progress slot
  "data-questionnaire-back"?: boolean; // back button
  "data-questionnaire-count"?: boolean; // injected "Step X of N"

  /* Resizable split panes */
  "data-resizable-panel"?: boolean;
  "data-resizable-handle"?: boolean; // hr divider (auto-inserted if absent)
  "data-resizable-grip"?: boolean; // grip icon inside authored handle
  "data-dragging"?: boolean; // managed during drag

  /* Select anatomy */
  "data-select-trigger"?: boolean;
  "data-select-value"?: boolean; // label span inside the trigger

  /* Combobox anatomy */
  "data-combobox"?: boolean; // input + toggle frame
  "data-combobox-toggle"?: boolean;
  "data-combobox-clear"?: boolean; // clear button
  "data-combobox-empty"?: boolean; // no-match row

  /* Command palette / inline card anatomy */
  "data-command-input"?: boolean;
  "data-command-list"?: boolean;
  "data-command-groups"?: boolean;
  "data-command-label"?: boolean;
  "data-command-empty"?: boolean;
  "data-command-footer"?: boolean;

  /* Carousel anatomy */
  "data-carousel"?: boolean; // <section> root
  "data-carousel-track"?: boolean;
  "data-carousel-slide"?: boolean; // pair with data-size sm|lg
  "data-spacing"?: "tight";
  "data-carousel-controls"?: boolean;
  "data-carousel-previous"?: boolean;
  "data-carousel-next"?: boolean;
  "data-carousel-dots"?: boolean; // dots are generated here
  "data-carousel-dot"?: boolean; // generated

  /* Data table behaviors */
  "data-sortable"?: boolean; // <th>; cycles asc → desc → none
  "data-sort-value"?: string; // <td> sort override
  "data-select-all"?: boolean; // header checkbox cell
  "data-select"?: boolean; // row checkbox cell
  "data-selected"?: boolean; // set on checked <tr>
  "data-table-filter"?: boolean; // text filter input
  "data-table-pagination"?: boolean; // footer enabling paging
  "data-table-info"?: boolean; // selection/row count line
  "data-table-prev"?: boolean;
  "data-table-next"?: boolean;

  /* Dropdown / menubar / context menu item anatomy */
  "data-label"?: boolean; // non-interactive group heading
  "data-shortcut"?: boolean; // right-aligned key hint
  "data-inset"?: boolean; // indented item under a label
  "data-dropdown-side"?: "left" | "right"; // force side placement
  "data-context-menu"?: boolean; // right-click region wrapper

  /* Button group */
  "data-button-group"?: boolean;
  "data-button-group-text"?: boolean;
  "data-separator"?: boolean; // <hr> divider segment

  /* Input group */
  "data-input-group"?: boolean;
  "data-addon"?: boolean; // leading/trailing strip
  "data-push"?: boolean; // push trailing addon to the far edge
  "data-align"?: "block-start" | "block-end" | "start" | "center" | "end";

  /* Item rows */
  "data-item-group"?: boolean;
  "data-item"?: boolean;
  "data-item-header"?: boolean;
  "data-item-media"?: boolean;
  "data-item-content"?: boolean;
  "data-item-title"?: boolean;
  "data-item-description"?: boolean;
  "data-item-footer"?: boolean;
  "data-item-actions"?: boolean;

  /* Misc */
  "data-spinner"?: "small" | "large" | "overlay" | (string & {});
  "data-files"?: boolean; // upload badge preview slot
  "data-drag"?: boolean; // managed during upload drag-over
  "data-anchor"?: string; // tabs hash deep-link key
  "data-icon"?: boolean; // icon slot inside buttons
  "data-columns"?: "2" | "3"; // navigation-menu panel columns
  "data-slot"?: string; // shadcn-style alias hook
  "data-theme"?: string;
}

/* ============================================================
 * Shared event detail types
 * ============================================================ */

/** mo-dropdown / mo-menubar / context menu checkbox + radio picks */
interface MoMenuChangeDetail {
  /** The [role=menuitemcheckbox] or [role=menuitemradio] that changed */
  item: HTMLElement;
  /** New aria-checked state */
  checked: boolean;
}

interface MoSortState {
  /** Zero-based column index of the sorted <th> */
  index: number;
  dir: "asc" | "desc";
}

/* ============================================================
 * Custom Elements
 * ============================================================ */

/**
 * mo-tabs — accessible tabs with roving tabindex, arrow keys and hash deep-linking.
 *
 * Anatomy: wrap a `[role=tablist]` with `[role=tab]` buttons and `[role=tabpanel]`
 * panels as direct children.
 * Attributes: data-anchor="key" syncs the active tab id into the URL hash,
 * data-orientation="vertical" for Up/Down navigation, tablist[data-variant="line"]
 * for the underline look.
 */
interface MoTabsElement extends HTMLElement {
  /** Get or set the active tab index */
  activeIndex: number;
  addEventListener<K extends keyof MoTabsEventMap>(
    type: K,
    listener: (this: MoTabsElement, ev: MoTabsEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoTabsEventMap>(
    type: K,
    listener: (this: MoTabsElement, ev: MoTabsEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoTabsEventMap extends HTMLElementEventMap {
  "mo-tab-change": CustomEvent<{ index: number; tab: HTMLElement }>;
}

/**
 * mo-accordion — orchestrates `<details>` children as one accordion.
 *
 * Attributes: type="single" (default) closes siblings, type="multiple" is
 * independent; collapsible allows closing the open single item; details[disabled]
 * blocks a trigger.
 */
interface MoAccordionElement extends HTMLElement {
  /** "single" (default) or "multiple" */
  type: "single" | "multiple";
  /** Single mode only: whether all items may be closed */
  collapsible: boolean;
  addEventListener<K extends keyof MoAccordionEventMap>(
    type: K,
    listener: (this: MoAccordionElement, ev: MoAccordionEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoAccordionEventMap>(
    type: K,
    listener: (this: MoAccordionElement, ev: MoAccordionEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoAccordionEventMap extends HTMLElementEventMap {
  /** Fired when single-mode closes another item */
  "mo-accordion-change": CustomEvent<{ item: HTMLDetailsElement }>;
}

/**
 * mo-dropdown — popover menu tree with positioning, keyboard nav, typeahead,
 * nested popovertarget submenus and focus return. aria-expanded on the trigger
 * is synced automatically.
 *
 * Anatomy: trigger[popovertarget] + menu[popover]; items use role="menuitem",
 * "menuitemcheckbox"/"menuitemradio" (aria-checked), [data-label], [data-shortcut],
 * [data-variant="danger"], [data-inset].
 */
interface MoDropdownElement extends HTMLElement {
  /** The root menu[popover] child */
  rootMenu(): HTMLElement | null;
  addEventListener<K extends keyof MoDropdownEventMap>(
    type: K,
    listener: (this: MoDropdownElement, ev: MoDropdownEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoDropdownEventMap>(
    type: K,
    listener: (this: MoDropdownElement, ev: MoDropdownEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoDropdownEventMap extends HTMLElementEventMap {
  /** Checkbox/radio item toggles */
  "mo-dropdown-change": CustomEvent<MoMenuChangeDetail>;
}

/**
 * mo-menubar — horizontal bar of root menus (File · Edit · View…); each segment
 * runs the full dropdown keyboard model. Same item anatomy as mo-dropdown.
 */
interface MoMenubarElement extends HTMLElement {
  addEventListener<K extends keyof MoMenubarEventMap>(
    type: K,
    listener: (this: MoMenubarElement, ev: MoMenubarEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoMenubarEventMap>(
    type: K,
    listener: (this: MoMenubarElement, ev: MoMenubarEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoMenubarEventMap extends HTMLElementEventMap {
  "mo-menubar-change": CustomEvent<MoMenuChangeDetail>;
}

/**
 * Context menu controller — created internally per [data-context-menu] wrapper.
 * Wrappers present at load are wired automatically (a MutationObserver wires
 * late ones); the module-level `scan(root?)` export re-scans manually when
 * importing src/js/context-menu.js directly.
 */
interface MoContextMenuController {
  /** Remove listeners and stop controlling the wrapper */
  destroy(): void;
  /** Detach window-level scroll/resize repositioning */
  cleanup(): void;
  /** The wrapper's menu[popover] surface */
  rootMenu(): HTMLElement | null;
}

/**
 * mo-carousel — scroll-snap carousel orchestrator over a
 * section[data-carousel] > div[data-carousel-track] > article[data-carousel-slide]
 * with data-carousel-previous/-next buttons and a data-carousel-dots host.
 *
 * Attributes: section[data-orientation="vertical"] flips paging to y-axis;
 * slides take data-size="sm|lg"; data-spacing="tight" narrows gaps.
 */
interface MoCarouselElement extends HTMLElement {
  addEventListener<K extends keyof MoCarouselEventMap>(
    type: K,
    listener: (this: MoCarouselElement, ev: MoCarouselEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoCarouselEventMap>(
    type: K,
    listener: (this: MoCarouselElement, ev: MoCarouselEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoCarouselEventMap extends HTMLElementEventMap {
  /** Debounced after scrolling settles */
  "mo-carousel-change": CustomEvent<{ index: number; count: number }>;
}

/**
 * mo-command — searchable command list (palette or inline card).
 *
 * Anatomy: optional dialog.command opened via commandfor="show-modal";
 * input[data-command-input], div[data-command-list], sections[data-command-groups]
 * with div[data-command-label], button[role="option"] items (value attribute wins),
 * div[data-command-empty].
 */
interface MoCommandElement extends HTMLElement {
  addEventListener<K extends keyof MoCommandEventMap>(
    type: K,
    listener: (this: MoCommandElement, ev: MoCommandEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoCommandEventMap>(
    type: K,
    listener: (this: MoCommandElement, ev: MoCommandEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoCommandEventMap extends HTMLElementEventMap {
  /** An option was chosen; the dialog closes after emitting */
  "mo-command-select": CustomEvent<{ value: string }>;
}

/**
 * mo-combobox — editable input + chevron opening a filterable listbox popover.
 *
 * Anatomy: div[data-combobox] wrapping input[role="combobox"] +
 * button[data-combobox-toggle]; ul[popover][role="listbox"] with
 * button[role="option"][value] children; li[data-combobox-empty];
 * button[data-combobox-clear]; options accept data-keywords for extra matches.
 */
interface MoComboboxElement extends HTMLElement {
  addEventListener<K extends keyof MoComboboxEventMap>(
    type: K,
    listener: (this: MoComboboxElement, ev: MoComboboxEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoComboboxEventMap>(
    type: K,
    listener: (this: MoComboboxElement, ev: MoComboboxEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoComboboxEventMap extends HTMLElementEventMap {
  /** On pick or clear ('' when cleared) */
  "mo-combobox-change": CustomEvent<{ value: string }>;
}

/**
 * mo-select — custom listbox select on the Popover API.
 *
 * Attributes: data-placeholder shows while no value is chosen (host gets
 * data-empty until a pick). Anatomy: button[data-select-trigger][popovertarget] +
 * ul[popover][role="listbox"] with button[role="option"][value] options;
 * li[role="group"] > div[data-label] groups options.
 * Form participation: name/required mirror onto a managed hidden input, so
 * the value submits with forms and reportValidity() gates empty picks.
 */
interface MoSelectElement extends HTMLElement {
  /** The selected option's value (or text); null while unset */
  readonly value: string | null;
  addEventListener<K extends keyof MoSelectEventMap>(
    type: K,
    listener: (this: MoSelectElement, ev: MoSelectEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoSelectEventMap>(
    type: K,
    listener: (this: MoSelectElement, ev: MoSelectEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoSelectEventMap extends HTMLElementEventMap {
  "mo-select-change": CustomEvent<{ value: string }>;
}

/**
 * mo-data-table — upgrades a plain semantic table with sorting, selection,
 * filtering and pagination. Markup stays the source of truth.
 *
 * Attributes: th[data-sortable] (+ td[data-sort-value] override),
 * th[data-select-all] + td[data-select] checkboxes (rows get data-selected),
 * input[data-table-filter], footer[data-table-pagination] with
 * span[data-table-info] + button[data-table-prev]/[data-table-next],
 * data-page-size on the host (default 10).
 */
interface MoDataTableElement extends HTMLElement {
  addEventListener<K extends keyof MoDataTableEventMap>(
    type: K,
    listener: (this: MoDataTableElement, ev: MoDataTableEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoDataTableEventMap>(
    type: K,
    listener: (this: MoDataTableElement, ev: MoDataTableEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoDataTableEventMap extends HTMLElementEventMap {
  /** Emitted on every sort/filter/page/selection change */
  "mo-table-change": CustomEvent<{
    sort: MoSortState | null;
    page: number;
    selected: HTMLTableRowElement[];
  }>;
}

/**
 * mo-resizable — split panes over flex + Pointer Events.
 *
 * Attributes: data-orientation="vertical", data-sizes="25,75" (persisted live,
 * restored on init); panels are direct [data-resizable-panel] children with
 * optional data-min percent (default 10); hr[data-resizable-handle] dividers are
 * auto-inserted unless authored (wrap grip icons in a div[data-resizable-handle]).
 */
interface MoResizableElement extends HTMLElement {
  /** Current panel sizes as percentages rounded to 2 decimals */
  sizes(): number[];
  addEventListener<K extends keyof MoResizableEventMap>(
    type: K,
    listener: (this: MoResizableElement, ev: MoResizableEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoResizableEventMap>(
    type: K,
    listener: (this: MoResizableElement, ev: MoResizableEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoResizableEventMap extends HTMLElementEventMap {
  /** Fires on pointerup / keyup, not every move */
  "mo-resize": CustomEvent<{ sizes: number[] }>;
}

/**
 * mo-toggle-group — orchestrates direct-child button[aria-pressed] toggles.
 *
 * Attributes: type="single" (default) un-presses siblings like a radio group,
 * type="multiple" flips independently; collapsible allows unpressing the active
 * single button. Buttons carry value attributes.
 */
interface MoToggleGroupElement extends HTMLElement {
  /** Values of the pressed buttons */
  values(): string[];
  addEventListener<K extends keyof MoToggleGroupEventMap>(
    type: K,
    listener: (this: MoToggleGroupElement, ev: MoToggleGroupEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoToggleGroupEventMap>(
    type: K,
    listener: (this: MoToggleGroupElement, ev: MoToggleGroupEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoToggleGroupEventMap extends HTMLElementEventMap {
  "mo-toggle-change": CustomEvent<{ values: string[] }>;
}

/**
 * mo-hovercard — trigger + card revealed on hover/focus with hover intent
 * (~200ms) and a close grace period (~100ms). Anatomy: first :not([popover])
 * child is the trigger, second is div[popover]. Card takes data-side="top"
 * to prefer above; Esc/light-dismiss close natively.
 */
interface MoHovercardElement extends HTMLElement {}

/**
 * mo-otp — one-time-password field rendering N joined single-char inputs.
 *
 * Attributes: length (cell count, default 4, clamped 1–12), name (hidden input
 * mirrors the full value for form submits), value (initial, distributed left to
 * right), data-pattern="numeric" (default) | "alphanumeric", disabled.
 */
interface MoOtpElement extends HTMLElement {
  /** Read/write string of the entered characters */
  value: string;
  addEventListener(
    type: "change",
    listener: (this: MoOtpElement, ev: CustomEvent<{ value: string }>) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "change",
    listener: (this: MoOtpElement, ev: CustomEvent<{ value: string }>) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

/**
 * mo-questionnaire — multi-step wizard over sibling form[data-questionnaire-step]
 * children. Continue validates through reportValidity; completion merges every
 * step's fields.
 *
 * Attributes: div[data-questionnaire-progress] slot (renders "Step X of N" +
 * progress), button[data-questionnaire-back], data-start="N" opens on step N,
 * data-reset clears fields and returns to step 1 after completion.
 */
interface MoQuestionnaireElement extends HTMLElement {
  /** Every step's fields merged into one FormData */
  values(): FormData;
  addEventListener<K extends keyof MoQuestionnaireEventMap>(
    type: K,
    listener: (this: MoQuestionnaireElement, ev: MoQuestionnaireEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof MoQuestionnaireEventMap>(
    type: K,
    listener: (this: MoQuestionnaireElement, ev: MoQuestionnaireEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

interface MoQuestionnaireEventMap extends HTMLElementEventMap {
  "mo-questionnaire-complete": CustomEvent<{ values: FormData }>;
}

/**
 * mo-upload — wraps a native file input; picked/dropped files render as
 * removable badges in the optional [data-files] element (drag-over sets
 * data-drag). The native change event bubbles on picker, drop and removal.
 *
 * Anatomy: input[type="file"] (hidden ok) + a click target + div[data-files].
 */
interface MoUploadElement extends HTMLElement {}

/**
 * mo-taginput — manages tag badges over a native <input>, with optional
 * <datalist> autocomplete (options may carry option.data objects).
 *
 * Attribute: value="a, b" seeds comma-separated tags.
 */
interface MoTaginputElement extends HTMLElement {
  /** The internal <input> element */
  readonly input: HTMLInputElement | null;
  /** Get or set tags as an array of strings or objects */
  value: (string | { toString(): string })[];
  /** Add a tag (string or object); silent skips the input event */
  add(v: string | { toString(): string }, silent?: boolean): void;
  /** Remove a tag element (optional argument mirrors Element.remove for compat) */
  remove(el?: Element | null): void;
  addEventListener(
    type: "input",
    listener: (
      this: MoTaginputElement,
      ev: CustomEvent<(string | { toString(): string })[]>
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: "input",
    listener: (
      this: MoTaginputElement,
      ev: CustomEvent<(string | { toString(): string })[]>
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

/* ============================================================
 * window.mo — Toast API
 * ============================================================ */
interface MoToastOptions {
  variant?: "info" | "success" | "warning" | "danger" | "error" | "loading";
  placement?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  duration?: number;
  richColors?: boolean;
  closeButton?: boolean;
  description?: string;
}

interface MoToastMessages<TData = unknown> {
  loading?: string;
  success?: string | ((data: TData) => string);
  error?: string | ((error: unknown) => string);
}

interface MoToastAPI {
  (message: string, title?: string, options?: MoToastOptions): HTMLElement;
  el(element: HTMLElement | HTMLTemplateElement, options?: MoToastOptions): HTMLElement | undefined;
  clear(placement?: string): void;
  dismiss(placement?: string): void;
  promise<TData = unknown>(
    promise: Promise<TData>,
    messages?: MoToastMessages<TData>,
    options?: MoToastOptions,
  ): HTMLElement;
  success(message: string, title?: string, options?: MoToastOptions): HTMLElement;
  error(message: string, title?: string, options?: MoToastOptions): HTMLElement;
  info(message: string, title?: string, options?: MoToastOptions): HTMLElement;
  warning(message: string, title?: string, options?: MoToastOptions): HTMLElement;
  loading(message: string, title?: string, options?: MoToastOptions): HTMLElement;
  message(message: string, title?: string, options?: MoToastOptions): HTMLElement;
}

interface MoWindow {
  toast: MoToastAPI;
}

/* ============================================================
 * Utility class names
 * ============================================================ */
interface MoUtilityClasses {
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

/* ============================================================
 * Global augmentations
 * ============================================================ */

/**
 * JSX entry helper. Uses lazy `import('react')` so this file stays usable
 * without @types/react installed; requires @types/react once instantiated
 * (i.e. whenever you actually author <mo-*> elements in JSX).
 * `P` carries element-specific attributes beyond HTMLAttributes (data-* is
 * already accepted by React's typings).
 */
type MoJSX<T extends HTMLElement, P extends object = {}> =
  import('react').DetailedHTMLProps<import('react').HTMLAttributes<T> & P, T>;

/** Attributes shared by mo-accordion / mo-toggle-group */
interface MoGroupJSXProps {
  type?: "single" | "multiple";
  collapsible?: boolean;
}

declare global {
  // Attribute-driven component autocomplete on every element
  interface HTMLElement extends Partial<MoDataAttributes> {}

  // Typed custom events on any node (all mo events bubble + composed)
  interface HTMLElementEventMap {
    "mo-tab-change": CustomEvent<{ index: number; tab: HTMLElement }>;
    "mo-accordion-change": CustomEvent<{ item: HTMLDetailsElement }>;
    "mo-dropdown-change": CustomEvent<MoMenuChangeDetail>;
    "mo-menubar-change": CustomEvent<MoMenuChangeDetail>;
    "mo-context-menu-change": CustomEvent<MoMenuChangeDetail>;
    "mo-carousel-change": CustomEvent<{ index: number; count: number }>;
    "mo-command-select": CustomEvent<{ value: string }>;
    "mo-combobox-change": CustomEvent<{ value: string }>;
    "mo-select-change": CustomEvent<{ value: string }>;
    "mo-table-change": CustomEvent<{
      sort: MoSortState | null;
      page: number;
      selected: HTMLTableRowElement[];
    }>;
    "mo-resize": CustomEvent<{ sizes: number[] }>;
    "mo-toggle-change": CustomEvent<{ values: string[] }>;
    "mo-questionnaire-complete": CustomEvent<{ values: FormData }>;
    "mo-sidebar-toggle": CustomEvent<{ open: boolean }>;
  }

  interface HTMLElementTagNameMap {
    "mo-tabs": MoTabsElement;
    "mo-accordion": MoAccordionElement;
    "mo-dropdown": MoDropdownElement;
    "mo-upload": MoUploadElement;
    "mo-taginput": MoTaginputElement;
    "mo-toggle-group": MoToggleGroupElement;
    "mo-hovercard": MoHovercardElement;
    "mo-menubar": MoMenubarElement;
    "mo-carousel": MoCarouselElement;
    "mo-command": MoCommandElement;
    "mo-combobox": MoComboboxElement;
    "mo-select": MoSelectElement;
    "mo-otp": MoOtpElement;
    "mo-resizable": MoResizableElement;
    "mo-data-table": MoDataTableElement;
    "mo-questionnaire": MoQuestionnaireElement;
  }

  interface Window {
    mo?: MoWindow;
  }

  // Allow design tokens in inline styles: style={{ '--mo-card-padding': '...' }}
  namespace React {
    interface CSSProperties extends Partial<MoCSSVariables> {}
  }

  // JSX support — legacy global JSX namespace (React <= 18)
  namespace JSX {
    interface IntrinsicElements {
      "mo-tabs": MoJSX<MoTabsElement>;
      "mo-accordion": MoJSX<MoAccordionElement, MoGroupJSXProps>;
      "mo-dropdown": MoJSX<MoDropdownElement>;
      "mo-upload": MoJSX<MoUploadElement>;
      "mo-taginput": MoJSX<MoTaginputElement, { value?: string }>;
      "mo-toggle-group": MoJSX<MoToggleGroupElement, MoGroupJSXProps>;
      "mo-hovercard": MoJSX<MoHovercardElement>;
      "mo-menubar": MoJSX<MoMenubarElement>;
      "mo-carousel": MoJSX<MoCarouselElement>;
      "mo-command": MoJSX<MoCommandElement>;
      "mo-combobox": MoJSX<MoComboboxElement>;
      "mo-select": MoJSX<MoSelectElement>;
      "mo-otp": MoJSX<MoOtpElement, {
        length?: number | string;
        name?: string;
        value?: string;
        disabled?: boolean;
      }>;
      "mo-resizable": MoJSX<MoResizableElement>;
      "mo-data-table": MoJSX<MoDataTableElement>;
      "mo-questionnaire": MoJSX<MoQuestionnaireElement>;
    }
  }
}

// JSX support — React 19 moved JSX under the react module
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      "mo-tabs": MoJSX<MoTabsElement>;
      "mo-accordion": MoJSX<MoAccordionElement, MoGroupJSXProps>;
      "mo-dropdown": MoJSX<MoDropdownElement>;
      "mo-upload": MoJSX<MoUploadElement>;
      "mo-taginput": MoJSX<MoTaginputElement, { value?: string }>;
      "mo-toggle-group": MoJSX<MoToggleGroupElement, MoGroupJSXProps>;
      "mo-hovercard": MoJSX<MoHovercardElement>;
      "mo-menubar": MoJSX<MoMenubarElement>;
      "mo-carousel": MoJSX<MoCarouselElement>;
      "mo-command": MoJSX<MoCommandElement>;
      "mo-combobox": MoJSX<MoComboboxElement>;
      "mo-select": MoJSX<MoSelectElement>;
      "mo-otp": MoJSX<MoOtpElement, {
        length?: number | string;
        name?: string;
        value?: string;
        disabled?: boolean;
      }>;
      "mo-resizable": MoJSX<MoResizableElement>;
      "mo-data-table": MoJSX<MoDataTableElement>;
      "mo-questionnaire": MoJSX<MoQuestionnaireElement>;
    }
  }
}

/* ============================================================
 * Native HTML attributes React's types don't fully model yet
 * ============================================================
 * Mo is built on the declarative Popover + Command Web-platform APIs.
 * React 19 already ships camelCase `popoverTarget` / `popoverTargetAction`
 * (and renders them as lowercase), so no augmentation is needed for those.
 * The Command API (`command` / `commandfor`) is NOT in @types/react yet:
 * the lowercase spelling below types it AND renders verbatim to the DOM —
 * exactly what the platform API reads. (React's own camelCase convention
 * would be `commandFor`, but react-dom doesn't map it, so it leaks as an
 * unknown prop instead of the real attribute.)
 *
 * Declaring them on the `react` module's ButtonHTMLAttributes (not via the
 * `declare global` JSX block) means:
 *   - It covers BOTH the legacy global JSX namespace (React <= 18) and the
 *     React 19 module JSX namespace, because both resolve `button` through
 *     the same `React.ButtonHTMLAttributes`.
 *   - Vanilla TS consumers without @types/react are unaffected (this ambient
 *     module augmentation only merges when the `react` types are present).
 *   - It extends `HTMLAttributes` only implicitly: same-named interface
 *     members merge, so we add our props without referencing `HTMLAttributes`
 *     by name (which would error in a no-@types/react project).
 *
 * A note on `popover`: React 19 already types it as
 * `"" | "auto" | "manual" | "hint"`, so `<menu popover="auto">` and
 * `<div popover="">` are valid as-is. Widening it to accept bare `popover`
 * (boolean) is NOT possible via module augmentation — declaration merging
 * intersects the two `popover` declarations and the narrow string union wins.
 * Use the explicit spellings (`popover="auto"` / `popover=""`) instead, which
 * render identically to the bare boolean form.
 */
declare module 'react' {
  interface ButtonHTMLAttributes<T> {
    /** Declarative Command API: the command to invoke (e.g. "show-modal"). */
    command?: string;
    /** Declarative Command API: id of the target element (a <dialog>, etc.).
        Lowercase is intentional — it is the real HTML attribute name. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commandfor?: any;
  }
}

// Public types are importable: import type { MoOtpElement } from '@sayagodev/mo'
export type {
  MoCSSVariables,
  MoDataAttributes,
  MoUtilityClasses,
  MoMenuChangeDetail,
  MoSortState,
  MoTabsElement,
  MoTabsEventMap,
  MoAccordionElement,
  MoAccordionEventMap,
  MoDropdownElement,
  MoDropdownEventMap,
  MoMenubarElement,
  MoMenubarEventMap,
  MoContextMenuController,
  MoCarouselElement,
  MoCarouselEventMap,
  MoCommandElement,
  MoCommandEventMap,
  MoComboboxElement,
  MoComboboxEventMap,
  MoSelectElement,
  MoSelectEventMap,
  MoDataTableElement,
  MoDataTableEventMap,
  MoResizableElement,
  MoResizableEventMap,
  MoToggleGroupElement,
  MoToggleGroupEventMap,
  MoHovercardElement,
  MoOtpElement,
  MoQuestionnaireElement,
  MoQuestionnaireEventMap,
  MoUploadElement,
  MoTaginputElement,
  MoToastOptions,
  MoToastMessages,
  MoToastAPI,
  MoWindow,
};
