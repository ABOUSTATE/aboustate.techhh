import { useEffect } from "react";
import { parseVideoLink } from "../lib/embeds.js";
import { tr } from "../lib/i18n.jsx";
import { Button } from "./ui.jsx";
import { Icon } from "./icons.jsx";

// Full-screen player for a self-tape link. Links ON can't embed open in a
// new tab instead.
export function TapePlayer({ url, title, onClose }) {
  const video = parseVideoLink(url);
  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-green-950/90 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <button type="button" className="absolute end-4 top-4 text-beige-100" aria-label={tr("Close")} onClick={onClose}>
        <Icon name="close" size={28} />
      </button>
      {title && (
        <div className="font-body text-body font-semibold text-beige-100">
          <bdi>{title}</bdi>
        </div>
      )}
      {video ? (
        <div
          className={`w-full overflow-hidden rounded-md bg-black ${video.provider === "Instagram" ? "h-[80vh] max-w-[420px]" : video.vertical ? "aspect-[9/16] max-h-[80vh] max-w-[420px]" : "aspect-video max-w-[960px]"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <iframe src={video.embed} title={title || tr("Self-tape")} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
        </div>
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          <Button variant="inverse" href={url} target="_blank" rel="noopener noreferrer">
            <Icon name="play" size={16} /> {tr("Open the tape")}
          </Button>
        </div>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono text-micro text-mint-300 underline" onClick={(e) => e.stopPropagation()}>
        {tr("Open the original link")}
      </a>
    </div>
  );
}
