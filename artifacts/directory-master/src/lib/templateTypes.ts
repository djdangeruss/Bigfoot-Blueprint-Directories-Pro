export type FontKey = "inter" | "poppins" | "roboto" | "georgia" | "playfair" | "montserrat";

export interface FontOption {
  key: FontKey;
  label: string;
  family: string;
  googleUrl: string;
}

export const FONTS: FontOption[] = [
  { key: "inter",      label: "Inter",            family: "'Inter', sans-serif",            googleUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
  { key: "poppins",    label: "Poppins",          family: "'Poppins', sans-serif",          googleUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" },
  { key: "roboto",     label: "Roboto",           family: "'Roboto', sans-serif",           googleUrl: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" },
  { key: "georgia",    label: "Georgia",          family: "Georgia, 'Times New Roman', serif", googleUrl: "" },
  { key: "playfair",   label: "Playfair Display", family: "'Playfair Display', serif",      googleUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" },
  { key: "montserrat", label: "Montserrat",       family: "'Montserrat', sans-serif",       googleUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" },
];

export function getFontFamily(key: string): string {
  return FONTS.find(f => f.key === key)?.family ?? FONTS[0].family;
}

export function getFontGoogleUrl(key: string): string {
  return FONTS.find(f => f.key === key)?.googleUrl ?? "";
}

export interface SectionProps {
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
  textAlignment?: "left" | "center" | "right";
  padding?: "sm" | "md" | "lg";
  buttonText?: string;
  buttonUrl?: string;
  buttonColor?: string;
  bodyText?: string;
  richBodyText?: string;
  imageUrl?: string;
  imageCaption?: string;
  maxItems?: number;
  columns?: number;
  sidebarTitle?: string;
  overlayOpacity?: number;
  headingFontSize?: string;
  headingColor?: string;
  bodyFontSize?: string;
  fontFamily?: string;
  buttonTarget?: "_blank" | "_self";
  buttonRadius?: "rounded" | "square";
  buttonTextColor?: string;
  thankYouMessage?: string;
}

export interface SectionConfig {
  id: string;
  type?: string;
  label: string;
  enabled: boolean;
  heading?: string;
  props?: SectionProps;
}

export function getBlockType(block: SectionConfig): string {
  return block.type ?? block.id;
}

export interface BlockDefinition {
  type: string;
  label: string;
  description: string;
  defaultProps?: SectionProps;
  defaultHeading?: string;
}

export const HOMEPAGE_BLOCK_DEFS: BlockDefinition[] = [
  { type: "hero",        label: "Hero Banner",      description: "Full-width headline with optional background image and CTA button", defaultProps: { textAlignment: "center", overlayOpacity: 50 } },
  { type: "categories",  label: "Category Grid",    description: "Grid of clickable category cards", defaultHeading: "Browse by Category", defaultProps: { maxItems: 8, columns: 4 } },
  { type: "featured",    label: "Featured Entries", description: "Grid of featured/highlighted entries", defaultHeading: "Featured", defaultProps: { maxItems: 3, columns: 3 } },
  { type: "recent",      label: "Recent Entries",   description: "Most recently added directory entries", defaultHeading: "Recently Added", defaultProps: { maxItems: 6, columns: 3 } },
  { type: "custom-text", label: "Text Block",       description: "Custom heading and body text paragraph", defaultProps: { textAlignment: "left", bodyText: "Add your custom content here." } },
  { type: "custom-image",label: "Image Block",      description: "Display a full-width image with optional caption", defaultProps: {} },
  { type: "custom-cta",  label: "Call to Action",  description: "A prominent button with optional heading and description", defaultProps: { textAlignment: "center", buttonText: "Get Started", buttonRadius: "rounded", buttonTarget: "_self" } },
  { type: "custom-claim", label: "Claim Your Listing", description: "Opt-in form to capture name, phone, and email leads", defaultProps: { textAlignment: "center", buttonText: "Submit", thankYouMessage: "Thank you! We'll be in touch soon." } },
];

export const BROWSE_BLOCK_DEFS: BlockDefinition[] = [
  { type: "header",  label: "Page Header",      description: "Title and result count for the browse page", defaultHeading: "All Entries" },
  { type: "filters", label: "Search & Filters", description: "Search bar and category sidebar filter panel" },
  { type: "grid",    label: "Entry Cards Grid", description: "Main grid of directory entry cards" },
];

export const ENTRY_BLOCK_DEFS: BlockDefinition[] = [
  { type: "header",      label: "Title & Summary",        description: "Entry title, category badge, and summary" },
  { type: "description", label: "Description",            description: "Full description body text" },
  { type: "moreDetails", label: "Additional Information", description: "Extended details section" },
  { type: "sidebar",     label: "Details Sidebar",        description: "Contact info and metadata in a side panel", defaultProps: { sidebarTitle: "Contact & Details" } },
  { type: "related",     label: "Related Entries",        description: "Grid of similar entries in the same category", defaultHeading: "Related Entries", defaultProps: { maxItems: 3 } },
  { type: "claim",       label: "Claim Yours Now",        description: "Opt-in form to capture name, phone, and email for this listing", defaultHeading: "Claim Yours Now", defaultProps: { buttonText: "Submit", thankYouMessage: "Thank you! We'll be in touch soon.", textAlignment: "center" } },
];

export function getBlockDefs(pageType: string): BlockDefinition[] {
  if (pageType === "homepage") return HOMEPAGE_BLOCK_DEFS;
  if (pageType === "browse")   return BROWSE_BLOCK_DEFS;
  return ENTRY_BLOCK_DEFS;
}

export interface HomepageTemplate {
  font: string;
  heroImageUrl: string;
  heroBgColor: string;
  sections: SectionConfig[];
}

export interface BrowseTemplate {
  font: string;
  heroImageUrl: string;
  cardFields: string[];
  cardImageFields: string[];
  sections: SectionConfig[];
}

// Per-custom-field display settings stored in the entry template
export interface CustomFieldDisplay {
  key: string;
  showTitle: boolean;       // whether to render the field's h3 label
  displayAsImage: boolean;  // force-render the value as an <img>
  displayAsButton?: boolean; // render the value as a CTA button/link (mutually exclusive with displayAsImage)
  buttonText?: string;       // custom label for the CTA button (falls back to field label)
  section?: "header" | "description" | "sidebar"; // which entry section to appear in (default: "description")
  icon?: string; // Lucide icon name to show next to the field label on the frontend
}

export interface EntryTemplate {
  font: string;
  sidebarFields: string[];
  sections: SectionConfig[];
  customFieldDisplay?: CustomFieldDisplay[];
}

export interface TemplateSettings {
  homepage: HomepageTemplate;
  browse: BrowseTemplate;
  entry: EntryTemplate;
}

export const DEFAULT_HOMEPAGE_SECTIONS: SectionConfig[] = [
  { id: "hero",       label: "Hero Banner",       enabled: true, heading: "" },
  { id: "categories", label: "Category Grid",     enabled: true, heading: "Browse by Category" },
  { id: "featured",   label: "Featured Entries",  enabled: true, heading: "Featured" },
  { id: "recent",     label: "Recently Added",    enabled: true, heading: "Recently Added" },
];

export const DEFAULT_BROWSE_SECTIONS: SectionConfig[] = [
  { id: "header",  label: "Page Header",       enabled: true, heading: "All Entries" },
  { id: "filters", label: "Search & Filters",  enabled: true },
  { id: "grid",    label: "Entry Cards Grid",  enabled: true },
];

export const DEFAULT_ENTRY_SECTIONS: SectionConfig[] = [
  { id: "header",      label: "Title & Summary",        enabled: true },
  { id: "description", label: "Description",            enabled: true },
  { id: "moreDetails", label: "Additional Information", enabled: true },
  { id: "sidebar",     label: "Details Sidebar",        enabled: true },
  { id: "claim",       label: "Claim Yours Now",        enabled: true, heading: "Claim Yours Now", props: { buttonText: "Submit", thankYouMessage: "Thank you! We'll be in touch soon.", textAlignment: "center" } },
  { id: "related",     label: "Related Entries",        enabled: true },
];

export const BROWSE_CARD_FIELDS: Array<{ id: string; label: string }> = [
  { id: "category",  label: "Category Badge" },
  { id: "location",  label: "Location" },
  { id: "startDate", label: "Start Date" },
  { id: "endDate",   label: "End Date" },
  { id: "venue",     label: "Venue" },
  { id: "eventType", label: "Event Type" },
  { id: "tags",      label: "Tags" },
  { id: "website",   label: "Website" },
];

export const ENTRY_SIDEBAR_FIELDS: Array<{ id: string; label: string }> = [
  { id: "eventType",    label: "Event Type" },
  { id: "startDate",    label: "Start / End Dates" },
  { id: "venue",        label: "Venue" },
  { id: "location",     label: "Location" },
  { id: "website",      label: "Website" },
  { id: "contactEmail", label: "Email" },
  { id: "contactPhone", label: "Phone" },
  { id: "tags",         label: "Tags" },
];

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  homepage: { font: "inter", heroImageUrl: "", heroBgColor: "", sections: DEFAULT_HOMEPAGE_SECTIONS },
  browse:   { font: "inter", heroImageUrl: "", cardFields: ["category", "location", "startDate", "tags"], cardImageFields: [], sections: DEFAULT_BROWSE_SECTIONS },
  entry:    { font: "inter", sidebarFields: ["eventType", "startDate", "venue", "location", "website", "contactEmail", "contactPhone", "tags"], sections: DEFAULT_ENTRY_SECTIONS },
};

function mergeSections(stored: SectionConfig[] | undefined, defaults: SectionConfig[]): SectionConfig[] {
  if (!stored || stored.length === 0) return defaults;
  const storedIds = new Set(stored.map(s => s.id));
  const missing = defaults.filter(d => !storedIds.has(d.id));
  return [...stored, ...missing];
}

export function mergeTemplateSettings(stored: Partial<TemplateSettings> | null | undefined): TemplateSettings {
  if (!stored) return DEFAULT_TEMPLATE_SETTINGS;
  return {
    homepage: {
      ...DEFAULT_TEMPLATE_SETTINGS.homepage,
      ...stored.homepage,
      sections: mergeSections(stored.homepage?.sections, DEFAULT_HOMEPAGE_SECTIONS),
    },
    browse: {
      ...DEFAULT_TEMPLATE_SETTINGS.browse,
      ...stored.browse,
      sections: mergeSections(stored.browse?.sections, DEFAULT_BROWSE_SECTIONS),
      cardFields: stored.browse?.cardFields ?? DEFAULT_TEMPLATE_SETTINGS.browse.cardFields,
      cardImageFields: stored.browse?.cardImageFields ?? DEFAULT_TEMPLATE_SETTINGS.browse.cardImageFields,
    },
    entry: {
      ...DEFAULT_TEMPLATE_SETTINGS.entry,
      ...stored.entry,
      sections: mergeSections(stored.entry?.sections, DEFAULT_ENTRY_SECTIONS),
      sidebarFields: stored.entry?.sidebarFields ?? DEFAULT_TEMPLATE_SETTINGS.entry.sidebarFields,
      customFieldDisplay: stored.entry?.customFieldDisplay ?? undefined,
    },
  };
}
