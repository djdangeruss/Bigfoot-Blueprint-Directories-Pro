import { useEffect, useRef } from "react";

interface ScriptInjectorProps {
  headScripts?: string | null;
  bodyScripts?: string | null;
}

function injectHtml(target: HTMLElement, html: string, markerAttr: string) {
  const existing = target.querySelectorAll(`[${markerAttr}]`);
  existing.forEach((el) => el.remove());

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  Array.from(wrapper.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === "script") {
        const script = document.createElement("script");
        script.setAttribute(markerAttr, "1");
        Array.from(el.attributes).forEach((attr) =>
          script.setAttribute(attr.name, attr.value)
        );
        script.textContent = el.textContent;
        target.appendChild(script);
      } else {
        (el as HTMLElement).setAttribute(markerAttr, "1");
        target.appendChild(el.cloneNode(true));
      }
    }
  });
}

export function ScriptInjector({ headScripts, bodyScripts }: ScriptInjectorProps) {
  const prevHead = useRef<string | null | undefined>(undefined);
  const prevBody = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (headScripts !== prevHead.current) {
      prevHead.current = headScripts;
      if (headScripts?.trim()) {
        injectHtml(document.head, headScripts, "data-dm-head");
      } else {
        document.head
          .querySelectorAll("[data-dm-head]")
          .forEach((el) => el.remove());
      }
    }
  }, [headScripts]);

  useEffect(() => {
    if (bodyScripts !== prevBody.current) {
      prevBody.current = bodyScripts;
      if (bodyScripts?.trim()) {
        injectHtml(document.body, bodyScripts, "data-dm-body");
      } else {
        document.body
          .querySelectorAll("[data-dm-body]")
          .forEach((el) => el.remove());
      }
    }
  }, [bodyScripts]);

  return null;
}
