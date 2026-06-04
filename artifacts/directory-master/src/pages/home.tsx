import { useCallback, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPublicStats,
  useGetFeaturedEntries,
  useGetRecentEntries,
  useGetPublicSettings,
  useGetCurrentUser,
  useUpdateSettings,
  useCreateContact,
  getGetPublicSettingsQueryKey,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin, ArrowRight, Search, GripVertical, Eye, EyeOff, Pencil, Trash2,
  Plus, CheckCircle2, Loader2, LayoutTemplate, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, MousePointerClick,
  Grid3X3, Star, Clock, CalendarDays, Building2, Globe, Tag, Mail, Phone, Sparkles, Info, ClipboardCheck,
} from "lucide-react";
import { FontLoader } from "@/components/template/FontLoader";
import {
  mergeTemplateSettings, getFontFamily,
  HOMEPAGE_BLOCK_DEFS,
  type SectionConfig, type SectionProps, type BlockDefinition,
} from "@/lib/templateTypes";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext, DragOverlay, type DragEndEvent, type DragStartEvent,
  useSensor, useSensors, PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Block type icon mapping ──────────────────────────────────────────────────
function BlockIcon({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  switch (type) {
    case "hero":         return <LayoutTemplate className={className} />;
    case "categories":   return <Grid3X3 className={className} />;
    case "featured":     return <Star className={className} />;
    case "recent":       return <Clock className={className} />;
    case "custom-text":  return <AlignLeft className={className} />;
    case "custom-image": return <ImageIcon className={className} />;
    case "custom-cta":   return <MousePointerClick className={className} />;
    case "custom-claim": return <ClipboardCheck className={className} />;
    default:             return <LayoutTemplate className={className} />;
  }
}

// ─── Claim Your Listing form block ────────────────────────────────────────────
function ClaimFormBlock({ section }: { section: SectionConfig }) {
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

  if (submitted) {
    return (
      <div className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 max-w-md mx-auto">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
        <p className="font-medium text-green-800 dark:text-green-300">
          {p.thankYouMessage || "Thank you! We'll be in touch soon."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Full Name <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          required
          placeholder="Jane Smith"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Phone Number <span className="text-red-500">*</span>
        </label>
        <Input
          type="tel"
          required
          placeholder="(555) 123-4567"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: p.textColor || undefined }}>
          Email Address <span className="text-red-500">*</span>
        </label>
        <Input
          type="email"
          required
          placeholder="jane@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      {errorMsg && (
        <p className="text-sm text-red-500">{errorMsg}</p>
      )}
      <Button
        type="submit"
        disabled={createContact.isPending}
        className="w-full"
        style={{
          ...(p.buttonColor ? { backgroundColor: p.buttonColor, borderColor: p.buttonColor } : {}),
          ...(p.buttonTextColor ? { color: p.buttonTextColor } : {}),
        }}
      >
        {createContact.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
        ) : (
          p.buttonText || "Submit"
        )}
      </Button>
    </form>
  );
}

// ─── Sortable section wrapper for edit mode ───────────────────────────────────
function SortableHomeSectionWrapper({
  section,
  onDelete,
  onEdit,
  onToggle,
  children,
}: {
  section: SectionConfig;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: section.id });

  const blockDef = HOMEPAGE_BLOCK_DEFS.find(d => d.type === (section.type ?? section.id));
  const label = blockDef?.label ?? section.label;
  const isSingleton = !["custom-text", "custom-image", "custom-cta"].includes(section.type ?? section.id);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className={`relative rounded-xl border-2 border-dashed overflow-hidden transition-all ${
        section.enabled
          ? "border-blue-400 bg-white dark:bg-gray-900"
          : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
      }`}
    >
      {/* ── Handle bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-500 text-white text-xs font-medium select-none">
        <div className="flex items-center gap-2">
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
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            title={section.enabled ? "Hide section" : "Show section"}
            className="p-1 rounded hover:bg-blue-400 transition-colors"
          >
            {section.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit section"
            className="p-1 rounded hover:bg-blue-400 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {!isSingleton && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Remove section"
              className="p-1 rounded hover:bg-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Section content (non-interactive preview) ── */}
      {section.enabled ? (
        <div className="pointer-events-none select-none overflow-hidden max-h-72">{children}</div>
      ) : (
        <div className="px-6 py-5 text-sm text-gray-400 italic flex items-center gap-2">
          <EyeOff className="h-4 w-4 flex-shrink-0" />
          Section hidden — click the eye icon to restore it
        </div>
      )}
    </div>
  );
}

// ─── Inline section editor dialog ────────────────────────────────────────────
function EditSectionDialog({
  section,
  onSave,
  onClose,
}: {
  section: SectionConfig;
  onSave: (updated: SectionConfig) => void;
  onClose: () => void;
}) {
  const type = section.type ?? section.id;
  const [heading, setHeading] = useState(section.heading ?? "");
  // Initialise from richBodyText (strip tags) if it exists, otherwise plain bodyText
  const [bodyText, setBodyText] = useState(() => {
    const rich = section.props?.richBodyText;
    if (rich) return rich.replace(/<[^>]*>/g, "").trim();
    return section.props?.bodyText ?? "";
  });
  const [imageUrl, setImageUrl] = useState(section.props?.imageUrl ?? "");
  const [imageCaption, setImageCaption] = useState(section.props?.imageCaption ?? "");
  // Text block / CTA color controls
  const [bgColor, setBgColor] = useState(section.props?.backgroundColor ?? "");
  const [headingColor, setHeadingColor] = useState(section.props?.headingColor ?? "");
  const [textColor, setTextColor] = useState(section.props?.textColor ?? "");
  // Text alignment
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(section.props?.textAlignment ?? "left");
  // CTA-specific
  const [ctaButtonText, setCtaButtonText] = useState(section.props?.buttonText ?? "");
  const [ctaButtonUrl, setCtaButtonUrl] = useState(section.props?.buttonUrl ?? "");
  const [ctaButtonTarget, setCtaButtonTarget] = useState<"_self" | "_blank">((section.props?.buttonTarget as "_self" | "_blank") ?? "_self");
  const [ctaButtonColor, setCtaButtonColor] = useState(section.props?.buttonColor ?? "");
  const [ctaButtonRadius, setCtaButtonRadius] = useState<"rounded" | "square">((section.props?.buttonRadius as "rounded" | "square") ?? "rounded");
  const [ctaFontSize, setCtaFontSize] = useState(section.props?.bodyFontSize ?? "1rem");
  // Claim-specific
  const [claimButtonText, setClaimButtonText] = useState(section.props?.buttonText ?? "Submit");
  const [claimThankYou, setClaimThankYou] = useState(section.props?.thankYouMessage ?? "Thank you! We'll be in touch soon.");
  const [claimButtonColor, setClaimButtonColor] = useState(section.props?.buttonColor ?? "");
  const [claimButtonTextColor, setClaimButtonTextColor] = useState(section.props?.buttonTextColor ?? "");

  const handleSave = () => {
    const updatedProps = {
      ...section.props,
      // For custom-text: set plain bodyText, wipe richBodyText, and apply colors
      ...(type === "custom-text" ? {
        bodyText,
        richBodyText: undefined,
        backgroundColor: bgColor || undefined,
        headingColor: headingColor || undefined,
        textColor: textColor || undefined,
        textAlignment: alignment,
      } : {}),
      ...(type === "custom-image" ? { imageUrl, imageCaption } : {}),
      ...(type === "custom-cta" ? {
        buttonText: ctaButtonText,
        buttonUrl: ctaButtonUrl,
        buttonTarget: ctaButtonTarget,
        buttonColor: ctaButtonColor || undefined,
        buttonRadius: ctaButtonRadius,
        bodyFontSize: ctaFontSize,
        backgroundColor: bgColor || undefined,
        textColor: textColor || undefined,
        textAlignment: alignment,
      } : {}),
      ...(type === "custom-claim" ? {
        bodyText,
        buttonText: claimButtonText,
        buttonColor: claimButtonColor || undefined,
        buttonTextColor: claimButtonTextColor || undefined,
        thankYouMessage: claimThankYou,
        backgroundColor: bgColor || undefined,
        textColor: textColor || undefined,
        textAlignment: alignment,
      } : {}),
    };
    onSave({ ...section, heading, props: updatedProps });
    onClose();
  };

  const blockDef = HOMEPAGE_BLOCK_DEFS.find(d => d.type === type);
  const label = blockDef?.label ?? section.label;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BlockIcon type={type} className="h-4 w-4 text-blue-500" />
            Edit {label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          {type !== "hero" && (
            <div className="space-y-1.5">
              <Label>Section Heading</Label>
              <Input
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Section heading..."
              />
            </div>
          )}
          {type === "custom-text" && (
            <>
              <div className="space-y-1.5">
                <Label>Body Text</Label>
                <Textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={5}
                  placeholder="Enter body text..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Text Alignment</Label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => {
                    const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAlignment(a)}
                        className={`flex items-center justify-center w-9 h-9 rounded border transition-colors ${
                          alignment === a
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                        title={a.charAt(0).toUpperCase() + a.slice(1)}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</p>
                {/* Background color */}
                <div className="space-y-1.5">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-9 rounded border cursor-pointer p-0.5"
                      value={bgColor || "#ffffff"}
                      onChange={e => setBgColor(e.target.value)}
                    />
                    <Input
                      className="w-32 font-mono text-sm"
                      placeholder="#ffffff"
                      value={bgColor}
                      onChange={e => setBgColor(e.target.value)}
                    />
                    {bgColor && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setBgColor("")}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                {/* Heading color */}
                <div className="space-y-1.5">
                  <Label>Section Heading Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-9 rounded border cursor-pointer p-0.5"
                      value={headingColor || "#111827"}
                      onChange={e => setHeadingColor(e.target.value)}
                    />
                    <Input
                      className="w-32 font-mono text-sm"
                      placeholder="#111827"
                      value={headingColor}
                      onChange={e => setHeadingColor(e.target.value)}
                    />
                    {headingColor && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setHeadingColor("")}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                {/* Body text color */}
                <div className="space-y-1.5">
                  <Label>Body Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-9 rounded border cursor-pointer p-0.5"
                      value={textColor || "#374151"}
                      onChange={e => setTextColor(e.target.value)}
                    />
                    <Input
                      className="w-32 font-mono text-sm"
                      placeholder="#374151"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                    />
                    {textColor && (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setTextColor("")}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          {type === "custom-image" && (
            <>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Caption (optional)</Label>
                <Input
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Image caption..."
                />
              </div>
            </>
          )}
          {type === "custom-cta" && (
            <>
              {/* Button text */}
              <div className="space-y-1.5">
                <Label>Button Label</Label>
                <Input value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} placeholder="Get Started" />
              </div>
              {/* Link */}
              <div className="space-y-1.5">
                <Label>Button Link URL</Label>
                <Input value={ctaButtonUrl} onChange={e => setCtaButtonUrl(e.target.value)} placeholder="https://..." />
              </div>
              {/* Open in */}
              <div className="space-y-1.5">
                <Label>Open Link In</Label>
                <div className="flex gap-2">
                  {(["_self", "_blank"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCtaButtonTarget(t)}
                      className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                        ctaButtonTarget === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {t === "_self" ? "Same Window" : "New Window"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Text alignment */}
              <div className="space-y-1.5">
                <Label>Text Alignment</Label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map(a => {
                    const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAlignment(a)}
                        className={`flex items-center justify-center w-9 h-9 rounded border transition-colors ${
                          alignment === a
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                        }`}
                        title={a.charAt(0).toUpperCase() + a.slice(1)}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Text size */}
              <div className="space-y-1.5">
                <Label>Button Text Size</Label>
                <div className="flex gap-1">
                  {([["0.875rem","S"],["1rem","M"],["1.125rem","L"],["1.25rem","XL"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCtaFontSize(val)}
                      className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
                        ctaFontSize === val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Corner style */}
              <div className="space-y-1.5">
                <Label>Button Corners</Label>
                <div className="flex gap-2">
                  {(["rounded", "square"] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCtaButtonRadius(r)}
                      className={`flex-1 py-1.5 text-sm border transition-colors ${
                        r === "rounded" ? "rounded-full" : "rounded-none"
                      } ${
                        ctaButtonRadius === r
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {r === "rounded" ? "Rounded" : "Square"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Colors */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</p>
                {[
                  { label: "Section Background", val: bgColor, set: setBgColor, placeholder: "#ffffff" },
                  { label: "Button Color",        val: ctaButtonColor, set: setCtaButtonColor, placeholder: "#3b82f6" },
                  { label: "Text Color",          val: textColor, set: setTextColor, placeholder: "#111827" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="w-10 h-9 rounded border cursor-pointer p-0.5"
                        value={val || placeholder}
                        onChange={e => set(e.target.value)}
                      />
                      <Input
                        className="w-32 font-mono text-sm"
                        placeholder={placeholder}
                        value={val}
                        onChange={e => set(e.target.value)}
                      />
                      {val && (
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => set("")}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {type === "custom-claim" && (
            <>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  rows={3}
                  placeholder="Tell visitors why they should claim their listing..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Submit Button Label</Label>
                <Input value={claimButtonText} onChange={e => setClaimButtonText(e.target.value)} placeholder="Submit" />
              </div>
              <div className="space-y-1.5">
                <Label>Thank You Message</Label>
                <Textarea
                  value={claimThankYou}
                  onChange={(e) => setClaimThankYou(e.target.value)}
                  rows={2}
                  placeholder="Thank you! We'll be in touch soon."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Text Alignment</Label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => {
                    const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                    return (
                      <button key={a} type="button" onClick={() => setAlignment(a)}
                        className={`flex items-center justify-center w-9 h-9 rounded border transition-colors ${alignment === a ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                        title={a.charAt(0).toUpperCase() + a.slice(1)}>
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colors</p>
                {[
                  { label: "Section Background", val: bgColor, set: setBgColor, placeholder: "#ffffff" },
                  { label: "Button Color", val: claimButtonColor, set: setClaimButtonColor, placeholder: "#3b82f6" },
                  { label: "Button Text Color", val: claimButtonTextColor, set: setClaimButtonTextColor, placeholder: "#ffffff" },
                  { label: "Text Color", val: textColor, set: setTextColor, placeholder: "#111827" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label} className="space-y-1.5">
                    <Label>{label}</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-10 h-9 rounded border cursor-pointer p-0.5"
                        value={val || placeholder} onChange={e => set(e.target.value)} />
                      <Input className="w-32 font-mono text-sm" placeholder={placeholder}
                        value={val} onChange={e => set(e.target.value)} />
                      {val && (
                        <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => set("")}>Reset</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {type === "hero" && (
            <p className="text-sm text-muted-foreground">
              Hero headline and description are configured in{" "}
              <strong>Admin → Settings → Homepage</strong>.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectionStyle(props: SectionProps | undefined): React.CSSProperties {
  if (!props) return {};
  const style: React.CSSProperties = {};
  if (props.fontFamily) style.fontFamily = getFontFamily(props.fontFamily);
  if (props.backgroundColor) style.backgroundColor = props.backgroundColor;
  return style;
}

function alignClass(p: SectionProps | undefined): string {
  const a = p?.textAlignment ?? "left";
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [, setLocation] = useLocation();
  const [heroSearch, setHeroSearch] = useState("");
  const { data: settings } = useGetPublicSettings();
  const { data: stats } = useGetPublicStats();
  const { data: featured } = useGetFeaturedEntries();
  const { data: recent, isLoading: recentLoading } = useGetRecentEntries();

  const { toast } = useToast();
  const qc = useQueryClient();
  const { token } = useAuth();
  const isLoggedIn = Boolean(token);
  const { data: currentUser } = useGetCurrentUser({ query: { enabled: isLoggedIn } });
  const isAdmin = isLoggedIn && (currentUser as any)?.role === "admin";
  const updateSettings = useUpdateSettings();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  // Apply homepage meta tags whenever settings load
  useEffect(() => {
    if (!settings) return;
    const s = settings as any;

    // <title>
    const prevTitle = document.title;
    if (s.homepageMetaTitle) document.title = s.homepageMetaTitle;

    // helper to upsert a <meta> element
    const setMeta = (selector: string, attr: string, value: string | null) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el && value) {
        el = document.createElement("meta");
        el.setAttribute(attr.split("=")[0], attr.split("=")[1] ?? attr);
        document.head.appendChild(el);
      }
      if (el) el.setAttribute("content", value ?? "");
      return el;
    };

    setMeta('meta[name="description"]', "name=description", s.homepageMetaDescription ?? null);
    setMeta('meta[property="og:title"]', "property=og:title", s.homepageMetaTitle ?? null);
    setMeta('meta[property="og:description"]', "property=og:description", s.homepageMetaDescription ?? null);
    setMeta('meta[property="og:image"]', "property=og:image", s.homepageOgImageUrl ?? null);

    return () => {
      document.title = prevTitle;
    };
  }, [settings]);

  const ts = mergeTemplateSettings((settings as any)?.templateSettings);
  const themeColor = (settings as any)?.themeColor || "#2563eb";
  const hpFont = getFontFamily(ts.homepage.font);
  const isDemo = !recentLoading && recent && recent.length === 0;
  const cardFields = ts.browse.cardFields;
  const cardImageFields = ts.browse.cardImageFields;
  const showField = (id: string) => cardFields.includes(id);
  const isImageField = (id: string) => cardImageFields.includes(id);
  const enabledSections = ts.homepage.sections.filter(s => s.enabled);

  // ── Edit mode state ──────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editSections, setEditSections] = useState<SectionConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionConfig | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const enterEditMode = useCallback(() => {
    setEditSections(ts.homepage.sections.map(s => ({ ...s })));
    setEditMode(true);
  }, [ts.homepage.sections]);

  const exitEditMode = () => { setEditMode(false); setActiveId(null); setEditingSection(null); };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditSections(prev => {
      const oldIdx = prev.findIndex(s => s.id === String(active.id));
      const newIdx = prev.findIndex(s => s.id === String(over.id));
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleToggleSection = (id: string) => {
    setEditSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const handleDeleteSection = (id: string) => {
    setEditSections(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSection = (updated: SectionConfig) => {
    setEditSections(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const handleAddSection = (def: BlockDefinition) => {
    const isSingleton = !["custom-text", "custom-image", "custom-cta", "custom-claim"].includes(def.type);
    if (isSingleton && editSections.some(s => (s.type ?? s.id) === def.type)) return;
    const newSection: SectionConfig = {
      id: isSingleton ? def.type : `${def.type}-${Date.now()}`,
      type: def.type,
      label: def.label,
      enabled: true,
      heading: def.defaultHeading ?? "",
      props: { ...def.defaultProps },
    };
    setEditSections(prev => [...prev, newSection]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const stored = (settings as any)?.templateSettings ?? {};
      const merged = mergeTemplateSettings(stored);
      const updated = { ...merged, homepage: { ...merged.homepage, sections: editSections } };
      await updateSettings.mutateAsync({ data: { templateSettings: updated } as any });
      qc.invalidateQueries({ queryKey: getGetPublicSettingsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      toast({ title: "Homepage template saved!", description: "Your homepage layout has been updated." });
      setEditMode(false);
    } catch {
      toast({ title: "Save failed", description: "Could not save the template.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ── Entry card renderer (respects cardFields order from template settings) ────
  const renderCardField = (entry: any, fid: string) => {
    // Image display mode — render value as <img> instead of text
    if (isImageField(fid)) {
      const val = (() => {
        if (fid.startsWith("custom:")) {
          const k = fid.slice(7);
          const cf = entry?.customFields;
          return cf && typeof cf === "object" ? cf[k] : null;
        }
        return (entry as any)[fid] ?? null;
      })();
      if (!val) return null;
      return (
        <div key={fid} className="pt-1">
          <img
            src={String(val)}
            alt=""
            className="h-12 w-12 rounded-full object-cover border border-gray-100 dark:border-gray-700"
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      );
    }
    switch (fid) {
      case "location":
        return entry.location ? (
          <div key="location" className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{entry.location}</span>
          </div>
        ) : null;
      case "venue":
        return entry.venue ? (
          <div key="venue" className="flex items-center text-sm text-muted-foreground">
            <Building2 className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{entry.venue}</span>
          </div>
        ) : null;
      case "startDate":
        return entry.startDate ? (
          <div key="startDate" className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4 flex-shrink-0" />
            <span>
              {String(entry.startDate)}
              {showField("endDate") && entry.endDate && entry.endDate !== entry.startDate
                ? ` – ${String(entry.endDate)}` : ""}
            </span>
          </div>
        ) : null;
      case "endDate":
        return (!showField("startDate") && entry.endDate) ? (
          <div key="endDate" className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4 flex-shrink-0" />
            <span>{String(entry.endDate)}</span>
          </div>
        ) : null;
      case "eventType":
        return entry.eventType ? (
          <div key="eventType" className="flex items-center text-sm text-muted-foreground">
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">{entry.eventType}</span>
          </div>
        ) : null;
      case "website":
        return entry.website ? (
          <div key="website" className="flex items-center text-sm text-muted-foreground">
            <Globe className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1 text-primary">{String(entry.website).replace(/^https?:\/\//, "")}</span>
          </div>
        ) : null;
      case "tags":
        return entry.tags ? (
          <div key="tags" className="flex items-center gap-1 flex-wrap pt-1">
            <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            {String(entry.tags).split(",").slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-muted-foreground">
                {tag.trim()}
              </span>
            ))}
          </div>
        ) : null;
      case "contactEmail":
        return entry.contactEmail ? (
          <div key="contactEmail" className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{entry.contactEmail}</span>
          </div>
        ) : null;
      case "contactPhone":
        return entry.contactPhone ? (
          <div key="contactPhone" className="flex items-center text-sm text-muted-foreground">
            <Phone className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{entry.contactPhone}</span>
          </div>
        ) : null;
      default: {
        if (fid.startsWith("custom:")) {
          const k = fid.slice(7);
          const cf = entry?.customFields;
          const val = cf && typeof cf === "object" ? cf[k] : null;
          if (!val) return null;
          return (
            <div key={fid} className="flex items-center text-sm text-muted-foreground">
              <Sparkles className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{String(val)}</span>
            </div>
          );
        }
        return null;
      }
    }
  };

  const renderEntryCard = (entry: any, demo = false) => (
    <Card key={entry.id} className="h-full flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          {showField("category") && entry.category && (
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
              {entry.category}
            </Badge>
          )}
          {demo && <Badge variant="outline">Demo</Badge>}
        </div>
        <CardTitle className="line-clamp-2 text-xl">{entry.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {entry.summary && (
          <p className="text-muted-foreground line-clamp-3 text-sm">{entry.summary}</p>
        )}
        {cardFields.filter(id => id !== "category").map(fid => renderCardField(entry, fid))}
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <Link href={`/entry/${(entry as any).slug || entry.id}`} className="w-full">
          <Button variant="ghost" className="w-full group">
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );

  const demoEntries = [
    { id: "demo1", title: "Tech Conference 2024", category: "Events", summary: "Annual gathering of tech enthusiasts and industry leaders.", location: "San Francisco, CA" },
    { id: "demo2", title: "Acme Innovations", category: "Companies", summary: "Leading provider of next-generation cloud infrastructure.", location: "New York, NY" },
    { id: "demo3", title: "Web Developer Toolkit", category: "Resources", summary: "Comprehensive collection of tools for modern web development.", location: "Online" },
  ];

  // ── Section renderer (shared between normal and edit mode) ───────────────────
  function renderSection(section: SectionConfig) {
    const p = section.props ?? {};
    const type = section.type ?? section.id;

    if (type === "hero") {
      const heroImageUrl = ts.homepage.heroImageUrl || p.backgroundImage;
      const hasBg = !!heroImageUrl;
      const paddingClass = p.padding === "sm" ? "py-12 lg:py-16" : p.padding === "lg" ? "py-28 lg:py-40" : "py-20 lg:py-32";
      const bgStyle: React.CSSProperties = hasBg
        ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
        : { backgroundColor: ts.homepage.heroBgColor || p.backgroundColor || themeColor };

      return (
        <section
          key={section.id}
          className={`${paddingClass} border-b relative overflow-hidden`}
          style={bgStyle}
        >
          {hasBg && (
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(p.overlayOpacity ?? 50) / 100})` }} />
          )}
          <div
            className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${alignClass(p)}`}
            style={p.fontFamily ? { fontFamily: getFontFamily(p.fontFamily) } : {}}
          >
            <h1
              className="font-extrabold tracking-tight mb-6"
              style={{ color: (settings as any)?.heroHeadlineColor || p.headingColor || (hasBg ? "#ffffff" : undefined), fontSize: p.headingFontSize || "clamp(2rem, 5vw, 3.75rem)" }}
            >
              {settings?.homepageHeadline || section.heading || "Discover the Best Resources"}
            </h1>
            <p
              className="max-w-3xl mx-auto mb-10"
              style={{ color: (settings as any)?.heroSubtitleColor || p.textColor || (hasBg ? "#e2e8f0" : undefined), fontSize: p.bodyFontSize || "1.125rem" }}
            >
              {settings?.homepageDescription || "A curated directory of tools, companies, and events."}
            </p>
            <form
              onSubmit={handleHeroSearch}
              className="flex items-center w-full max-w-2xl mx-auto mb-6 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-12 pr-4 py-4 text-gray-900 bg-white border-0 focus:outline-none focus:ring-0 text-base"
                  placeholder={(settings as any)?.heroSearchPlaceholder || "Search directory..."}
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-7 py-4 font-semibold text-base transition-opacity hover:opacity-90 whitespace-nowrap flex-shrink-0"
                style={{
                  backgroundColor: (settings as any)?.heroSearchButtonColor || p.buttonColor || themeColor,
                  color: (settings as any)?.heroSearchButtonTextColor || "#ffffff",
                }}
              >
                {(settings as any)?.heroSearchButtonText || "Search"}
              </button>
            </form>
            {p.buttonText && (
              <a
                href={p.buttonUrl || "/browse"}
                className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: p.buttonColor || themeColor, fontSize: p.bodyFontSize || "1rem" }}
              >
                {p.buttonText}
              </a>
            )}
          </div>
        </section>
      );
    }

    if (type === "categories") {
      if (!stats || stats.categoryBreakdown.length === 0) return null;
      const max = p.maxItems ?? 8;
      return (
        <section key={section.id} style={sectionStyle(p)}>
          <div className="flex justify-between items-end mb-8">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || undefined, fontFamily: p.fontFamily ? getFontFamily(p.fontFamily) : undefined }}
            >
              {section.heading || "Browse by Category"}
            </h2>
            <Link href="/browse" className="text-primary hover:underline font-medium flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.categoryBreakdown.slice(0, max).map((cat) => {
              const imgUrl = (cat as any).imageUrl as string | null | undefined;
              return (
                <Link key={cat.category} href={`/browse/${encodeURIComponent(cat.category)}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group">
                    {imgUrl ? (
                      <div className="relative h-28 overflow-hidden">
                        <img src={imgUrl} alt={cat.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                          <p className="font-semibold text-white text-sm leading-tight">{cat.category}</p>
                          <p className="text-white/80 text-xs mt-0.5">{cat.count} entries</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <CardTitle className="text-lg">{cat.category}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">{cat.count} entries</p>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      );
    }

    if (type === "featured") {
      if (!featured || featured.length === 0) return null;
      const max = p.maxItems ?? 3;
      return (
        <section key={section.id} style={sectionStyle(p)}>
          <h2
            className="text-2xl font-bold tracking-tight mb-8"
            style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || undefined, fontFamily: p.fontFamily ? getFontFamily(p.fontFamily) : undefined }}
          >
            {section.heading || "Featured"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.slice(0, max).map(entry => renderEntryCard(entry))}
          </div>
        </section>
      );
    }

    if (type === "recent") {
      const max = p.maxItems ?? 6;
      return (
        <section key={section.id} style={sectionStyle(p)}>
          <div className="flex justify-between items-end mb-8">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || undefined, fontFamily: p.fontFamily ? getFontFamily(p.fontFamily) : undefined }}
            >
              {section.heading || "Recently Added"}
            </h2>
            <Link href="/browse" className="text-primary hover:underline font-medium flex items-center">
              Browse all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          {isDemo ? (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <strong>No entries found.</strong> Your directory is empty. Here are demo entries to show how it looks.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {demoEntries.map(e => renderEntryCard(e, true))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent?.slice(0, max).map(e => renderEntryCard(e))}
            </div>
          )}
        </section>
      );
    }

    if (type === "custom-text") {
      return (
        <section
          key={section.id}
          className={`rounded-xl px-8 py-10 ${alignClass(p)}`}
          style={{ backgroundColor: p.backgroundColor || undefined, fontFamily: p.fontFamily ? getFontFamily(p.fontFamily) : undefined }}
        >
          {section.heading && (
            <h2 className="font-bold mb-4" style={{ color: p.headingColor || undefined, fontSize: p.headingFontSize || "1.5rem" }}>
              {section.heading}
            </h2>
          )}
          {p.richBodyText ? (
            <div
              className="prose prose-gray dark:prose-invert max-w-none"
              style={{ color: p.textColor || undefined, fontSize: p.bodyFontSize || undefined }}
              dangerouslySetInnerHTML={{ __html: p.richBodyText }}
            />
          ) : p.bodyText ? (
            <p style={{ color: p.textColor || undefined, fontSize: p.bodyFontSize || undefined }}>{p.bodyText}</p>
          ) : null}
          {p.buttonText && (
            <a
              href={p.buttonUrl || "#"}
              className="inline-block mt-6 px-6 py-2.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: p.buttonColor || themeColor }}
            >
              {p.buttonText}
            </a>
          )}
        </section>
      );
    }

    if (type === "custom-image") {
      if (!p.imageUrl) {
        return (
          <section key={section.id} className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No image set — click the pencil icon to add an image URL</p>
            </div>
          </section>
        );
      }
      return (
        <section key={section.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: p.backgroundColor || undefined }}>
          <img src={p.imageUrl} alt={p.imageCaption || section.heading || ""} className="w-full object-cover" />
          {p.imageCaption && (
            <p className="text-sm text-muted-foreground text-center px-4 py-2">{p.imageCaption}</p>
          )}
        </section>
      );
    }

    if (type === "custom-cta") {
      const radius = p.buttonRadius === "square" ? "rounded-none" : "rounded-full";
      return (
        <section
          key={section.id}
          className={`px-8 py-14 ${alignClass(p)}`}
          style={{ backgroundColor: p.backgroundColor || undefined }}
        >
          {section.heading && (
            <h2 className="font-bold mb-3" style={{ color: p.textColor || undefined, fontSize: "1.75rem" }}>
              {section.heading}
            </h2>
          )}
          {p.bodyText && (
            <p className="mb-6 max-w-2xl mx-auto" style={{ color: p.textColor || undefined, fontSize: p.bodyFontSize || "1rem" }}>
              {p.bodyText}
            </p>
          )}
          {p.buttonText ? (
            <a
              href={p.buttonUrl || "#"}
              target={p.buttonTarget || "_self"}
              rel={p.buttonTarget === "_blank" ? "noopener noreferrer" : undefined}
              className={`inline-block px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90 ${radius}`}
              style={{ backgroundColor: p.buttonColor || themeColor, fontSize: p.bodyFontSize || "1rem" }}
            >
              {p.buttonText}
            </a>
          ) : (
            editMode && (
              <div className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-dashed border-gray-300 text-muted-foreground text-sm">
                <MousePointerClick className="h-4 w-4" />
                Click the pencil icon to configure your CTA button
              </div>
            )
          )}
        </section>
      );
    }

    if (type === "custom-claim") {
      const p = section.props ?? {};
      return (
        <section
          key={section.id}
          className={`px-8 py-14 ${alignClass(p)}`}
          style={{ backgroundColor: p.backgroundColor || undefined }}
        >
          {section.heading && (
            <h2 className="font-bold mb-3" style={{ color: p.textColor || undefined, fontSize: "1.75rem" }}>
              {section.heading}
            </h2>
          )}
          {p.bodyText && (
            <p className="mb-8 max-w-xl mx-auto" style={{ color: p.textColor || undefined }}>
              {p.bodyText}
            </p>
          )}
          <ClaimFormBlock section={section} />
        </section>
      );
    }

    return null;
  }

  // ── Edit mode layout ─────────────────────────────────────────────────────────
  if (editMode) {
    const singletonTypes = ["hero", "categories", "featured", "recent", "custom-claim"];

    return (
      <div className="flex h-full min-h-screen" style={{ fontFamily: hpFont }}>
        <FontLoader fontKey={ts.homepage.font} />

        {/* ── Left panel: Add Section ── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
          <div className="px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Add Section</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Click to add to your page</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {HOMEPAGE_BLOCK_DEFS.map(def => {
              const isSingleton = singletonTypes.includes(def.type);
              const isAdded = isSingleton && editSections.some(s => (s.type ?? s.id) === def.type);
              return (
                <div
                  key={def.type}
                  className={`rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                    isAdded
                      ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-md flex items-center justify-center flex-shrink-0 ${isAdded ? "bg-gray-100 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/30"}`}>
                    <BlockIcon type={def.type} className={`h-4 w-4 ${isAdded ? "text-gray-400" : "text-blue-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-sm font-medium leading-tight ${isAdded ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
                        {def.label}
                      </span>
                      {isAdded && (
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          Added
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{def.description}</p>
                  </div>
                  {!isAdded && (
                    <button
                      onClick={() => handleAddSection(def)}
                      title={`Add ${def.label}`}
                      className="flex-shrink-0 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-500 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Right area: control bar + sections ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Control bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-3 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                Template edit mode — drag sections to rearrange · changes apply globally
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exitEditMode} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Save Template
              </Button>
            </div>
          </div>

          {/* Sortable sections */}
          <div className="flex-1 overflow-y-auto p-6">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={editSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4 max-w-4xl mx-auto">
                  {editSections.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center text-muted-foreground">
                      <LayoutTemplate className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No sections yet — add one from the panel on the left.</p>
                    </div>
                  )}
                  {editSections.map(s => (
                    <SortableHomeSectionWrapper
                      key={s.id}
                      section={s}
                      onDelete={() => handleDeleteSection(s.id)}
                      onEdit={() => setEditingSection(s)}
                      onToggle={() => handleToggleSection(s.id)}
                    >
                      {renderSection(s)}
                    </SortableHomeSectionWrapper>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="rounded-lg bg-blue-500 text-white px-3 py-2 text-sm font-semibold shadow-xl pointer-events-none">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      {editSections.find(s => s.id === activeId)?.label ?? activeId}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* ── Inline section edit dialog ── */}
        {editingSection && (
          <EditSectionDialog
            section={editingSection}
            onSave={handleUpdateSection}
            onClose={() => setEditingSection(null)}
          />
        )}
      </div>
    );
  }

  // ── Normal homepage ───────────────────────────────────────────────────────────
  const heroSection = enabledSections.find(s => (s.type ?? s.id) === "hero");
  const nonHeroSections = enabledSections.filter(s => (s.type ?? s.id) !== "hero");

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: hpFont }}>
      <FontLoader fontKey={ts.homepage.font} />

      {/* Admin edit bar */}
      {isAdmin && (
        <div className="bg-gray-900 dark:bg-gray-950 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Admin — editing this will update the homepage for all visitors
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white"
              onClick={enterEditMode}
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Edit Layout
            </Button>
          </div>
        </div>
      )}

      {heroSection && renderSection(heroSection)}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-20">
        {nonHeroSections.map(s => renderSection(s))}
      </div>
    </div>
  );
}
