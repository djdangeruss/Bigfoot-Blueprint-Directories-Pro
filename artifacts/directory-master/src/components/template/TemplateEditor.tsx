import { ChevronUp, ChevronDown, Home, Search, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  type TemplateSettings,
  type SectionConfig,
  FONTS,
  BROWSE_CARD_FIELDS,
  ENTRY_SIDEBAR_FIELDS,
  mergeTemplateSettings,
} from "@/lib/templateTypes";

interface TemplateEditorProps {
  value: TemplateSettings;
  onChange: (value: TemplateSettings) => void;
}

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">Font Family</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FONTS.map(font => (
          <button
            key={font.key}
            type="button"
            onClick={() => onChange(font.key)}
            className={`px-3 py-3 rounded-lg border text-sm text-center transition-all ${
              value === font.key
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <span className="block font-semibold text-lg mb-0.5" style={{ fontFamily: font.family }}>
              Aa
            </span>
            <span className="text-xs text-muted-foreground">{font.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionList({
  sections,
  onChange,
}: {
  sections: SectionConfig[];
  onChange: (sections: SectionConfig[]) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const next = [...sections];
    const tmp = next[index];
    next[index] = next[index + dir];
    next[index + dir] = tmp;
    onChange(next);
  };

  const update = (index: number, patch: Partial<SectionConfig>) => {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-1 block">Page Sections</Label>
      <p className="text-xs text-muted-foreground mb-3">
        Toggle sections on/off, reorder them, and customize each section's heading text.
      </p>
      <div className="space-y-2">
        {sections.map((section, i) => (
          <div
            key={section.id}
            className={`border rounded-lg p-3 transition-colors ${
              section.enabled
                ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                : "border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <Switch
                checked={section.enabled}
                onCheckedChange={checked => update(i, { enabled: checked })}
              />
              <span className={`font-medium text-sm flex-1 ${!section.enabled ? "opacity-50" : ""}`}>
                {section.label}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                section.enabled
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}>
                {section.enabled ? "Visible" : "Hidden"}
              </span>
            </div>
            {section.enabled && section.heading !== undefined && (
              <div className="mt-2 ml-14">
                <Input
                  placeholder={`Heading text (e.g. "${section.label}")`}
                  value={section.heading}
                  onChange={e => update(i, { heading: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldChecklist({
  title,
  description,
  allFields,
  selected,
  onChange,
}: {
  title: string;
  description?: string;
  allFields: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(f => f !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-1 block">{title}</Label>
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      <div className="grid grid-cols-2 gap-2">
        {allFields.map(field => (
          <label
            key={field.id}
            className="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 select-none"
          >
            <Checkbox
              checked={selected.includes(field.id)}
              onCheckedChange={() => toggle(field.id)}
            />
            <span className="text-sm">{field.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function OrderableFieldList({
  title,
  description,
  allFields,
  selected,
  onChange,
}: {
  title: string;
  description?: string;
  allFields: Array<{ id: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const allIds = allFields.map(f => f.id);
  const validSelected = selected.filter(id => allIds.includes(id));
  const unselected = allIds.filter(id => !validSelected.includes(id));
  const fullList = [...validSelected, ...unselected];

  const getLabel = (id: string) => allFields.find(f => f.id === id)?.label ?? id;
  const isSelected = (id: string) => validSelected.includes(id);
  const selectedIndex = (id: string) => validSelected.indexOf(id);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...validSelected];
    const tmp = next[index];
    next[index] = next[index + dir];
    next[index + dir] = tmp;
    onChange(next);
  };

  const toggle = (id: string) => {
    if (isSelected(id)) {
      onChange(validSelected.filter(f => f !== id));
    } else {
      onChange([...validSelected, id]);
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-1 block">{title}</Label>
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      <div className="space-y-2">
        {fullList.map(id => {
          const sel = isSelected(id);
          const idx = selectedIndex(id);
          return (
            <div
              key={id}
              className={`flex items-center gap-2 p-2.5 rounded border transition-colors ${
                sel
                  ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  : "border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
              }`}
            >
              {sel ? (
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === validSelected.length - 1}
                    className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="w-6 flex-shrink-0" />
              )}
              <Switch checked={sel} onCheckedChange={() => toggle(id)} />
              <span className={`text-sm font-medium flex-1 ${!sel ? "opacity-50" : ""}`}>
                {getLabel(id)}
              </span>
              {sel && (
                <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TemplateEditor({ value, onChange }: TemplateEditorProps) {
  const ts = mergeTemplateSettings(value);

  const updateHomepage = (patch: Partial<typeof ts.homepage>) =>
    onChange({ ...ts, homepage: { ...ts.homepage, ...patch } });

  const updateBrowse = (patch: Partial<typeof ts.browse>) =>
    onChange({ ...ts, browse: { ...ts.browse, ...patch } });

  const updateEntry = (patch: Partial<typeof ts.entry>) =>
    onChange({ ...ts, entry: { ...ts.entry, ...patch } });

  return (
    <Tabs defaultValue="homepage">
      <TabsList className="mb-6 w-full sm:w-auto">
        <TabsTrigger value="homepage" className="gap-2 flex-1 sm:flex-none">
          <Home className="h-4 w-4" /> Homepage
        </TabsTrigger>
        <TabsTrigger value="browse" className="gap-2 flex-1 sm:flex-none">
          <Search className="h-4 w-4" /> Browse
        </TabsTrigger>
        <TabsTrigger value="entry" className="gap-2 flex-1 sm:flex-none">
          <FileText className="h-4 w-4" /> Entry Detail
        </TabsTrigger>
      </TabsList>

      {/* HOMEPAGE TAB */}
      <TabsContent value="homepage" className="space-y-6 mt-0">
        <FontPicker value={ts.homepage.font} onChange={font => updateHomepage({ font })} />
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1 block">Hero Background Image URL</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Full-width banner behind the hero headline. Leave blank to use a solid color.
            </p>
            <Input
              placeholder="https://example.com/hero-banner.jpg"
              value={ts.homepage.heroImageUrl}
              onChange={e => updateHomepage({ heroImageUrl: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1 block">Hero Background Color</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Solid color shown when no image is set. Leave blank to use the Primary Theme Color.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-10 h-10 p-1 rounded border border-input cursor-pointer bg-transparent"
                value={ts.homepage.heroBgColor || "#2563eb"}
                onChange={e => updateHomepage({ heroBgColor: e.target.value })}
              />
              <Input
                className="w-36 font-mono"
                placeholder="#2563eb"
                value={ts.homepage.heroBgColor}
                onChange={e => updateHomepage({ heroBgColor: e.target.value })}
              />
              {ts.homepage.heroBgColor && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                  onClick={() => updateHomepage({ heroBgColor: "" })}
                >
                  Reset to theme
                </button>
              )}
            </div>
          </div>
        </div>
        <SectionList
          sections={ts.homepage.sections}
          onChange={sections => updateHomepage({ sections })}
        />
      </TabsContent>

      {/* BROWSE TAB */}
      <TabsContent value="browse" className="space-y-6 mt-0">
        <FontPicker value={ts.browse.font} onChange={font => updateBrowse({ font })} />
        <div>
          <Label className="text-sm font-medium mb-1 block">Browse Page Banner Image URL</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Banner displayed at the top of the Browse page. Leave blank to hide.
          </p>
          <Input
            placeholder="https://example.com/browse-banner.jpg"
            value={ts.browse.heroImageUrl}
            onChange={e => updateBrowse({ heroImageUrl: e.target.value })}
          />
        </div>
        <SectionList
          sections={ts.browse.sections}
          onChange={sections => updateBrowse({ sections })}
        />
        <FieldChecklist
          title="Entry Card Fields"
          description="Choose which fields are shown on each entry card in the browse grid."
          allFields={BROWSE_CARD_FIELDS}
          selected={ts.browse.cardFields}
          onChange={cardFields => updateBrowse({ cardFields })}
        />
      </TabsContent>

      {/* ENTRY DETAIL TAB */}
      <TabsContent value="entry" className="space-y-6 mt-0">
        <FontPicker value={ts.entry.font} onChange={font => updateEntry({ font })} />
        <SectionList
          sections={ts.entry.sections}
          onChange={sections => updateEntry({ sections })}
        />
        <OrderableFieldList
          title="Sidebar Fields"
          description="Choose which fields appear in the details sidebar and set their order."
          allFields={ENTRY_SIDEBAR_FIELDS}
          selected={ts.entry.sidebarFields}
          onChange={sidebarFields => updateEntry({ sidebarFields })}
        />
      </TabsContent>
    </Tabs>
  );
}
