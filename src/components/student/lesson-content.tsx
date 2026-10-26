"use client";
import { useState } from "react";
import { useI18n, localizeField } from "@/i18n/use-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Video, Image as ImageIcon, Link as LinkIcon, StickyNote, File } from "lucide-react";
import { toast } from "sonner";

export function localizeType(type: string, lang: string) {
  const map: Record<string, { ar: string; fr: string; en: string }> = {
    text: { ar: "نص", fr: "Texte", en: "Text" },
    notes: { ar: "ملاحظات", fr: "Notes", en: "Notes" },
    pdf: { ar: "ملف PDF", fr: "PDF", en: "PDF" },
    uploaded_video: { ar: "فيديو", fr: "Vidéo", en: "Video" },
    youtube: { ar: "يوتيوب", fr: "YouTube", en: "YouTube" },
    image: { ar: "صورة", fr: "Image", en: "Image" },
    gallery: { ar: "معرض", fr: "Galerie", en: "Gallery" },
    file: { ar: "ملف", fr: "Fichier", en: "File" },
    link: { ar: "رابط", fr: "Lien", en: "Link" },
  };
  return (map[type]?.[lang as "ar" | "fr" | "en"]) || type;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function LessonContent({ block }: { block: any }) {
  const { t, lang } = useI18n();
  const title = block.title;
  const Icon = typeIcon(block.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <div className="rounded-md bg-muted p-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          {title || localizeType(block.type, lang)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BlockBody block={block} />
      </CardContent>
    </Card>
  );
}

function typeIcon(type: string) {
  switch (type) {
    case "pdf": return FileText;
    case "uploaded_video": return Video;
    case "youtube": return Video;
    case "image": return ImageIcon;
    case "gallery": return ImageIcon;
    case "file": return File;
    case "link": return LinkIcon;
    case "notes": return StickyNote;
    default: return FileText;
  }
}

function BlockBody({ block }: { block: any }) {
  const { t, lang } = useI18n();
  switch (block.type) {
    case "text":
    case "notes":
      return <p className="whitespace-pre-line text-sm leading-relaxed">{block.content}</p>;

    case "pdf": {
      if (!block.mediaPath) return <p className="text-sm text-muted-foreground">No PDF attached</p>;
      // Show only the PDF file name + a download button — no inline iframe preview.
      const fileName = decodeURIComponent(block.mediaPath.split("/").pop() || block.mediaPath);
      return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{block.title || fileName}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {fileName} · PDF
              </p>
            </div>
          </div>
          {block.downloadable !== false ? (
            <Button asChild size="sm" className="gap-2">
              <a href={block.mediaPath} download={fileName}>
                <Download className="h-4 w-4" />
                {t("lesson.download")}
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">{t("lesson.download")} ✕</span>
          )}
        </div>
      );
    }

    case "uploaded_video": {
      if (!block.mediaPath) return <p className="text-sm text-muted-foreground">No video attached</p>;
      return (
        <video
          src={block.mediaPath}
          controls
          className="w-full rounded-lg bg-black"
          style={{ maxHeight: "70vh" }}
        />
      );
    }

    case "youtube": {
      const id = extractYouTubeId(block.content || "");
      if (!id) return <p className="text-sm text-destructive">Invalid YouTube URL</p>;
      return (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${id}`}
            className="w-full h-full rounded-lg"
            title={block.title || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }

    case "image": {
      if (!block.mediaPath) return null;
      return <img src={block.mediaPath} alt={block.title || ""} className="w-full max-h-[70vh] object-contain rounded-lg bg-muted" />;
    }

    case "gallery": {
      const paths: string[] = block.mediaPaths ? JSON.parse(block.mediaPaths) : [];
      if (!paths.length) return <p className="text-sm text-muted-foreground">Empty gallery</p>;
      return <Gallery paths={paths} />;
    }

    case "file": {
      if (!block.mediaPath) return null;
      return (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">{block.title || "File"}</span>
          </div>
          {block.downloadable !== false && (
            <Button asChild variant="outline" size="sm">
              <a href={block.mediaPath} download><Download className="me-2 h-4 w-4" />{t("lesson.download")}</a>
            </Button>
          )}
        </div>
      );
    }

    case "link": {
      return (
        <a href={block.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
          <ExternalLink className="h-4 w-4" />
          {block.content}
        </a>
      );
    }

    default:
      return <p className="text-sm text-muted-foreground">Unknown block type</p>;
  }
}

function Gallery({ paths }: { paths: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="space-y-3">
      <div className="rounded-lg overflow-hidden bg-muted">
        <img src={paths[active]} alt="" className="w-full max-h-[60vh] object-contain" />
      </div>
      {paths.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {paths.map((p, i) => (
            <button key={i} onClick={() => setActive(i)} className={`aspect-square rounded overflow-hidden border-2 ${active === i ? "border-primary" : "border-transparent"}`}>
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
