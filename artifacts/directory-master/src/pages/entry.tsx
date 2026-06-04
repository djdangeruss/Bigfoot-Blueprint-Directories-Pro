import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useGetPublicEntry,
  useListPublicEntries,
  useGetPublicSettings,
  useGetCurrentUser,
  useUpdateSettings,
  useCreateContact,
  getGetPublicSettingsQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Globe, Mail, Phone, ChevronLeft, Tag, Loader2,
  Building2, CalendarDays, Layers, Pencil, GripVertical,
  EyeOff, Eye, Save, X, LayoutTemplate, CheckCircle2, FileImage, ExternalLink,
  // Icon picker — location
  Map, Compass, Navigation, Home, Building, Warehouse, Store, Hotel, School, Landmark,
  // Icon picker — contact
  PhoneCall, MessageCircle, MessageSquare, AtSign, Link as LinkIcon, Send,
  // Icon picker — business
  Briefcase, DollarSign, CreditCard, Receipt, ShoppingCart, ShoppingBag, Package,
  BarChart2, TrendingUp, Award, Trophy, Handshake, Coins, PiggyBank,
  // Icon picker — time
  Calendar, Clock, AlarmClock, Timer, Watch,
  // Icon picker — people
  User, Users, UserCheck, Heart, Star, ThumbsUp, Smile,
  // Icon picker — documents
  FileText, File, Clipboard, Info, BookOpen, Hash, ClipboardList, Newspaper,
  // Icon picker — technology
  Monitor, Laptop, Smartphone, Wifi, Cloud, Server, Code, Database, Cpu,
  // Icon picker — nature
  Leaf, Sun, Droplets, Recycle, Wind, Thermometer, Trees,
  // Icon picker — transport
  Car, Bus, Bike, Plane, Ship, Train,
  // Icon picker — activities
  Music, Camera, Video, Dumbbell, Utensils, Coffee, Scissors, Gamepad2,
  // Icon picker — misc
  Zap, Flame, Sparkles, AlertCircle, HelpCircle, Shield, Lock, Key, Flag, Bookmark, Settings,
  CheckCircle, Search,
} from "lucide-react";
import { format } from "date-fns";
import { FontLoader } from "@/components/template/FontLoader";
import {
  mergeTemplateSettings, getFontFamily, ENTRY_SIDEBAR_FIELDS,
  ENTRY_BLOCK_DEFS,
} from "@/lib/templateTypes";
import type { SectionConfig, SectionProps, CustomFieldDisplay } from "@/lib/templateTypes";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, DragOverlay, DragEndEvent, DragStartEvent,
  useSensor, useSensors, PointerSensor,
  useDraggable, useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Claim Yours Now form block ────────────────────────────────────────────────
function EntryClaimFormBlock({ section }: { section: SectionConfig }) {
  const p = section.props ?? {};
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const createContact = useCreateContact();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await createContact.mutateAsync({ data: { fullName, phone, email } });
      setSubmitted(true);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  const alignClass = p.textAlignment === "center" ? "text-center" : p.textAlignment === "right" ? "text-right" : "text-left";

  if (submitted) {
    return (
      <div className={`flex flex-col items-center gap-3 px-8 py-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 max-w-md ${p.textAlignment === "center" ? "mx-auto" : ""}`}>
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="font-medium text-green-800 dark:text-green-300">
          {p.thankYouMessage || "Thank you! We'll be in touch soon."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-md space-y-3 ${p.textAlignment === "center" ? "mx-auto" : ""}`}>
      <div className={alignClass}>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Full Name <span className="text-red-500">*</span>
        </label>
        <Input type="text" required placeholder="Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} />
      </div>
      <div className={alignClass}>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Phone Number <span className="text-red-500">*</span>
        </label>
        <Input type="tel" required placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      <div className={alignClass}>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Email Address <span className="text-red-500">*</span>
        </label>
        <Input type="email" required placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
      <Button
        type="submit"
        disabled={createContact.isPending}
        className="w-full"
        style={{
          ...(p.buttonColor ? { backgroundColor: p.buttonColor, borderColor: p.buttonColor } : {}),
          ...(p.buttonTextColor ? { color: p.buttonTextColor } : {}),
        }}
      >
        {createContact.isPending
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
          : (p.buttonText || "Submit")}
      </Button>
    </form>
  );
}

// ─── Icon picker — curated icon map & components ──────────────────────────────
type IconComponent = React.ComponentType<{ className?: string }>;

const ICON_MAP: Record<string, IconComponent> = {
  // Location
  MapPin, Map, Globe, Compass, Navigation, Home, Building, Building2,
  Warehouse, Store, Hotel, School, Landmark,
  // Contact
  Mail, Phone, PhoneCall, MessageCircle, MessageSquare, AtSign, LinkIcon, Send,
  // Business
  Briefcase, DollarSign, CreditCard, Receipt, ShoppingCart, ShoppingBag,
  Package, BarChart2, TrendingUp, Award, Trophy, Handshake, Coins, PiggyBank,
  // Time
  Calendar, Clock, CalendarDays, AlarmClock, Timer, Watch,
  // People
  User, Users, UserCheck, Heart, Star, ThumbsUp, Smile,
  // Documents
  FileText, File, Clipboard, Info, BookOpen, Hash, ClipboardList, Newspaper,
  // Technology
  Monitor, Laptop, Smartphone, Wifi, Cloud, Server, Code, Database, Cpu,
  // Nature
  Leaf, Sun, Droplets, Recycle, Wind, Thermometer, Trees,
  // Transport
  Car, Bus, Bike, Plane, Ship, Train,
  // Activities
  Music, Camera, Video, Dumbbell, Utensils, Coffee, Scissors, Gamepad2,
  // Misc
  Zap, Flame, Sparkles, CheckCircle, AlertCircle, HelpCircle,
  Shield, Lock, Key, Flag, Bookmark, Settings,
};

const ICON_CATEGORIES: Array<{ label: string; keys: string[] }> = [
  { label: "Location",   keys: ["MapPin","Map","Globe","Compass","Navigation","Home","Building","Building2","Warehouse","Store","Hotel","School","Landmark"] },
  { label: "Contact",    keys: ["Mail","Phone","PhoneCall","MessageCircle","MessageSquare","AtSign","LinkIcon","Send"] },
  { label: "Business",   keys: ["Briefcase","DollarSign","CreditCard","Receipt","ShoppingCart","ShoppingBag","Package","BarChart2","TrendingUp","Award","Trophy","Handshake","Coins","PiggyBank"] },
  { label: "Time",       keys: ["Calendar","Clock","CalendarDays","AlarmClock","Timer","Watch"] },
  { label: "People",     keys: ["User","Users","UserCheck","Heart","Star","ThumbsUp","Smile"] },
  { label: "Documents",  keys: ["FileText","File","Clipboard","Info","BookOpen","Hash","ClipboardList","Newspaper"] },
  { label: "Technology", keys: ["Monitor","Laptop","Smartphone","Wifi","Cloud","Server","Code","Database","Cpu"] },
  { label: "Nature",     keys: ["Leaf","Sun","Droplets","Recycle","Wind","Thermometer","Trees"] },
  { label: "Transport",  keys: ["Car","Bus","Bike","Plane","Ship","Train"] },
  { label: "Activities", keys: ["Music","Camera","Video","Dumbbell","Utensils","Coffee","Scissors","Gamepad2"] },
  { label: "Misc",       keys: ["Zap","Flame","Sparkles","CheckCircle","AlertCircle","HelpCircle","Shield","Lock","Key","Flag","Bookmark","Settings"] },
];

function DynIcon({ name, className = "h-4 w-4" }: { name?: string; className?: string }) {
  if (!name) return null;
  const Comp = ICON_MAP[name];
  if (!Comp) return null;
  return <Comp className={className} />;
}

function IconPickerModal({
  open, onClose, selected, onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selected?: string;
  onSelect: (name: string | undefined) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const visibleCategories = ICON_CATEGORIES
    .filter(cat => activeCategory === "All" || cat.label === activeCategory)
    .map(cat => ({
      ...cat,
      keys: cat.keys.filter(k => k.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter(cat => cat.keys.length > 0);

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Pick an Icon</DialogTitle>
        </DialogHeader>
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search icons…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-wrap gap-1 flex-shrink-0">
          {["All", ...ICON_CATEGORIES.map(c => c.label)].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 min-h-0">
          {visibleCategories.map(cat => (
            <div key={cat.label}>
              {activeCategory === "All" && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{cat.label}</p>
              )}
              <div className="grid grid-cols-8 gap-1">
                {cat.keys.map(name => {
                  const Comp = ICON_MAP[name];
                  if (!Comp) return null;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => { onSelect(name); onClose(); }}
                      className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-colors gap-0.5 ${
                        selected === name
                          ? "bg-blue-100 dark:bg-blue-900/40 border-blue-400 text-blue-600 dark:text-blue-300"
                          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <Comp className="h-5 w-5" />
                      <span className="text-[8px] leading-tight text-center truncate w-full">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {visibleCategories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No icons match &ldquo;{search}&rdquo;</p>
          )}
        </div>
        {selected && (
          <div className="border-t pt-3 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DynIcon name={selected} className="h-4 w-4 text-blue-500" />
              <span>{selected} selected</span>
            </div>
            <button
              type="button"
              onClick={() => { onSelect(undefined); onClose(); }}
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
            >
              Remove icon
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit-mode overlay wrapper ────────────────────────────────────────────────
// Wraps each section in edit mode with a "Drag to move" handle bar + drop target.
function EditSectionWrapper({
  section,
  children,
  onToggle,
  onEdit,
  isActive,
  disableDropZone,  // disable drop detection while a sidebar field is being dragged
}: {
  section: SectionConfig;
  children: React.ReactNode;
  onToggle: () => void;
  onEdit?: () => void;
  isActive?: boolean;
  disableDropZone?: boolean;
}) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: section.id,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: section.id,
    disabled: disableDropZone,
  });

  // Compose both refs onto the same element
  const composedRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const def = ENTRY_BLOCK_DEFS.find((d) => d.type === section.id);
  const label = def?.label ?? section.label;

  return (
    <div
      ref={composedRef}
      className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-all ${
        isDragging
          ? "opacity-30"
          : isOver
          ? "border-blue-600 ring-2 ring-blue-300 ring-offset-1"
          : "border-blue-400"
      } ${section.enabled ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-900/50"}`}
    >
      {/* ── "Drag to move" handle bar ── */}
      <div
        className={`flex items-center justify-between px-3 py-2 text-white text-xs font-medium select-none transition-colors ${
          isOver ? "bg-blue-700" : "bg-blue-500"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Grip handle — drag here */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-blue-400 transition-colors touch-none"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="opacity-80">Drag to move</span>
          <span className="opacity-50">·</span>
          <span className="font-semibold">{label}</span>
          {isOver && (
            <span className="ml-1 text-blue-200 text-[10px]">drop to swap</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit section text"
              className="p-1 rounded hover:bg-blue-400 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            title={section.enabled ? "Hide this section" : "Show this section"}
            className="p-1 rounded hover:bg-blue-400 transition-colors"
          >
            {section.enabled ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Section content ── */}
      {section.enabled ? (
        <div>{children}</div>
      ) : (
        <div className="px-6 py-5 text-sm text-gray-400 italic flex items-center gap-2">
          <EyeOff className="h-4 w-4 flex-shrink-0" />
          Section hidden — click the eye icon to restore it
        </div>
      )}
    </div>
  );
}

// ─── Sortable row for individual sidebar fields in edit mode ─────────────────
function SortableSidebarField({
  fieldId,
  children,
}: {
  fieldId: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `sf-${fieldId}` });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="flex items-start gap-1 group"
    >
      {/* Grip handle — only shown in edit mode */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing mt-0.5 p-1 rounded text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity touch-none flex-shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Drag overlay ghost (shown while dragging) ────────────────────────────────
function SectionGhost({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-2 border-blue-500 bg-blue-50 shadow-xl opacity-90 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs font-semibold rounded-t-lg">
        <GripVertical className="h-4 w-4" />
        Moving: {label}
      </div>
      <div className="p-4 text-sm text-blue-400 italic">Drop onto another section to swap positions</div>
    </div>
  );
}

// ─── Image URL detection ──────────────────────────────────────────────────────
// Handles both dot-extension URLs (.jpg, .svg) and path-segment URLs (/svg, /png)
// which are common with API-based image services like DiceBear.
function isImageUrl(val: string): boolean {
  try {
    const u = new URL(val);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return /[./](jpg|jpeg|png|gif|webp|svg|avif|ico)(\?|#|$)/i.test(u.pathname)
      || /avatar|photo|image|img|picture|thumbnail|icon|logo/i.test(u.hostname + u.pathname);
  } catch { return false; }
}

// Returns the effective ordered list of custom field display configs for a given entry,
// merging stored template settings with any fields present in the entry but not yet configured.
function getEffectiveCustomFieldDisplay(
  stored: CustomFieldDisplay[] | undefined,
  customFields: Record<string, unknown>,
): CustomFieldDisplay[] {
  const cfds = stored ?? [];
  const entryKeys = Object.keys(customFields);
  const storedKeys = new Set(cfds.map((c) => c.key));
  const missing: CustomFieldDisplay[] = entryKeys
    .filter((k) => !storedKeys.has(k))
    .map((k) => ({ key: k, showTitle: true, displayAsImage: false, displayAsButton: false, section: "description" as const }));
  return [...cfds.filter((c) => entryKeys.includes(c.key)), ...missing];
}

// Filter custom fields to only those assigned to a given section.
// Fields with no section default to "description".
function cfForSection(
  fields: CustomFieldDisplay[],
  section: "header" | "description" | "sidebar",
): CustomFieldDisplay[] {
  return fields.filter((f) => (f.section ?? "description") === section);
}

// ─── Sortable row for individual custom fields in edit mode ───────────────────
const CF_SECTION_OPTIONS: Array<{ s: "header" | "description" | "sidebar"; label: string }> = [
  { s: "header",      label: "Title" },
  { s: "description", label: "Body"  },
  { s: "sidebar",     label: "Sidebar" },
];

function SortableCustomField({
  config,
  value,
  onToggleTitle,
  onToggleImage,
  onToggleButton,
  onChangeButtonText,
  onChangeSection,
  onChangeIcon,
}: {
  config: CustomFieldDisplay;
  value: string;
  onToggleTitle: () => void;
  onToggleImage: () => void;
  onToggleButton: () => void;
  onChangeButtonText: (text: string) => void;
  onChangeSection: (s: "header" | "description" | "sidebar") => void;
  onChangeIcon: (icon: string | undefined) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `cf-${config.key}` });
  const [pickerOpen, setPickerOpen] = useState(false);

  const label = config.key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const preview = value.length > 48 ? value.slice(0, 48) + "…" : value;
  const currentSection = config.section ?? "description";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-3 pt-2.5 pb-2"
    >
      {/* Top row: grip + label + toggle buttons */}
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity touch-none flex-shrink-0"
          title="Drag to reorder within this section"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{label}</p>
          <p className="text-xs text-muted-foreground truncate leading-snug">{preview}</p>
        </div>
        <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
          {/* Show / hide field label */}
          <button
            onClick={onToggleTitle}
            title={config.showTitle ? "Hide field label" : "Show field label"}
            className={`p-1.5 rounded transition-colors ${
              config.showTitle
                ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {config.showTitle ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          {/* Force display as image */}
          <button
            onClick={onToggleImage}
            title={config.displayAsImage ? "Show as plain text" : "Display as image"}
            className={`p-1.5 rounded transition-colors ${
              config.displayAsImage
                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <FileImage className="h-3.5 w-3.5" />
          </button>
          {/* Force display as CTA button */}
          <button
            onClick={onToggleButton}
            title={config.displayAsButton ? "Show as plain text" : "Display as call-to-action button"}
            className={`p-1.5 rounded transition-colors ${
              config.displayAsButton
                ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          {/* Icon picker */}
          <button
            onClick={() => setPickerOpen(true)}
            title={config.icon ? `Icon: ${config.icon} — click to change` : "Add an icon"}
            className={`p-1.5 rounded transition-colors ${
              config.icon
                ? "text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                : "text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {config.icon
              ? <DynIcon name={config.icon} className="h-3.5 w-3.5" />
              : <Smile className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {pickerOpen && (
        <IconPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          selected={config.icon}
          onSelect={onChangeIcon}
        />
      )}

      {/* CTA button text input — shown when displayAsButton is on */}
      {config.displayAsButton && (
        <div className="mt-1.5 pl-7 pr-1">
          <input
            type="text"
            value={config.buttonText ?? ""}
            onChange={(e) => onChangeButtonText(e.target.value)}
            placeholder={`Button label (default: "${label}")`}
            className="w-full text-xs px-2 py-1 rounded border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/20 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-400"
          />
        </div>
      )}

      {/* Bottom row: section assignment pills */}
      <div className="flex items-center gap-1 mt-1.5 pl-7">
        <span className="text-[10px] text-gray-400 mr-0.5">Section:</span>
        {CF_SECTION_OPTIONS.map(({ s, label: sLabel }) => (
          <button
            key={s}
            onClick={() => onChangeSection(s)}
            disabled={currentSection === s}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              currentSection === s
                ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-semibold cursor-default"
                : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-300 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400"
            }`}
          >
            {sLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchEntryBySlug(slug: string) {
  const res = await fetch(`/api/public/entries/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EntryPage() {
  const { id: idOrSlug } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isDemo = idOrSlug === "demo1" || idOrSlug === "demo2" || idOrSlug === "demo3";
  const numericId = isDemo ? 0 : parseInt(idOrSlug || "0", 10);
  const isNumeric = !isNaN(numericId) && String(numericId) === idOrSlug;

  const { data: settings } = useGetPublicSettings();

  const { data: entryById, isLoading: loadingById } = useGetPublicEntry(
    isNumeric ? numericId : 0,
    { query: { enabled: !isDemo && isNumeric && numericId > 0 } }
  );
  const { data: entryBySlug, isLoading: loadingBySlug } = useQuery({
    queryKey: ["public-entry-slug", idOrSlug],
    queryFn: () => fetchEntryBySlug(idOrSlug!),
    enabled: !isDemo && !isNumeric && !!idOrSlug,
  });

  const isLoading = loadingById || loadingBySlug;
  const entry = isNumeric ? entryById : entryBySlug;

  const ts = mergeTemplateSettings((settings as any)?.templateSettings);
  const entryFont = getFontFamily(ts.entry.font);

  const getEntrySection = (id: string) => ts.entry.sections.find((s) => s.id === id);
  const getSectionEnabled = (id: string) => getEntrySection(id)?.enabled ?? true;
  const getSectionProps = (id: string): SectionProps => getEntrySection(id)?.props ?? {};

  const sidebarFields = ts.entry.sidebarFields;
  const siteTitle = (settings as any)?.siteTitle || "Directory Master";

  // ── Admin detection ────────────────────────────────────────────────────────
  const { token } = useAuth();
  const isLoggedIn = Boolean(token);
  const { data: currentUser } = useGetCurrentUser({ query: { enabled: isLoggedIn } });
  const isAdmin = isLoggedIn && (currentUser as any)?.role === "admin";

  // ── Edit mode state ────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editSections, setEditSections] = useState<SectionConfig[]>([]);
  const [editSidebarFields, setEditSidebarFields] = useState<string[]>([]);
  const [editCustomFieldDisplay, setEditCustomFieldDisplay] = useState<CustomFieldDisplay[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [claimEditOpen, setClaimEditOpen] = useState(false);
  const [claimDraft, setClaimDraft] = useState({ heading: "", bodyText: "", buttonText: "", thankYouMessage: "" });
  const updateSettings = useUpdateSettings();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const enterEditMode = useCallback(() => {
    setEditSections(ts.entry.sections.map((s) => ({ ...s })));
    setEditSidebarFields([...ts.entry.sidebarFields]);
    // Seed custom field display from stored settings + any new fields in this entry.
    // Use `entry` directly here (defined above the callback) rather than `displayEntry`
    // which is assigned later in the component body.
    const entryCustomFields = (entry as any)?.customFields ?? {};
    setEditCustomFieldDisplay(
      getEffectiveCustomFieldDisplay(ts.entry.customFieldDisplay, entryCustomFields)
    );
    setEditMode(true);
  }, [ts.entry.sections, ts.entry.sidebarFields, ts.entry.customFieldDisplay, entry]);

  const exitEditMode = () => { setEditMode(false); setActiveId(null); };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Unified drag end — routes by ID prefix:
  //   "sf-*"  → sidebar field vertical sort (arrayMove)
  //   "cf-*"  → custom field vertical sort (arrayMove)
  //   others  → section swap (swap two sections)
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStr = String(active.id);
    const overStr   = String(over.id);

    if (activeStr.startsWith("sf-") && overStr.startsWith("sf-")) {
      // Sidebar field sort
      setEditSidebarFields((prev) => {
        const oldIdx = prev.findIndex((f) => `sf-${f}` === activeStr);
        const newIdx = prev.findIndex((f) => `sf-${f}` === overStr);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    } else if (activeStr.startsWith("cf-") && overStr.startsWith("cf-")) {
      // Custom field sort
      setEditCustomFieldDisplay((prev) => {
        const oldIdx = prev.findIndex((c) => `cf-${c.key}` === activeStr);
        const newIdx = prev.findIndex((c) => `cf-${c.key}` === overStr);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return arrayMove(prev, oldIdx, newIdx);
      });
    } else if (!activeStr.startsWith("sf-") && !overStr.startsWith("sf-")
             && !activeStr.startsWith("cf-") && !overStr.startsWith("cf-")) {
      // Section swap
      setEditSections((prev) => {
        const next = [...prev];
        const aIdx = next.findIndex((s) => s.id === activeStr);
        const bIdx = next.findIndex((s) => s.id === overStr);
        if (aIdx === -1 || bIdx === -1) return prev;
        [next[aIdx], next[bIdx]] = [next[bIdx], next[aIdx]];
        return next;
      });
    }
  };


  const toggleSection = (id: string) => {
    setEditSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleChangeSection = (key: string, section: "header" | "description" | "sidebar") => {
    setEditCustomFieldDisplay((prev) =>
      prev.map((c) => (c.key === key ? { ...c, section } : c))
    );
  };

  const handleChangeIcon = (key: string, icon: string | undefined) => {
    setEditCustomFieldDisplay((prev) =>
      prev.map((c) => (c.key === key ? { ...c, icon } : c))
    );
  };

  const handleChangeRelatedMaxItems = (n: number) => {
    setEditSections((prev) =>
      prev.map((s) => s.id === "related" ? { ...s, props: { ...s.props, maxItems: n } } : s)
    );
  };

  const handleToggleButton = (key: string) => {
    setEditCustomFieldDisplay((prev) =>
      prev.map((c) =>
        c.key === key
          ? { ...c, displayAsButton: !c.displayAsButton, displayAsImage: false }
          : c
      )
    );
  };

  const handleChangeButtonText = (key: string, text: string) => {
    setEditCustomFieldDisplay((prev) =>
      prev.map((c) => (c.key === key ? { ...c, buttonText: text } : c))
    );
  };

  const findEditSection = (id: string) =>
    editSections.find((s) => s.id === id) ?? { id, label: id, enabled: true };

  const handleSave = async () => {
    setSaving(true);
    try {
      const stored = (settings as any)?.templateSettings ?? {};
      const merged = mergeTemplateSettings(stored);
      const updated = {
        ...merged,
        entry: {
          ...merged.entry,
          sections: editSections,
          sidebarFields: editSidebarFields,
          customFieldDisplay: editCustomFieldDisplay,
        },
      };
      await updateSettings.mutateAsync({ data: { templateSettings: updated } as any });
      qc.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Entry template saved!", description: "All entry pages now use this layout." });
      setEditMode(false);
    } catch {
      toast({ title: "Save failed", description: "Could not save the template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Demo entry ─────────────────────────────────────────────────────────────
  const demoEntry = {
    title: "Tech Conference 2024",
    category: "Events",
    summary: "Annual gathering of tech enthusiasts and industry leaders.",
    description: "Join us for three days of inspiring keynotes, interactive workshops, and unparalleled networking opportunities. Learn from the best minds in software development, AI, and cloud architecture.",
    location: "San Francisco, CA",
    website: "https://example.com",
    contactEmail: "hello@example.com",
    contactPhone: "+1 (555) 123-4567",
    tags: "tech, software, networking, ai",
    published: true,
    updatedAt: new Date().toISOString(),
  };
  const displayEntry = isDemo ? demoEntry : entry;

  const { data: relatedData } = useListPublicEntries(
    { category: displayEntry?.category || undefined, limit: 7 },
    { query: { enabled: !!displayEntry?.category && !isDemo } }
  );

  // ── SEO meta tags ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!displayEntry) return;
    const e = displayEntry as any;
    document.title = e.metaTitle || `${e.title} | ${siteTitle}`;
    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, value); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", e.metaDescription || e.summary || "");
    setMeta("property", "og:title", e.ogTitle || e.title);
    setMeta("property", "og:description", e.ogDescription || e.summary || "");
    setMeta("property", "og:site_name", siteTitle);
    setMeta("property", "og:type", "article");
    return () => { document.title = siteTitle; };
  }, [displayEntry, siteTitle]);

  if (isLoading && !isDemo) {
    return <div className="flex justify-center items-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!displayEntry) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Entry not found</h2>
        <p className="text-muted-foreground mt-2">The entry you are looking for does not exist or has been removed.</p>
        <Link href="/browse"><Button className="mt-6">Back to Directory</Button></Link>
      </div>
    );
  }

  // ── Shared content renderers ───────────────────────────────────────────────
  const headerProps = getSectionProps("header");
  const sidebarProps = getSectionProps("sidebar");
  const entryNumericId = isNumeric ? numericId : (displayEntry as any)?.id;

  const renderSidebarField = (fieldId: string) => {
    const e = displayEntry as any;
    switch (fieldId) {
      case "eventType": return e.eventType ? (
        <div key="eventType" className="flex items-start">
          <Layers className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div><div className="text-sm font-medium mb-1">Event Type</div><div className="text-sm text-gray-600 dark:text-gray-300">{e.eventType}</div></div>
        </div>
      ) : null;
      case "startDate": return (e.startDate || e.endDate) ? (
        <div key="startDate" className="flex items-start">
          <CalendarDays className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div><div className="text-sm font-medium mb-1">Dates</div><div className="text-sm text-gray-600 dark:text-gray-300">{e.startDate}{e.endDate && e.endDate !== e.startDate ? ` – ${e.endDate}` : ""}</div></div>
        </div>
      ) : null;
      case "venue": return e.venue ? (
        <div key="venue" className="flex items-start">
          <Building2 className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div><div className="text-sm font-medium mb-1">Venue</div><div className="text-sm text-gray-600 dark:text-gray-300">{e.venue}</div></div>
        </div>
      ) : null;
      case "location": return displayEntry.location ? (
        <div key="location" className="flex items-start">
          <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div><div className="text-sm font-medium mb-1">Location</div><div className="text-sm text-gray-600 dark:text-gray-300">{displayEntry.location}</div></div>
        </div>
      ) : null;
      case "website": return displayEntry.website ? (
        <div key="website" className="flex items-start">
          <Globe className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-sm font-medium mb-1">Website</div>
            <a href={displayEntry.website.startsWith("http") ? displayEntry.website : `https://${displayEntry.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate block">
              {displayEntry.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>
      ) : null;
      case "contactEmail": return displayEntry.contactEmail ? (
        <div key="contactEmail" className="flex items-start">
          <Mail className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div className="overflow-hidden">
            <div className="text-sm font-medium mb-1">Email</div>
            <a href={`mailto:${displayEntry.contactEmail}`} className="text-primary hover:underline text-sm truncate block">{displayEntry.contactEmail}</a>
          </div>
        </div>
      ) : null;
      case "contactPhone": return displayEntry.contactPhone ? (
        <div key="contactPhone" className="flex items-start">
          <Phone className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
          <div><div className="text-sm font-medium mb-1">Phone</div><div className="text-sm text-gray-600 dark:text-gray-300">{displayEntry.contactPhone}</div></div>
        </div>
      ) : null;
      case "tags": return displayEntry.tags ? (
        <div key="tags">
          <Separator className="my-4" />
          <div>
            <div className="flex items-center text-sm font-medium mb-3"><Tag className="h-4 w-4 text-muted-foreground mr-2" /> Tags</div>
            <div className="flex flex-wrap gap-2">
              {displayEntry.tags.split(",").map((tag, i) => (
                <Badge key={i} variant="secondary" className="font-normal bg-gray-200 dark:bg-gray-700">{tag.trim()}</Badge>
              ))}
            </div>
          </div>
        </div>
      ) : null;
      default: return null;
    }
  };

  // Individual section content renderers
  const renderHeaderContent = (props: SectionProps = headerProps) => (
    <div className="p-8 md:p-10" style={{ backgroundColor: props.backgroundColor || undefined, fontFamily: props.fontFamily ? getFontFamily(props.fontFamily) : undefined }}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {displayEntry.category && (
          <Link href={`/browse/${encodeURIComponent(displayEntry.category)}`}>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-sm py-1 px-3">{displayEntry.category}</Badge>
          </Link>
        )}
        {isDemo && <Badge variant="outline">Demo Entry</Badge>}
        <span className="text-sm text-muted-foreground">Last updated {format(new Date(displayEntry.updatedAt || new Date()), "MMMM d, yyyy")}</span>
      </div>
      <h1 className="font-bold tracking-tight mb-4" style={{ color: props.headingColor || undefined, fontSize: props.headingFontSize || "clamp(1.75rem, 4vw, 2.25rem)" }}>
        {displayEntry.title}
      </h1>
      {displayEntry.summary && (
        <p className="max-w-3xl" style={{ color: props.textColor || undefined, fontSize: props.bodyFontSize || "1.125rem" }}>
          {displayEntry.summary}
        </p>
      )}
    </div>
  );

  const renderDescriptionContent = () => {
    const customFields = (displayEntry as any)?.customFields ?? {};
    const cfds = getEffectiveCustomFieldDisplay(ts.entry.customFieldDisplay, customFields);
    return (
      <div className="p-8 md:p-10 prose prose-gray dark:prose-invert max-w-none">
        {displayEntry.description && (
          <div className="whitespace-pre-wrap">{displayEntry.description}</div>
        )}
        {(displayEntry as any).moreDetails && (
          <>
            <Separator className="my-8" />
            <h3 className="text-xl font-bold">Additional Information</h3>
            <div className="whitespace-pre-wrap">{(displayEntry as any).moreDetails}</div>
          </>
        )}
        {cfds.map(({ key, showTitle, displayAsImage, displayAsButton, buttonText, icon }) => {
          const value = customFields[key];
          if (!value) return null;
          const label = key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          const strVal = String(value);
          const showAsImage = displayAsImage || isImageUrl(strVal);
          const href = strVal.startsWith("http") ? strVal : `https://${strVal}`;
          return (
            <div key={key}>
              <Separator className="my-8" />
              {showTitle && (
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <DynIcon name={icon} className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  {label}
                </h3>
              )}
              {showAsImage ? (
                <img src={strVal} alt={label} className="max-w-xs rounded-lg border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : displayAsButton ? (
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  {buttonText || label}
                </a>
              ) : (
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{strVal}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Shared helper: renders a sortable list of custom fields for a given section in edit mode
  const renderEditModeCustomFields = (targetSection: "header" | "description" | "sidebar") => {
    const customFields = (displayEntry as any)?.customFields ?? {};
    const sectionFields = cfForSection(editCustomFieldDisplay, targetSection).filter(
      (c) => customFields[c.key] != null
    );
    if (sectionFields.length === 0) return null;
    return (
      <SortableContext
        items={sectionFields.map((c) => `cf-${c.key}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {sectionFields.map((config) => (
            <SortableCustomField
              key={config.key}
              config={config}
              value={String(customFields[config.key])}
              onToggleTitle={() =>
                setEditCustomFieldDisplay((prev) =>
                  prev.map((c) => c.key === config.key ? { ...c, showTitle: !c.showTitle } : c)
                )
              }
              onToggleImage={() =>
                setEditCustomFieldDisplay((prev) =>
                  prev.map((c) => c.key === config.key ? { ...c, displayAsImage: !c.displayAsImage, displayAsButton: false } : c)
                )
              }
              onToggleButton={() => handleToggleButton(config.key)}
              onChangeButtonText={(text) => handleChangeButtonText(config.key, text)}
              onChangeSection={(s) => handleChangeSection(config.key, s)}
              onChangeIcon={(icon) => handleChangeIcon(config.key, icon)}
            />
          ))}
        </div>
      </SortableContext>
    );
  };

  // ── Edit-mode description: custom fields are individually sortable with per-field controls
  const renderEditModeDescriptionContent = () => {
    const customFields = (displayEntry as any)?.customFields ?? {};
    const totalCustomFields = Object.keys(customFields).length;
    const descFields = cfForSection(editCustomFieldDisplay, "description").filter(
      (c) => customFields[c.key] != null
    );
    return (
      <div className="p-6 prose prose-gray dark:prose-invert max-w-none">
        {/* Description text preview (read-only) */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 not-prose">
          <p className="text-xs font-medium text-blue-500 mb-1.5">Description text (read-only preview)</p>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {displayEntry.description || <em>No description</em>}
          </p>
        </div>

        {/* Sortable custom fields assigned to description */}
        {totalCustomFields > 0 && (
          <div className="not-prose">
            <p className="text-xs text-blue-500 flex items-center gap-1.5 mb-3">
              <GripVertical className="h-3 w-3" />
              Drag to reorder · <Eye className="h-3 w-3 inline" /> label · <FileImage className="h-3 w-3 inline" /> image · <ExternalLink className="h-3 w-3 inline" /> CTA button · use <span className="font-semibold">Section</span> pills to move a field
            </p>
            {descFields.length > 0 ? (
              renderEditModeCustomFields("description")
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No custom fields in this section — assign some using the <span className="font-semibold">Body</span> pill on any field.
              </p>
            )}
          </div>
        )}
        {totalCustomFields === 0 && (
          <p className="text-xs text-muted-foreground italic not-prose">
            No custom fields in this entry. Import data with custom columns to configure them here.
          </p>
        )}
      </div>
    );
  };

  const renderSidebarContent = (props: SectionProps = sidebarProps) => (
    <div className="p-8" style={{ backgroundColor: props.backgroundColor || undefined, fontFamily: props.fontFamily ? getFontFamily(props.fontFamily) : undefined }}>
      <h3 className="font-semibold text-lg mb-6" style={{ color: props.headingColor || undefined }}>
        {getEntrySection("sidebar")?.props?.sidebarTitle || "Contact & Details"}
      </h3>
      <div className="space-y-5">
        {sidebarFields.map((fieldId) => renderSidebarField(fieldId)).filter(Boolean)}
      </div>
    </div>
  );

  // ── Edit-mode sidebar: standard fields are sortable + sidebar-section custom fields ──
  const renderEditModeSidebarContent = (props: SectionProps = sidebarProps) => {
    const customFields = (displayEntry as any)?.customFields ?? {};
    const sidebarCfFields = cfForSection(editCustomFieldDisplay, "sidebar").filter(
      (c) => customFields[c.key] != null
    );
    return (
      <div className="p-6" style={{ backgroundColor: props.backgroundColor || undefined, fontFamily: props.fontFamily ? getFontFamily(props.fontFamily) : undefined }}>
        <h3 className="font-semibold text-lg mb-4" style={{ color: props.headingColor || undefined }}>
          {getEntrySection("sidebar")?.props?.sidebarTitle || "Contact & Details"}
        </h3>
        <p className="text-xs text-blue-500 mb-4 flex items-center gap-1">
          <GripVertical className="h-3 w-3" /> Drag rows to reorder · hidden fields still save their position
        </p>
        <SortableContext
          items={editSidebarFields.map((f) => `sf-${f}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {editSidebarFields.map((fieldId) => {
              const content = renderSidebarField(fieldId);
              return (
                <SortableSidebarField key={fieldId} fieldId={fieldId}>
                  {content ?? (
                    <div className="text-xs text-muted-foreground italic py-1">
                      {fieldId} — no data for this entry
                    </div>
                  )}
                </SortableSidebarField>
              );
            })}
          </div>
        </SortableContext>

        {/* Custom fields assigned to the sidebar section */}
        {sidebarCfFields.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <p className="text-xs text-blue-500 mb-2 flex items-center gap-1">
              <GripVertical className="h-3 w-3" /> Custom fields in this section
            </p>
            {renderEditModeCustomFields("sidebar")}
          </div>
        )}

        {/* Claim Yours Now — embedded at bottom of sidebar */}
        {(() => {
          const claimS = findEditSection("claim");
          return (
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Claim Yours Now
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setClaimDraft({
                        heading: claimS.heading ?? "Claim Yours Now",
                        bodyText: claimS.props?.bodyText ?? "",
                        buttonText: claimS.props?.buttonText ?? "Submit",
                        thankYouMessage: claimS.props?.thankYouMessage ?? "Thank you! We'll be in touch soon.",
                      });
                      setClaimEditOpen(true);
                    }}
                    title="Edit text"
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-500"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSection("claim")}
                    title={claimS.enabled ? "Hide Claim form" : "Show Claim form"}
                    className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-500"
                  >
                    {claimS.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {claimS.enabled && (
                <div className="pt-1">
                  {claimS.heading && (
                    <p className="text-sm font-semibold mb-3">{claimS.heading}</p>
                  )}
                  <EntryClaimFormBlock section={claimS} />
                </div>
              )}
              {!claimS.enabled && (
                <p className="text-xs text-muted-foreground italic">Form hidden — click the eye to show it</p>
              )}
            </div>
          );
        })()}
      </div>
    );
  };

  const renderRelatedContent = () => {
    const relatedEntries = relatedData?.entries.filter((e) => e.id !== entryNumericId) ?? [];
    const editRelatedSec = findEditSection("related");
    const maxItems = editRelatedSec?.props?.maxItems ?? 3;
    const gridCols = maxItems === 1 ? "grid-cols-1" : maxItems === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3";
    return (
      <div className="p-8 md:p-10">
        {/* Count picker — edit mode control */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs font-medium text-muted-foreground">Show:</span>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleChangeRelatedMaxItems(n)}
              className={`w-7 h-7 rounded text-xs font-semibold transition-colors border ${
                maxItems === n
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {n}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">entries</span>
        </div>
        {relatedEntries.length > 0 && !isDemo ? (
          <>
            <h2 className="text-2xl font-bold tracking-tight mb-6">
              {editRelatedSec?.heading || `Similar in ${displayEntry.category}`}
            </h2>
            <div className={`grid ${gridCols} gap-6`}>
              {relatedEntries.slice(0, maxItems).map((related) => (
                <Link key={related.id} href={`/entry/${(related as any).slug || related.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-3"><CardTitle className="text-lg line-clamp-1">{related.title}</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{related.summary}</p></CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground italic">No related entries to display.</div>
        )}
      </div>
    );
  };

  // ── EDIT MODE — two-column layout preserved ────────────────────────────────
  if (editMode) {
    const hSec     = findEditSection("header");
    const dSec     = findEditSection("description");
    const sSec     = findEditSection("sidebar");
    const rSec     = findEditSection("related");
    const claimSec = findEditSection("claim");

    // Which side is description vs sidebar? Determine by their order in editSections.
    const dIdx = editSections.findIndex((s) => s.id === "description");
    const sIdx = editSections.findIndex((s) => s.id === "sidebar");
    const descOnLeft = dIdx <= sIdx;

    const activeDef = ENTRY_BLOCK_DEFS.find((d) => d.type === activeId);
    const activeLabel = activeDef?.label ?? activeId ?? "";

    return (
      <div style={{ fontFamily: entryFont }}>
        <FontLoader fontKey={ts.entry.font} />

        {/* ── Sticky edit bar ── */}
        <div className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 bg-blue-600 text-white shadow-lg">
          <LayoutTemplate className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold text-sm">Editing Entry Template</span>
          <span className="text-blue-200 text-xs hidden sm:block">
            — drag any section to swap positions · eye icon to show/hide
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:bg-blue-500 border border-blue-400" onClick={exitEditMode} disabled={saving}>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
            <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save Template
            </Button>
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Breadcrumb (non-interactive in edit mode) */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center text-sm text-muted-foreground opacity-50 select-none">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Directory
              </span>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Template edit mode — drag sections to rearrange · changes apply to all entries
              </span>
            </div>

            {/* ── Main card ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm space-y-0">

              {/* Header — full width */}
              <EditSectionWrapper
                section={hSec}
                onToggle={() => toggleSection("header")}
                isActive={activeId === "header"}
                disableDropZone={activeId?.startsWith("sf-") || activeId?.startsWith("cf-")}
              >
                <>
                  {renderHeaderContent()}
                  {/* Custom fields assigned to the Title & Summary section */}
                  {cfForSection(editCustomFieldDisplay, "header").filter(
                    (c) => (displayEntry as any)?.customFields?.[c.key] != null
                  ).length > 0 && (
                    <div className="px-8 pb-6 not-prose">
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <p className="text-xs text-blue-500 mb-3 flex items-center gap-1">
                          <GripVertical className="h-3 w-3" /> Custom fields in Title &amp; Summary
                        </p>
                        {renderEditModeCustomFields("header")}
                      </div>
                    </div>
                  )}
                </>
              </EditSectionWrapper>

              {/* Two-column row: description ↔ sidebar (order respects drag swaps) */}
              <div className="flex flex-col md:flex-row border-t border-gray-100 dark:border-gray-800">
                {/* Left column */}
                <div className="flex-1 md:border-r border-gray-100 dark:border-gray-800">
                  <EditSectionWrapper
                    section={descOnLeft ? dSec : sSec}
                    onToggle={() => toggleSection(descOnLeft ? "description" : "sidebar")}
                    isActive={activeId === (descOnLeft ? "description" : "sidebar")}
                    disableDropZone={activeId?.startsWith("sf-") || activeId?.startsWith("cf-")}
                  >
                    {descOnLeft ? renderEditModeDescriptionContent() : renderEditModeSidebarContent()}
                  </EditSectionWrapper>
                </div>

                {/* Right column */}
                <div className="w-full md:w-80">
                  <EditSectionWrapper
                    section={descOnLeft ? sSec : dSec}
                    onToggle={() => toggleSection(descOnLeft ? "sidebar" : "description")}
                    isActive={activeId === (descOnLeft ? "sidebar" : "description")}
                    disableDropZone={activeId?.startsWith("sf-") || activeId?.startsWith("cf-")}
                  >
                    {descOnLeft ? renderEditModeSidebarContent() : renderEditModeDescriptionContent()}
                  </EditSectionWrapper>
                </div>
              </div>
            </div>

            {/* Related — full width, outside card */}
            {editSections.some(s => s.id === "related") && (
              <EditSectionWrapper
                section={rSec}
                onToggle={() => toggleSection("related")}
                isActive={activeId === "related"}
                disableDropZone={activeId?.startsWith("sf-") || activeId?.startsWith("cf-")}
              >
                {renderRelatedContent()}
              </EditSectionWrapper>
            )}

            {/* Claim section edit dialog */}
            <Dialog open={claimEditOpen} onOpenChange={setClaimEditOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-blue-500" />
                    Edit "Claim Yours Now" Section
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-heading">Heading</Label>
                    <Input
                      id="claim-heading"
                      value={claimDraft.heading}
                      onChange={e => setClaimDraft(d => ({ ...d, heading: e.target.value }))}
                      placeholder="Claim Yours Now"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-body">Description (optional)</Label>
                    <Textarea
                      id="claim-body"
                      value={claimDraft.bodyText}
                      onChange={e => setClaimDraft(d => ({ ...d, bodyText: e.target.value }))}
                      placeholder="A short line under the heading…"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-btn">Submit Button Label</Label>
                    <Input
                      id="claim-btn"
                      value={claimDraft.buttonText}
                      onChange={e => setClaimDraft(d => ({ ...d, buttonText: e.target.value }))}
                      placeholder="Submit"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="claim-ty">Thank You Message</Label>
                    <Textarea
                      id="claim-ty"
                      value={claimDraft.thankYouMessage}
                      onChange={e => setClaimDraft(d => ({ ...d, thankYouMessage: e.target.value }))}
                      placeholder="Thank you! We'll be in touch soon."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setClaimEditOpen(false)}>Cancel</Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setEditSections(prev => prev.map(s =>
                        s.id === "claim"
                          ? { ...s, heading: claimDraft.heading, props: { ...s.props, bodyText: claimDraft.bodyText, buttonText: claimDraft.buttonText, thankYouMessage: claimDraft.thankYouMessage } }
                          : s
                      ));
                      setClaimEditOpen(false);
                    }}
                  >
                    Apply
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Bottom action row */}
            <div className="flex justify-end gap-2 pt-2 pb-8">
              <Button variant="outline" onClick={exitEditMode} disabled={saving}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Save Template
              </Button>
            </div>
          </div>

          {/* Drag overlay — ghost shown while dragging */}
          <DragOverlay dropAnimation={null}>
            {activeId ? (
              activeId.startsWith("cf-") ? (
                <div className="rounded-lg border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/50 shadow-xl opacity-90 pointer-events-none px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />
                  {activeId.replace("cf-", "").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
              ) : (
                <SectionGhost label={activeLabel} />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  // ── NORMAL VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: entryFont }}>
      <FontLoader fontKey={ts.entry.font} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Top row: back link + admin Edit button */}
        <div className="flex items-center justify-between">
          <Link href="/browse" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Directory
          </Link>
          {isAdmin && (
            <Button size="sm" variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
              onClick={enterEditMode}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Layout
            </Button>
          )}
        </div>

        {/* Main card */}
        {(() => {
          // Respect saved section order for left/right column assignment
          const savedDescIdx = ts.entry.sections.findIndex((s) => s.id === "description");
          const savedSidebarIdx = ts.entry.sections.findIndex((s) => s.id === "sidebar");
          const savedDescOnLeft = savedDescIdx <= savedSidebarIdx;

          const descEnabled = getSectionEnabled("description") || getSectionEnabled("moreDetails");
          const sidebarEnabled = getSectionEnabled("sidebar");

          const allCfds = getEffectiveCustomFieldDisplay(
            ts.entry.customFieldDisplay,
            (displayEntry as any)?.customFields ?? {}
          );

          // Helper: render a custom field value inline (description body / header contexts)
          const renderCf = ({ key, showTitle, displayAsImage, displayAsButton, buttonText, icon }: CustomFieldDisplay) => {
            const value = (displayEntry as any)?.customFields?.[key];
            if (!value) return null;
            const label = key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const strVal = String(value);
            const showAsImage = displayAsImage || isImageUrl(strVal);
            const href = strVal.startsWith("http") ? strVal : `https://${strVal}`;
            return (
              <div key={key}>
                <Separator className="my-8" />
                {showTitle && (
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <DynIcon name={icon} className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    {label}
                  </h3>
                )}
                {showAsImage ? (
                  <img src={strVal} alt={label} className="max-w-xs rounded-lg border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : displayAsButton ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                    <ExternalLink className="h-4 w-4 flex-shrink-0" />
                    {buttonText || label}
                  </a>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{strVal}</div>
                )}
              </div>
            );
          };

          const descCol = (
            <div className={`${savedDescOnLeft ? "flex-1" : "w-full md:w-80"} p-8 md:p-10 prose prose-gray dark:prose-invert max-w-none`}>
              {getSectionEnabled("description") && displayEntry.description && (
                <div className="whitespace-pre-wrap">{displayEntry.description}</div>
              )}
              {getSectionEnabled("moreDetails") && (displayEntry as any).moreDetails && (
                <>
                  <Separator className="my-8" />
                  <h3 className="text-xl font-bold">Additional Information</h3>
                  <div className="whitespace-pre-wrap">{(displayEntry as any).moreDetails}</div>
                </>
              )}
              {/* Only render custom fields assigned to the description section */}
              {cfForSection(allCfds, "description").map(renderCf)}
            </div>
          );

          const sidebarCol = (
            <div
              className={`${savedDescOnLeft ? "w-full md:w-80" : "flex-1"} border-t md:border-t-0 ${savedDescOnLeft ? "md:border-l" : "md:border-r"} p-8`}
              style={{ backgroundColor: sidebarProps.backgroundColor || undefined, fontFamily: sidebarProps.fontFamily ? getFontFamily(sidebarProps.fontFamily) : undefined }}
            >
              <h3 className="font-semibold text-lg mb-6" style={{ color: sidebarProps.headingColor || undefined }}>
                {getEntrySection("sidebar")?.props?.sidebarTitle || "Contact & Details"}
              </h3>
              <div className="space-y-5">
                {sidebarFields.map((fieldId) => renderSidebarField(fieldId)).filter(Boolean)}
                {/* Custom fields assigned to the sidebar section */}
                {cfForSection(allCfds, "sidebar").map(({ key, showTitle, displayAsImage, displayAsButton, buttonText, icon }) => {
                  const value = (displayEntry as any)?.customFields?.[key];
                  if (!value) return null;
                  const label = key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  const strVal = String(value);
                  const showAsImage = displayAsImage || isImageUrl(strVal);
                  const href = strVal.startsWith("http") ? strVal : `https://${strVal}`;
                  return (
                    <div key={key} className="flex items-start">
                      <div className="flex-1 min-w-0">
                        {showTitle && (
                          <div className="text-sm font-medium mb-1 flex items-center gap-1.5">
                            <DynIcon name={icon} className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            {label}
                          </div>
                        )}
                        {showAsImage ? (
                          <img src={strVal} alt={label} className="max-w-full rounded border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : displayAsButton ? (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm w-full justify-center">
                            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                            {buttonText || label}
                          </a>
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-300">{strVal}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Claim Yours Now — embedded at bottom of sidebar */}
              {getSectionEnabled("claim") && (() => {
                const claimSection = getEntrySection("claim");
                const p = claimSection?.props ?? {};
                return (
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                    {claimSection?.heading && (
                      <p className="font-semibold text-base mb-4" style={{ color: sidebarProps.headingColor || undefined }}>
                        {claimSection.heading}
                      </p>
                    )}
                    {p.bodyText && (
                      <p className="text-sm text-muted-foreground mb-4">{p.bodyText}</p>
                    )}
                    <EntryClaimFormBlock section={claimSection ?? { id: "claim", label: "Claim Yours Now", enabled: true }} />
                  </div>
                );
              })()}
            </div>
          );

          return (
            <div className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden shadow-sm">
              {/* Header */}
              {getSectionEnabled("header") && (
                <div className="border-b" style={{ backgroundColor: headerProps.backgroundColor || undefined, fontFamily: headerProps.fontFamily ? getFontFamily(headerProps.fontFamily) : undefined }}>
                  {renderHeaderContent(headerProps)}
                  {/* Custom fields assigned to the Title & Summary section */}
                  {cfForSection(allCfds, "header").map(({ key, showTitle, displayAsImage, displayAsButton, buttonText, icon }) => {
                    const value = (displayEntry as any)?.customFields?.[key];
                    if (!value) return null;
                    const label = key.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                    const strVal = String(value);
                    const showAsImage = displayAsImage || isImageUrl(strVal);
                    const href = strVal.startsWith("http") ? strVal : `https://${strVal}`;
                    return (
                      <div key={key} className="px-8 md:px-10 pb-6">
                        {showTitle && (
                          <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <DynIcon name={icon} className="h-3.5 w-3.5 flex-shrink-0" />
                            {label}
                          </div>
                        )}
                        {showAsImage ? (
                          <img src={strVal} alt={label} className="max-w-xs rounded-lg border object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : displayAsButton ? (
                          <a href={href} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                            <ExternalLink className="h-4 w-4 flex-shrink-0" />
                            {buttonText || label}
                          </a>
                        ) : (
                          <div className="text-sm text-gray-700 dark:text-gray-300">{strVal}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Content + Sidebar — order respects saved template */}
              {(descEnabled || sidebarEnabled) && (
                <div className="flex flex-col md:flex-row">
                  {savedDescOnLeft ? (
                    <>
                      {descEnabled && descCol}
                      {sidebarEnabled && sidebarCol}
                    </>
                  ) : (
                    <>
                      {sidebarEnabled && sidebarCol}
                      {descEnabled && descCol}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Outside-card sections (Related) — rendered in saved template order */}
        {ts.entry.sections
          .filter(s => s.id === "related")
          .map(s => {
            if (s.id !== "related") return null;
            if (!getSectionEnabled("related") || isDemo || !relatedData) return null;
            const relatedMax = getEntrySection("related")?.props?.maxItems ?? 3;
            const filtered = relatedData.entries.filter((e) => e.id !== entryNumericId);
            if (filtered.length === 0) return null;
            const relatedGridCols = relatedMax === 1 ? "grid-cols-1" : relatedMax === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3";
            return (
              <div key="related" className="pt-8">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  {getEntrySection("related")?.heading || `Similar in ${displayEntry.category}`}
                </h2>
                <div className={`grid ${relatedGridCols} gap-6`}>
                  {filtered.slice(0, relatedMax).map((related) => (
                    <Link key={related.id} href={`/entry/${(related as any).slug || related.id}`}>
                      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-3"><CardTitle className="text-lg line-clamp-1">{related.title}</CardTitle></CardHeader>
                        <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{related.summary}</p></CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
