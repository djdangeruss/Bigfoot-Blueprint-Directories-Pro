export type DirectoryProfileId = "colrest" | "lender" | "horse" | "generic";

export type DirectoryProfile = {
  id: DirectoryProfileId;
  language: string;
  defaultSiteName: string;
  homeTitle: string;
  homeDescription: string;
  homeHeading: string;
  browseTitle: string;
  browseHeading: string;
  singularLabel: string;
  pluralLabel: string;
  entrySchemaType: "Restaurant" | "FinancialService" | "Thing";
  hasEditorialInfoPages: boolean;
};

const PROFILES: Record<DirectoryProfileId, DirectoryProfile> = {
  colrest: {
    id: "colrest",
    language: "en-US",
    defaultSiteName: "Colombian Restaurants Near Me",
    homeTitle: "Colombian Restaurants Near Me | Miami & South Florida",
    homeDescription: "Discover Colombian restaurants in Miami, Doral, Hialeah and Miami Beach with useful restaurant details and independently attributed reputation signals.",
    homeHeading: "Find your next Colombian table",
    browseTitle: "Browse Colombian Restaurants in South Florida",
    browseHeading: "Browse Colombian restaurants",
    singularLabel: "restaurant",
    pluralLabel: "restaurants",
    entrySchemaType: "Restaurant",
    hasEditorialInfoPages: true,
  },
  lender: {
    id: "lender",
    language: "en-US",
    defaultSiteName: "Startup Business Loans Directory",
    homeTitle: "Startup Business Loans Directory | Find SBA Lenders",
    homeDescription: "Browse SBA-approved lenders by city and state. Compare the public directory before contacting a lender about startup or small-business financing.",
    homeHeading: "Find SBA-approved lenders",
    browseTitle: "Browse SBA-Approved Lenders",
    browseHeading: "Browse SBA-approved lenders",
    singularLabel: "lender",
    pluralLabel: "lenders",
    entrySchemaType: "FinancialService",
    hasEditorialInfoPages: false,
  },
  horse: {
    id: "horse",
    language: "es",
    defaultSiteName: "Caballos en Venta",
    homeTitle: "Caballos en Venta | Mercado Ecuestre Internacional",
    homeDescription: "Explora caballos en venta y vendedores del mercado ecuestre en Latinoamérica, España y otros mercados de habla hispana.",
    homeHeading: "Encuentra caballos en venta",
    browseTitle: "Explora Caballos en Venta",
    browseHeading: "Explora caballos en venta",
    singularLabel: "caballo",
    pluralLabel: "caballos",
    entrySchemaType: "Thing",
    hasEditorialInfoPages: false,
  },
  generic: {
    id: "generic",
    language: "en",
    defaultSiteName: "Directory",
    homeTitle: "Directory",
    homeDescription: "Browse verified directory listings.",
    homeHeading: "Browse the directory",
    browseTitle: "Browse Directory Listings",
    browseHeading: "Browse directory listings",
    singularLabel: "listing",
    pluralLabel: "listings",
    entrySchemaType: "Thing",
    hasEditorialInfoPages: false,
  },
};

export function directoryProfile(origin: string, explicitProfile = process.env.DIRECTORY_PROFILE): DirectoryProfile {
  if (explicitProfile) {
    if (!(explicitProfile in PROFILES)) {
      throw new Error(`Unsupported DIRECTORY_PROFILE: ${explicitProfile}`);
    }
    return PROFILES[explicitProfile as DirectoryProfileId];
  }

  const hostname = new URL(origin).hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "colombianrestaurantnear.me") return PROFILES.colrest;
  if (hostname === "startupbusinessloans.online") return PROFILES.lender;
  if (hostname === "caballosenventa.co") return PROFILES.horse;
  return PROFILES.generic;
}
