"use client";
import { useState, useRef } from "react";
import { useI18n } from "@/i18n/use-i18n";
import { formatSize } from "@/lib/utils-client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, FileText, Video, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";

type Props = {
  accept: string; // "pdf" | "video" | "image" | "gallery" | "file" | "any"
  onUploaded: (path: string) => void;
};

// Map of accept keys → list of MIME-type prefixes the server will accept.
// We mirror this on the client so we can refuse wrong files BEFORE the upload
// (so we never end up with a non-image path in an image field, which would
// show as a broken-image icon).
const ACCEPT_MAP: Record<string, { attr: string; types: string[]; label: string }> = {
  pdf:      { attr: "application/pdf", types: ["application/pdf"], label: "PDF" },
  video:    { attr: "video/mp4,video/webm,video/quicktime", types: ["video/mp4", "video/webm", "video/quicktime"], label: "MP4 / WebM / MOV" },
  image:    { attr: "image/jpeg,image/png,image/webp,image/gif", types: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"], label: "JPG / PNG / WebP / GIF" },
  gallery:  { attr: "image/jpeg,image/png,image/webp,image/gif", types: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"], label: "JPG / PNG / WebP / GIF" },
  // For mixed-file lessons we accept any of the file types the server allows
  file:     { attr: "application/pdf,video/mp4,video/webm,video/quicktime,image/jpeg,image/jpg,image/png,image/webp,image/gif,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document", types: ["application/pdf", "video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/zip", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], label: "PDF / Video / Image / Document" },
  any:      { attr: "*", types: [], label: "Any" },
};

export function UploadDropzone({ accept, onUploaded }: Props) {
  const { t } = useI18n();
  const [progress, setProgress] = useState<number | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const conf = ACCEPT_MAP[accept] || ACCEPT_MAP.any;

  const validate = (file: File): boolean => {
    setError(null);
    if (!conf.types.length) return true; // any
    // 1. Exact MIME match
    if (conf.types.includes(file.type)) return true;
    // 2. Sometimes the browser reports image/jpg instead of image/jpeg — already covered above.
    // 3. As a last resort, if MIME type is empty (rare), check the file extension.
    if (!file.type) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const extToMime: Record<string, string> = {
        pdf: "application/pdf",
        mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
        jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
        webp: "image/webp", gif: "image/gif",
        zip: "application/zip",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
      const inferred = extToMime[ext];
      if (inferred && conf.types.includes(inferred)) return true;
    }
    return false;
  };

  const doUpload = async (file: File) => {
    // Client-side validation FIRST — refuse files that don't match the `accept`
    // type. This prevents non-image files (e.g. Word/Excel documents dropped by
    // accident) from being saved with an image-only field, which would later
    // render as a broken-image icon.
    if (!validate(file)) {
      const msg = `${t("upload.invalidType")} (${conf.label})`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setFilename(file.name);
    setProgress(0);
    // Use XHR for progress events
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", file);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.onload = () => {
      setProgress(null);
      try {
        const r = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && r.ok) {
          toast.success(t("upload.success"));
          onUploaded(r.media.path);
          setFilename("");
        } else {
          const err = r.error || "upload_failed";
          if (err === "too_large") toast.error(t("upload.tooLarge"));
          else if (err === "invalid_type") toast.error(`${t("upload.invalidType")} (${conf.label})`);
          else toast.error(t("upload.failed"));
          setFilename("");
        }
      } catch {
        toast.error(t("upload.failed"));
        setFilename("");
      }
    };
    xhr.onerror = () => { toast.error(t("upload.failed")); setProgress(null); setFilename(""); };
    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${error ? "border-destructive/50 bg-destructive/5" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <input ref={inputRef} type="file" accept={conf.attr} onChange={onFileChange} className="hidden" />
      {progress !== null ? (
        <div className="space-y-2">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p className="text-sm font-medium">{t("upload.progress")}</p>
          <p className="text-xs text-muted-foreground truncate">{filename}</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs">{progress}%</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{t("upload.choose")}</p>
          <p className="text-xs text-muted-foreground">{t("upload.drag")}</p>
          <p className="text-xs text-muted-foreground/80">
            {conf.label}
          </p>
          {error && (
            <p className="text-xs text-destructive font-medium mt-2">{error}</p>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="mt-2">
            <Upload className="h-4 w-4 me-1" /> {t("upload.choose")}
          </Button>
        </div>
      )}
    </div>
  );
}
