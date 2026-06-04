import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetSettings,
  useUpdateSettings,
  useListPublicEntries,
  getGetPublicSettingsQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, Save, Eye, Loader2, GripVertical, Trash2, EyeOff,
  LayoutTemplate, Image, Type, Grid3x3, Star, Clock, Search,
  FileText, Info, PanelRight, Link2, Heading1, AlignLeft, AlignCenter,
  AlignRight, Plus, X, Layers, CheckCircle2, RefreshCw,
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Settings2,
  Sparkles, RotateCcw, MapPin, Globe, CalendarDays, Building2, Tag, Mail, Phone,
} from "lucide-react";
import {
  DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import {
  type SectionConfig, type SectionProps, type BlockDefinition, type TemplateSettings,
  mergeTemplateSettings, getBlockType, getBlockDefs, FONTS, getFontFamily,
  DEFAULT_HOMEPAGE_SECTIONS, BROWSE_CARD_FIELDS,
} from "@/lib/templateTypes";

// ─── Block type icon map ─────────────────────────────────────────────────
const BLOCK_ICONS: Record<string, React.ReactNode> = {
  hero:          <Image className="h-4 w-4" />,
  categories:    <Grid3x3 className="h-4 w-4" />,
  featured:      <Star className="h-4 w-4" />,
  recent:        <Clock className="h-4 w-4" />,
  "custom-text": <Type className="h-4 w-4" />,
  "custom-image":<Image className="h-4 w-4" />,
  header:        <Heading1 className="h-4 w-4" />,
  filters:       <Search className="h-4 w-4" />,
  grid:          <Grid3x3 className="h-4 w-4" />,
  description:   <FileText className="h-4 w-4" />,
  moreDetails:   <Info className="h-4 w-4" />,
  sidebar:       <PanelRight className="h-4 w-4" />,
  related:       <Link2 className="h-4 w-4" />,
};

const HEADING_SIZES = [
  { label: "S", value: "1.125rem" },
  { label: "M", value: "1.5rem" },
  { label: "L", value: "1.875rem" },
  { label: "XL", value: "2.25rem" },
  { label: "2XL", value: "3rem" },
];

const BODY_SIZES = [
  { label: "S", value: "0.875rem" },
  { label: "M", value: "1rem" },
  { label: "L", value: "1.125rem" },
  { label: "XL", value: "1.25rem" },
];

// ─── WYSIWYG Rich Text Editor (Tiptap) ──────────────────────────────────
function WysiwygEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Underline,
    ],
    content: content || "<p>Write your content here...</p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external content changes (e.g. switching selected block)
  const lastContent = useRef(content);
  const isExternalUpdate = useRef(false);
  useEffect(() => {
    if (editor && content !== lastContent.current) {
      lastContent.current = content;
      const cur = editor.getHTML();
      if (content !== cur) {
        isExternalUpdate.current = true;
        editor.commands.setContent(content || "<p></p>");
        isExternalUpdate.current = false;
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, title, children }: {
    active: boolean; onClick: () => void; title: string; children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Btn>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <span className="text-xs font-bold">H2</span>
        </Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <span className="text-xs font-bold">H3</span>
        </Btn>
        <Btn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">
          <span className="text-xs">P</span>
        </Btn>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
          <AlignLeft className="h-3.5 w-3.5" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align Center">
          <AlignCenter className="h-3.5 w-3.5" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
          <AlignRight className="h-3.5 w-3.5" />
        </Btn>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text color */}
        <div className="flex items-center gap-1" title="Text Color">
          <span className="text-xs text-gray-500 font-bold">A</span>
          <input
            type="color"
            defaultValue="#000000"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 rounded cursor-pointer border border-gray-300 dark:border-gray-600 p-0"
          />
        </div>
      </div>

      {/* Editor body */}
      <EditorContent
        editor={editor}
        className={`
          px-3 py-2 min-h-[120px] text-sm
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[100px]
          [&_.ProseMirror_p]:my-1
          [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2
          [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:my-1.5
          [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-1
          [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-1
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
        `}
      />
    </div>
  );
}

// ─── Card Fields Editor (for Browse Page "Entry Cards Grid" section) ─────

function getCardFieldValue(entry: any, fieldId: string): string | null {
  if (fieldId.startsWith("custom:")) {
    const k = fieldId.slice(7);
    const cf = entry?.customFields;
    if (cf && typeof cf === "object" && cf[k] != null && cf[k] !== "") {
      return String(cf[k]).substring(0, 120);
    }
    return null;
  }
  switch (fieldId) {
    case "category":  return entry.category ?? null;
    case "location":  return entry.location ?? null;
    case "venue":     return entry.venue ?? null;
    case "startDate": return entry.startDate ? String(entry.startDate) : null;
    case "endDate":   return entry.endDate ? String(entry.endDate) : null;
    case "eventType": return entry.eventType ?? null;
    case "website":   return entry.website ? String(entry.website).replace(/^https?:\/\//, "") : null;
    case "tags":      return entry.tags ? String(entry.tags).split(",").slice(0, 3).map((t: string) => t.trim()).join(", ") : null;
    case "contactEmail": return entry.contactEmail ?? null;
    case "contactPhone": return entry.contactPhone ?? null;
    default:          return null;
  }
}

function prettifyKey(key: string): string {
  return key.replace(/[_\-]/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, c => c.toUpperCase());
}

function CardFieldRowIcon({ id }: { id: string }) {
  if (id.startsWith("custom:")) return <Sparkles className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
  switch (id) {
    case "location":  return <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "venue":     return <Building2 className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "startDate":
    case "endDate":   return <CalendarDays className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "website":   return <Globe className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "tags":      return <Tag className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "contactEmail": return <Mail className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    case "contactPhone": return <Phone className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
    default:          return <Info className="h-3 w-3 flex-shrink-0 text-muted-foreground" />;
  }
}

function SortableCardFieldRow({
  id, label, enabled, atMax, onToggle, isImageField, onToggleImage,
}: {
  id: string; label: string; enabled: boolean; atMax: boolean;
  onToggle: () => void; isImageField: boolean; onToggleImage: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
        enabled
          ? "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-60"
      }`}
    >
      <div
        {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 flex-shrink-0 touch-none"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <span className={`flex-1 text-xs font-medium ${enabled ? "text-blue-700 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"}`}>
        {label}
      </span>
      {/* Image toggle — only visible when field is enabled */}
      {enabled && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onToggleImage(); }}
          title={isImageField ? "Showing as image — click to show as text" : "Click to display value as an image"}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            isImageField
              ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400"
              : "text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Image className="h-3 w-3" />
        </button>
      )}
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={atMax}
        className="data-[state=checked]:bg-blue-500 flex-shrink-0 h-4 w-7 [&>span]:h-3 [&>span]:w-3"
      />
    </div>
  );
}

// Standard card-compatible fields in preferred display order
const STANDARD_CARD_FIELDS: Array<{ id: string; label: string }> = [
  { id: "category",     label: "Category Badge" },
  { id: "location",     label: "Location" },
  { id: "startDate",    label: "Start Date" },
  { id: "endDate",      label: "End Date" },
  { id: "venue",        label: "Venue" },
  { id: "eventType",    label: "Event Type" },
  { id: "tags",         label: "Tags" },
  { id: "website",      label: "Website" },
  { id: "contactEmail", label: "Email" },
  { id: "contactPhone", label: "Phone" },
];

function buildAvailableFields(entries: any[]): Array<{ id: string; label: string }> {
  if (entries.length === 0) return STANDARD_CARD_FIELDS;

  const fields: Array<{ id: string; label: string }> = [];

  // Standard fields — only include if any entry has a value
  for (const f of STANDARD_CARD_FIELDS) {
    const hasData = entries.some(e => {
      const v = getCardFieldValue(e, f.id);
      return v !== null && v !== "";
    });
    if (hasData) fields.push(f);
  }

  // Custom fields — collect all non-empty keys from customFields JSONB
  const seen = new Set<string>();
  for (const e of entries) {
    const cf = e?.customFields;
    if (cf && typeof cf === "object" && !Array.isArray(cf)) {
      for (const k of Object.keys(cf)) {
        if (!seen.has(k) && cf[k] != null && cf[k] !== "") {
          seen.add(k);
          fields.push({ id: `custom:${k}`, label: prettifyKey(k) });
        }
      }
    }
  }

  return fields;
}

function CardFieldsEditor({
  cardFields, onChange, cardImageFields, onImageFieldsChange,
}: {
  cardFields: string[];
  onChange: (fields: string[]) => void;
  cardImageFields: string[];
  onImageFieldsChange: (fields: string[]) => void;
}) {
  const { data: entriesData } = useListPublicEntries({ limit: 50, page: 1 });
  const entries = (entriesData?.entries ?? []) as any[];
  const previewEntry = entries[0];

  // Dynamically derived list of available fields based on real entry data
  const availableFields = buildAvailableFields(entries);
  const availableIds = availableFields.map(f => f.id);

  // Enabled IDs that are valid (may include previously saved IDs not yet discovered)
  const enabledIds = cardFields.filter(id => availableIds.includes(id));
  const disabledIds = availableIds.filter(id => !enabledIds.includes(id));
  const orderedIds = [...enabledIds, ...disabledIds];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = orderedIds.indexOf(String(active.id));
    const newIdx = orderedIds.indexOf(String(over.id));
    const newOrder = arrayMove(orderedIds, oldIdx, newIdx);
    onChange(newOrder.filter(id => enabledIds.includes(id)));
  };

  const toggleField = (id: string) => {
    if (enabledIds.includes(id)) {
      onChange(enabledIds.filter(f => f !== id));
    } else {
      if (enabledIds.length >= 4) return;
      onChange([...enabledIds, id]);
    }
  };

  const isLoading = !entriesData;

  return (
    <div className="space-y-4">
      {/* Live entry card preview */}
      {previewEntry ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Card Preview · {previewEntry.title}</span>
          </div>
          <div className="p-3 space-y-1.5 bg-white dark:bg-gray-900">
            {enabledIds.includes("category") && previewEntry.category && (
              <span className="inline-block text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {previewEntry.category}
              </span>
            )}
            <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{previewEntry.title}</p>
            {previewEntry.summary && (
              <p className="text-xs text-gray-400 line-clamp-2">{previewEntry.summary}</p>
            )}
            <div className="space-y-1 pt-0.5">
              {enabledIds.filter(id => id !== "category").map(fid => {
                const val = getCardFieldValue(previewEntry, fid);
                if (!val) return null;
                if (cardImageFields.includes(fid)) {
                  return (
                    <img
                      key={fid}
                      src={val}
                      alt=""
                      className="h-10 w-10 rounded object-cover border border-gray-100 dark:border-gray-700"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  );
                }
                return (
                  <div key={fid} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <CardFieldRowIcon id={fid} />
                    <span className="line-clamp-1">{val}</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-blue-500 font-medium">View Details →</span>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-xs text-gray-400">
          Loading entry preview…
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 text-center text-xs text-gray-400">
          Add entries to see a live card preview
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visible Fields</p>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          enabledIds.length >= 4
            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}>
          {enabledIds.length} / 4
        </span>
      </div>
      <p className="text-xs text-gray-400 -mt-2 leading-relaxed">
        Toggle to show/hide · Drag to reorder · Up to 4 fields.
        Click the <Image className="inline h-3 w-3 mx-0.5 relative -top-px" /> icon on any enabled field to display its value as an image instead of text.
        {!isLoading && entries.length > 0 && (
          <span className="block mt-0.5 text-gray-300 dark:text-gray-600">
            Fields detected from your {entries.length >= 50 ? "50+" : entries.length} {entries.length === 1 ? "entry" : "entries"}.
          </span>
        )}
      </p>

      {/* Sortable field rows */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Detecting fields from your entries…
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {orderedIds.map(fid => {
                const fieldDef = availableFields.find(f => f.id === fid)!;
                if (!fieldDef) return null;
                const isEnabled = enabledIds.includes(fid);
                const atMax = enabledIds.length >= 4 && !isEnabled;
                const isImg = cardImageFields.includes(fid);
                return (
                  <SortableCardFieldRow
                    key={fid}
                    id={fid}
                    label={fieldDef.label}
                    enabled={isEnabled}
                    atMax={atMax}
                    onToggle={() => toggleField(fid)}
                    isImageField={isImg}
                    onToggleImage={() => {
                      if (isImg) {
                        onImageFieldsChange(cardImageFields.filter(f => f !== fid));
                      } else {
                        onImageFieldsChange([...cardImageFields, fid]);
                      }
                    }}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ─── Visual block preview ────────────────────────────────────────────────
function BlockPreview({ block, themeColor, siteSettings }: {
  block: SectionConfig;
  themeColor: string;
  siteSettings: any;
}) {
  const type = getBlockType(block);
  const p = block.props ?? {};
  const align = p.textAlignment ?? "center";
  const textAlignClass = align === "right" ? "text-right" : align === "left" ? "text-left" : "text-center";
  const fontStyle = p.fontFamily ? { fontFamily: getFontFamily(p.fontFamily) } : {};

  if (type === "hero") {
    const hasBg = !!p.backgroundImage;
    return (
      <div
        className={`w-full rounded-lg overflow-hidden relative ${p.padding === "sm" ? "py-8" : p.padding === "lg" ? "py-24" : "py-14"} px-10 ${textAlignClass}`}
        style={{
          background: hasBg
            ? `linear-gradient(rgba(0,0,0,${(p.overlayOpacity ?? 50) / 100}), rgba(0,0,0,${(p.overlayOpacity ?? 50) / 100})), url(${p.backgroundImage}) center/cover`
            : (p.backgroundColor || "#1e293b"),
          ...fontStyle,
        }}
      >
        <h2
          className="font-extrabold mb-2 leading-tight"
          style={{
            color: p.headingColor || p.textColor || "#ffffff",
            fontSize: p.headingFontSize || "1.5rem",
          }}
        >
          {siteSettings?.homepageHeadline || block.heading || "Your Hero Headline"}
        </h2>
        <p
          className="opacity-80 mb-5 max-w-xl mx-auto"
          style={{
            color: p.textColor || "#e2e8f0",
            fontSize: p.bodyFontSize || "0.875rem",
          }}
        >
          {siteSettings?.homepageDescription || "A short subtitle describing your directory."}
        </p>
        {p.buttonText ? (
          <span className="inline-block px-5 py-2 rounded-lg font-semibold text-white" style={{ background: p.buttonColor || themeColor, fontSize: p.bodyFontSize || "0.875rem" }}>
            {p.buttonText}
          </span>
        ) : (
          <span className="inline-block px-5 py-2 rounded-lg text-sm font-semibold text-white opacity-60 border border-white/30">
            Add a CTA button in properties →
          </span>
        )}
      </div>
    );
  }

  if (type === "categories") {
    const cols = p.columns ?? 4;
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700" style={fontStyle}>
        <h3
          className="font-bold mb-4"
          style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || "1.125rem" }}
        >
          {block.heading || "Browse by Category"}
        </h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, 1fr)` }}>
          {["AI", "Technology", "Events", "Finance", "Marketing", "Design", "Business", "Health"].slice(0, p.maxItems ?? 8).map((cat, i) => (
            <div key={i} className="rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700">
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{cat}</div>
              <div className="text-xs text-gray-400 mt-0.5">12 entries</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "featured" || type === "recent") {
    const heading = block.heading || (type === "featured" ? "Featured" : "Recently Added");
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700" style={fontStyle}>
        <h3
          className="font-bold mb-4"
          style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || "1.125rem" }}
        >
          {heading}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
              <div className="h-2.5 bg-primary/20 rounded w-16" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-3/5 mt-2" />
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="h-6 bg-gray-50 dark:bg-gray-700 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "custom-text") {
    const hasRich = !!p.richBodyText && p.richBodyText !== "<p></p>";
    return (
      <div
        className={`w-full rounded-lg p-8 border border-gray-100 dark:border-gray-700 ${textAlignClass}`}
        style={{ background: p.backgroundColor || "#ffffff", ...fontStyle }}
      >
        {block.heading && (
          <h3
            className="font-bold mb-3"
            style={{
              color: p.headingColor || p.textColor || "#111827",
              fontSize: p.headingFontSize || "1.25rem",
            }}
          >
            {block.heading}
          </h3>
        )}
        {hasRich ? (
          <div
            className="prose prose-sm max-w-none text-left"
            style={{ color: p.textColor || undefined, fontSize: p.bodyFontSize || "1rem" }}
            dangerouslySetInnerHTML={{ __html: p.richBodyText! }}
          />
        ) : (
          <p className="leading-relaxed text-gray-500" style={{ fontSize: p.bodyFontSize || "1rem" }}>
            {p.bodyText || "Add your content using the rich text editor in the properties panel →"}
          </p>
        )}
      </div>
    );
  }

  if (type === "custom-image") {
    return (
      <div className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.imageCaption || ""} className="w-full object-cover max-h-64" />
        ) : (
          <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
            <Image className="h-10 w-10 mb-2 opacity-40" />
            <span className="text-sm">Set image URL in the properties panel →</span>
          </div>
        )}
        {p.imageCaption && (
          <p className="text-xs text-center text-gray-500 py-2 bg-gray-50 dark:bg-gray-900">{p.imageCaption}</p>
        )}
      </div>
    );
  }

  if (type === "header") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-5 border border-gray-100 dark:border-gray-700" style={fontStyle}>
        <h3 className="font-bold" style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || "1.25rem" }}>
          {block.heading || "All Entries"}
        </h3>
        <p className="text-sm text-gray-400 mt-1">200 results found</p>
      </div>
    );
  }

  if (type === "filters") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Search keywords...</span>
          </div>
          <div className="flex gap-2">
            {["All", "AI", "Events", "Finance"].map(cat => (
              <span key={cat} className={`text-xs px-3 py-1.5 rounded-full font-medium ${cat === "All" ? "text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                style={cat === "All" ? { background: themeColor } : undefined}>{cat}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
              <div className="h-2 bg-primary/20 rounded w-14" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "description") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
        <div className="space-y-2">
          {[1, 0.9, 1, 0.7, 1, 0.85, 0.5].map((w, i) => (
            <div key={i} className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === "moreDetails") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 font-medium">Additional Information</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-2">
          {[1, 0.8, 0.9, 0.6].map((w, i) => (
            <div key={i} className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (type === "sidebar") {
    return (
      <div className="w-full rounded-lg bg-gray-50 dark:bg-gray-800/60 p-5 border border-gray-100 dark:border-gray-700" style={fontStyle}>
        <h4 className="font-semibold text-sm mb-4 text-gray-700 dark:text-gray-200">{p.sidebarTitle || "Contact & Details"}</h4>
        <div className="space-y-3">
          {[["📍", "Location"], ["🌐", "Website"], ["📧", "Email"], ["📞", "Phone"]].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1" />
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "related") {
    return (
      <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-5 border border-gray-100 dark:border-gray-700" style={fontStyle}>
        <h3 className="font-bold mb-4" style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || "1.125rem" }}>
          {block.heading || "Related Entries"}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-1.5">
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-gray-100 dark:bg-gray-800 p-5 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400">
      <Layers className="h-5 w-5 mr-2" />
      <span className="text-sm">{block.label}</span>
    </div>
  );
}

// ─── Sortable block wrapper ──────────────────────────────────────────────
function SortableBlock({ block, isSelected, onSelect, onRemove, onToggle, themeColor, siteSettings }: {
  block: SectionConfig; isSelected: boolean; onSelect: () => void;
  onRemove: () => void; onToggle: () => void; themeColor: string; siteSettings: any;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`group relative rounded-xl border-2 transition-all ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-500/10"
          : "border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      } ${!block.enabled ? "opacity-50" : ""}`}
    >
      {/* Drag handle */}
      <div
        {...attributes} {...listeners}
        className="absolute -left-7 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Top-right: eye + trash (hover only) */}
      <div className="absolute -top-3 right-14 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={e => { e.stopPropagation(); onToggle(); }}
          className="p-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700" title={block.enabled ? "Hide section" : "Show section"}>
          <EyeOff className="h-3.5 w-3.5 text-gray-500" />
        </button>
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded-md bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900 shadow-sm hover:bg-red-50 dark:hover:bg-red-950" title="Remove section">
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>

      {/* Gear button — always visible, top-right corner */}
      <button
        onClick={e => { e.stopPropagation(); onSelect(); }}
        title="Edit section properties"
        className={`absolute -top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm border transition-all ${
          isSelected
            ? "bg-blue-500 border-blue-500 text-white"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500"
        }`}
      >
        <Settings2 className="h-3 w-3" />
        {isSelected ? "Editing" : "Edit"}
      </button>

      {!block.enabled && (
        <div className="absolute -top-3 left-3 px-2 py-0.5 bg-gray-500 text-white text-xs font-medium rounded-full flex items-center gap-1 z-10">
          <EyeOff className="h-3 w-3" /> Hidden
        </div>
      )}

      <BlockPreview block={block} themeColor={themeColor} siteSettings={siteSettings} />
    </div>
  );
}

// ─── Block library panel ─────────────────────────────────────────────────
function BlockLibraryPanel({ pageType, existingIds, onAdd }: {
  pageType: string; existingIds: string[]; onAdd: (def: BlockDefinition) => void;
}) {
  const defs = getBlockDefs(pageType);
  return (
    <div className="w-60 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white">Add Section</h3>
        <p className="text-xs text-gray-400 mt-0.5">Click to add to your page</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {defs.map(def => {
          const isCustom = def.type.startsWith("custom-");
          const isPresent = existingIds.some(id => id === def.type || id.startsWith(`${def.type}-`));
          const canAdd = isCustom || !isPresent;
          return (
            <button key={def.type} onClick={() => canAdd && onAdd(def)} disabled={!canAdd}
              className={`w-full text-left p-3 rounded-lg border transition-all ${canAdd
                ? "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:hover:border-blue-700 cursor-pointer"
                : "border-gray-100 dark:border-gray-800 opacity-40 cursor-not-allowed"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-500 dark:text-gray-400">{BLOCK_ICONS[def.type] ?? <Layers className="h-4 w-4" />}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-white">{def.label}</span>
                {!canAdd ? <span className="ml-auto text-xs text-gray-400">Added</span> : <Plus className="ml-auto h-3.5 w-3.5 text-gray-400" />}
              </div>
              <p className="text-xs text-gray-400 leading-snug">{def.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Properties panel ────────────────────────────────────────────────────
function PropertiesPanel({ block, onChange, onPropsChange, cardFields, onCardFieldsChange, cardImageFields, onCardImageFieldsChange }: {
  block: SectionConfig | null;
  onChange: (patch: Partial<SectionConfig>) => void;
  onPropsChange: (patch: Partial<SectionProps>) => void;
  cardFields?: string[];
  onCardFieldsChange?: (fields: string[]) => void;
  cardImageFields?: string[];
  onCardImageFieldsChange?: (fields: string[]) => void;
}) {
  if (!block) {
    return (
      <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-center text-center p-6">
        <div className="text-gray-400">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No section selected</p>
          <p className="text-xs mt-1">Click any section on the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  const type = getBlockType(block);
  const p = block.props ?? {};

  // ── Shared helper renderers ──────────────────────────────────────────
  const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );

  const textInput = (value: string | undefined, onCh: (v: string) => void, placeholder?: string) => (
    <Input value={value ?? ""} onChange={e => onCh(e.target.value)} placeholder={placeholder} className="h-8 text-sm" />
  );

  const colorPicker = (value: string | undefined, onCh: (v: string) => void, fallback = "#ffffff", label?: string) => (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input type="color" value={value || fallback} onChange={e => onCh(e.target.value)}
          className="w-9 h-8 rounded border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5 bg-transparent" />
      </div>
      <Input value={value ?? ""} onChange={e => onCh(e.target.value)} placeholder={label || fallback}
        className="h-8 text-sm font-mono flex-1" />
      {value && (
        <button onClick={() => onCh("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="h-4 w-4" /></button>
      )}
    </div>
  );

  const alignButtons = (value: string | undefined, onCh: (v: "left" | "center" | "right") => void) => (
    <div className="flex gap-1">
      {(["left", "center", "right"] as const).map(a => (
        <button key={a} onClick={() => onCh(a)}
          className={`flex-1 py-1.5 rounded border text-xs flex items-center justify-center transition-colors ${value === a ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300"}`}>
          {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
        </button>
      ))}
    </div>
  );

  const sizeButtons = (sizes: typeof HEADING_SIZES, value: string | undefined, onCh: (v: string) => void) => (
    <div className="flex gap-1">
      {sizes.map(s => (
        <button key={s.value} onClick={() => onCh(s.value)}
          className={`flex-1 py-1.5 text-xs rounded border font-medium transition-colors ${value === s.value ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
          {s.label}
        </button>
      ))}
    </div>
  );

  const fontFamilyPicker = (value: string | undefined, onCh: (v: string) => void) => (
    <Select value={value ?? "default"} onValueChange={v => onCh(v === "default" ? "" : v)}>
      <SelectTrigger className="h-8 text-sm">
        <SelectValue placeholder="Default font" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">
          <span className="text-gray-400">Default font</span>
        </SelectItem>
        {FONTS.map(f => (
          <SelectItem key={f.key} value={f.key}>
            <span style={{ fontFamily: f.family }}>{f.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Sections that have heading text
  const hasHeading = !["filters", "grid", "description", "moreDetails", "sidebar"].includes(type);
  // Sections that benefit from font/size controls
  const hasTypography = !["filters", "grid", "description", "moreDetails"].includes(type);

  return (
    <div className="w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <span className="text-gray-500">{BLOCK_ICONS[type] ?? <Layers className="h-4 w-4" />}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate">{block.label}</h3>
          <p className="text-xs text-gray-400">Section properties</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch checked={block.enabled} onCheckedChange={v => onChange({ enabled: v })} />
        </div>
      </div>

      {/* Scrollable properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* ── Heading text ── */}
        {hasHeading && (
          <Field label="Section Heading">
            {textInput(block.heading, v => onChange({ heading: v }), "e.g. Browse by Category")}
          </Field>
        )}

        {/* ── Typography section ── */}
        {hasTypography && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Typography</p>

              <Field label="Font Family">
                {fontFamilyPicker(p.fontFamily, v => onPropsChange({ fontFamily: v }))}
              </Field>

              {hasHeading && (
                <Field label="Heading Size">
                  {sizeButtons(HEADING_SIZES, p.headingFontSize, v => onPropsChange({ headingFontSize: v }))}
                </Field>
              )}

              {hasHeading && (
                <Field label="Heading Color">
                  {colorPicker(p.headingColor, v => onPropsChange({ headingColor: v }), "#111827", "Default")}
                </Field>
              )}

              {(type === "hero" || type === "custom-text" || type === "header") && (
                <Field label="Body / Subtitle Size">
                  {sizeButtons(BODY_SIZES, p.bodyFontSize, v => onPropsChange({ bodyFontSize: v }))}
                </Field>
              )}
            </div>
          </>
        )}

        {/* ── HERO specific ── */}
        {type === "hero" && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Background</p>
              <Field label="Background Image URL" hint="Full-width banner image behind the text">
                {textInput(p.backgroundImage, v => onPropsChange({ backgroundImage: v }), "https://example.com/banner.jpg")}
              </Field>
              <Field label="Background Color" hint="Used when no image is set">
                {colorPicker(p.backgroundColor, v => onPropsChange({ backgroundColor: v }), "#1e293b")}
              </Field>
              <Field label="Overlay Opacity">
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={90} step={5} value={p.overlayOpacity ?? 50}
                    onChange={e => onPropsChange({ overlayOpacity: Number(e.target.value) })}
                    className="flex-1 accent-blue-500" />
                  <span className="text-xs text-gray-500 w-8 text-right">{p.overlayOpacity ?? 50}%</span>
                </div>
              </Field>
              <Field label="Text Color">
                {colorPicker(p.textColor, v => onPropsChange({ textColor: v }), "#ffffff")}
              </Field>
              <Field label="Text Alignment">
                {alignButtons(p.textAlignment, v => onPropsChange({ textAlignment: v }))}
              </Field>
              <Field label="Padding">
                <div className="flex gap-1">
                  {(["sm", "md", "lg"] as const).map(s => (
                    <button key={s} onClick={() => onPropsChange({ padding: s })}
                      className={`flex-1 py-1.5 text-xs rounded border font-medium transition-colors ${(p.padding ?? "md") === s ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">CTA Button</p>
              <Field label="Button Text">
                {textInput(p.buttonText, v => onPropsChange({ buttonText: v }), "Browse All →")}
              </Field>
              <Field label="Button URL">
                {textInput(p.buttonUrl, v => onPropsChange({ buttonUrl: v }), "/browse")}
              </Field>
              <Field label="Button Color">
                {colorPicker(p.buttonColor, v => onPropsChange({ buttonColor: v }))}
              </Field>
            </div>
          </>
        )}

        {/* ── CUSTOM TEXT specific ── */}
        {type === "custom-text" && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content</p>
              <Field label="Rich Text Content">
                <WysiwygEditor
                  content={p.richBodyText ?? p.bodyText ?? ""}
                  onChange={v => onPropsChange({ richBodyText: v })}
                />
              </Field>
              <Field label="Text Alignment">
                {alignButtons(p.textAlignment, v => onPropsChange({ textAlignment: v }))}
              </Field>
              <Field label="Background Color">
                {colorPicker(p.backgroundColor, v => onPropsChange({ backgroundColor: v }), "#ffffff")}
              </Field>
              <Field label="Text Color" hint="Overrides individual text colors">
                {colorPicker(p.textColor, v => onPropsChange({ textColor: v }))}
              </Field>
            </div>
          </>
        )}

        {/* ── CUSTOM IMAGE specific ── */}
        {type === "custom-image" && (
          <>
            <Separator />
            <Field label="Image URL">
              {textInput(p.imageUrl, v => onPropsChange({ imageUrl: v }), "https://example.com/photo.jpg")}
            </Field>
            <Field label="Caption">
              {textInput(p.imageCaption, v => onPropsChange({ imageCaption: v }), "Optional caption...")}
            </Field>
          </>
        )}

        {/* ── GRID sections (categories, featured, recent, related) ── */}
        {["categories", "featured", "recent", "related"].includes(type) && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Layout</p>
              <Field label="Max Items">
                <Input type="number" min={1} max={24} value={p.maxItems ?? (type === "categories" ? 8 : 3)}
                  onChange={e => onPropsChange({ maxItems: Number(e.target.value) })} className="h-8 text-sm w-24" />
              </Field>
              {type === "categories" && (
                <Field label="Columns">
                  <div className="flex gap-1">
                    {[2, 3, 4].map(c => (
                      <button key={c} onClick={() => onPropsChange({ columns: c })}
                        className={`w-10 py-1.5 text-xs rounded border font-medium transition-colors ${(p.columns ?? 4) === c ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          </>
        )}

        {/* ── SIDEBAR specific ── */}
        {type === "sidebar" && (
          <>
            <Separator />
            <Field label="Sidebar Title">
              {textInput(p.sidebarTitle, v => onPropsChange({ sidebarTitle: v }), "Contact & Details")}
            </Field>
          </>
        )}

        {/* ── GRID: card fields editor ── */}
        {type === "grid" && cardFields !== undefined && onCardFieldsChange && (
          <>
            <Separator />
            <CardFieldsEditor
              cardFields={cardFields}
              onChange={onCardFieldsChange}
              cardImageFields={cardImageFields ?? []}
              onImageFieldsChange={onCardImageFieldsChange ?? (() => {})}
            />
          </>
        )}
        {type === "grid" && cardFields === undefined && (
          <>
            <Separator />
            <p className="text-xs text-gray-400 leading-relaxed">
              Open this section in the Browse Page Builder to configure which fields appear on entry cards.
            </p>
          </>
        )}

        {/* ── INFO for other layout-only sections ── */}
        {["filters", "description", "moreDetails"].includes(type) && (
          <>
            <Separator />
            <p className="text-xs text-gray-400 leading-relaxed">
              This section's appearance is controlled by your directory data and entry template settings.
            </p>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Main Builder Page ───────────────────────────────────────────────────
export default function BuilderPage() {
  const params = useParams() as { page: string };
  const pageType = params.page ?? "homepage";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: settingsData, isLoading } = useGetSettings();
  const updateMutation = useUpdateSettings();

  const [ts, setTs] = useState<TemplateSettings | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);

  const latestTsRef = useRef<TemplateSettings | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    if (settingsData && !ts) {
      const merged = mergeTemplateSettings((settingsData as any).templateSettings);
      setTs(merged);
      latestTsRef.current = merged;
    }
  }, [settingsData]);

  const pageKey = pageType === "homepage" ? "homepage" : pageType === "browse" ? "browse" : "entry";
  const blocks: SectionConfig[] = ts ? ts[pageKey].sections : [];

  // Auto-save: triggers 1.5s after the last change
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveState("saving");
    autoSaveTimerRef.current = setTimeout(async () => {
      const current = latestTsRef.current;
      if (!current || !settingsData) return;
      try {
        await updateMutation.mutateAsync({ data: { templateSettings: current } as any });
        qc.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setSaveState("saved");
        isDirtyRef.current = false;
        setTimeout(() => setSaveState("idle"), 2500);
      } catch {
        setSaveState("idle");
      }
    }, 1500);
  }, [settingsData, updateMutation, qc]);

  const updateBlocks = useCallback((newBlocks: SectionConfig[]) => {
    if (!latestTsRef.current) return;
    const newTs = {
      ...latestTsRef.current,
      [pageKey]: { ...latestTsRef.current[pageKey], sections: newBlocks },
    } as TemplateSettings;
    latestTsRef.current = newTs;
    setTs(newTs);
    isDirtyRef.current = true;
    scheduleAutoSave();
  }, [pageKey, scheduleAutoSave]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = blocks.findIndex(b => b.id === active.id);
      const newIdx = blocks.findIndex(b => b.id === over.id);
      updateBlocks(arrayMove(blocks, oldIdx, newIdx));
    }
  };

  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const current = latestTsRef.current;
    if (!current || !settingsData) return;
    setSaveState("saving");
    try {
      await updateMutation.mutateAsync({ data: { templateSettings: current } as any });
      qc.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Template saved!" });
      setSaveState("saved");
      isDirtyRef.current = false;
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (e: any) {
      setSaveState("idle");
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null;

  const updateBlock = (id: string, patch: Partial<SectionConfig>) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  const updateBlockProps = (id: string, propsPatch: Partial<SectionProps>) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...propsPatch } } : b));
  };

  const addBlock = (def: BlockDefinition) => {
    const isUnique = def.type.startsWith("custom-");
    const newId = isUnique ? `${def.type}-${Date.now()}` : def.type;
    if (!isUnique && blocks.find(b => b.id === newId)) return;
    const newBlock: SectionConfig = {
      id: newId, type: isUnique ? def.type : undefined,
      label: def.label, enabled: true,
      heading: def.defaultHeading ?? "",
      props: { ...(def.defaultProps ?? {}) },
    };
    const newBlocks = [...blocks, newBlock];
    updateBlocks(newBlocks);
    setSelectedId(newId);
    setTimeout(() => document.getElementById(`block-${newId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const updateCardFields = useCallback((fields: string[]) => {
    if (!latestTsRef.current) return;
    const newTs = {
      ...latestTsRef.current,
      browse: { ...latestTsRef.current.browse, cardFields: fields },
    } as TemplateSettings;
    latestTsRef.current = newTs;
    setTs(newTs);
    isDirtyRef.current = true;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const updateCardImageFields = useCallback((fields: string[]) => {
    if (!latestTsRef.current) return;
    const newTs = {
      ...latestTsRef.current,
      browse: { ...latestTsRef.current.browse, cardImageFields: fields },
    } as TemplateSettings;
    latestTsRef.current = newTs;
    setTs(newTs);
    isDirtyRef.current = true;
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const handleAiEnhance = async () => {
    if (aiEnhancing) return;
    setAiEnhancing(true);
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch("/api/builder/ai-enhance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sections: blocks,
          siteTitle: (settingsData as any)?.siteTitle,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Enhancement failed");
      }
      const data = await resp.json();
      if (data.sections && Array.isArray(data.sections)) {
        updateBlocks(data.sections);
        setAiEnhanced(true);
        toast({ title: "Homepage enhanced by AI!", description: "Review the new layout. Use 'Restore Defaults' to undo." });
      }
    } catch (e: any) {
      toast({ title: "Enhancement failed", description: e.message, variant: "destructive" });
    } finally {
      setAiEnhancing(false);
    }
  };

  const handleRestoreDefaults = () => {
    updateBlocks(DEFAULT_HOMEPAGE_SECTIONS.map(s => ({ ...s })));
    setAiEnhanced(false);
    setSelectedId(null);
    toast({ title: "Restored to default layout" });
  };

  const pageLabel = pageType === "homepage" ? "Homepage" : pageType === "browse" ? "Browse Page" : "Entry Detail";
  const previewPath = pageType === "homepage" ? "/" : pageType === "browse" ? "/browse" : "/entry/demo1";
  const themeColor = (settingsData as any)?.themeColor || "#3b82f6";

  if (isLoading || !ts) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-950 z-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 dark:bg-gray-950 z-50 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 shadow-sm">
        <button onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium">
          <ChevronLeft className="h-4 w-4" /> Settings
        </button>
        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-blue-500" />
          <span className="font-semibold text-gray-800 dark:text-white">{pageLabel} Builder</span>
        </div>

        {/* Auto-save status */}
        <div className="flex items-center gap-1.5 ml-2">
          {saveState === "saving" && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Auto-saving…
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved & live
            </span>
          )}
          {saveState === "idle" && isDirtyRef.current && (
            <span className="text-xs text-gray-400">Unsaved</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* AI buttons — homepage only */}
          {pageType === "homepage" && (
            <>
              {aiEnhanced && (
                <Button variant="outline" size="sm" onClick={handleRestoreDefaults}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50">
                  <RotateCcw className="h-4 w-4 mr-1.5" /> Restore Defaults
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiEnhance}
                disabled={aiEnhancing}
                className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30"
              >
                {aiEnhancing
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <Sparkles className="h-4 w-4 mr-1.5" />}
                {aiEnhancing ? "Enhancing…" : "Enhance With AI"}
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" asChild>
            <a href={previewPath} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-1.5" /> Preview
            </a>
          </Button>
          <Button size="sm" onClick={handleManualSave} disabled={saveState === "saving"}
            style={{ background: themeColor }}>
            {saveState === "saving"
              ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              : <Save className="h-4 w-4 mr-1.5" />}
            Save Now
          </Button>
        </div>
      </div>

      {/* ── Three-column builder ── */}
      <div className="flex-1 flex overflow-hidden">
        <BlockLibraryPanel pageType={pageType} existingIds={blocks.map(b => b.id)} onAdd={addBlock} />

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8" onClick={() => setSelectedId(null)}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{pageLabel} Canvas</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 pl-8">
                  {blocks.map(block => (
                    <div key={block.id} id={`block-${block.id}`}>
                      <SortableBlock
                        block={block}
                        isSelected={selectedId === block.id}
                        onSelect={() => setSelectedId(prev => prev === block.id ? null : block.id)}
                        onRemove={() => removeBlock(block.id)}
                        onToggle={() => updateBlock(block.id, { enabled: !block.enabled })}
                        themeColor={themeColor}
                        siteSettings={settingsData}
                      />
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {blocks.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl py-24 text-center text-gray-400">
                <LayoutTemplate className="h-14 w-14 mx-auto mb-4 opacity-20" />
                <p className="font-semibold text-lg">Canvas is empty</p>
                <p className="text-sm mt-1">Add sections from the panel on the left.</p>
              </div>
            )}

            <div className="mt-8 text-center text-xs text-gray-400">
              Drag sections to reorder · Click to select and edit properties
            </div>
          </div>
        </div>

        {/* Properties */}
        <PropertiesPanel
          block={selectedBlock}
          onChange={patch => selectedId && updateBlock(selectedId, patch)}
          onPropsChange={patch => selectedId && updateBlockProps(selectedId, patch)}
          cardFields={pageType === "browse" ? ts.browse.cardFields : undefined}
          onCardFieldsChange={pageType === "browse" ? updateCardFields : undefined}
          cardImageFields={pageType === "browse" ? ts.browse.cardImageFields : undefined}
          onCardImageFieldsChange={pageType === "browse" ? updateCardImageFields : undefined}
        />
      </div>
    </div>
  );
}
