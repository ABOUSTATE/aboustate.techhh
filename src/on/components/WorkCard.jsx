import { useState } from "react";
import { parseVideoLink } from "../lib/embeds.js";
import { opt, tr } from "../lib/i18n.jsx";
import { Badge, Card } from "./ui.jsx";
import { Icon } from "./icons.jsx";

// One piece of past work. Shows a poster until played, so a profile with a
// dozen ads doesn't load a dozen video players at once.
export function WorkCard({ item }) {
  const [playing, setPlaying] = useState(false);
  const video = parseVideoLink(item.url);
  const vertical = item.vertical ?? video?.vertical;
  // Every poster is the same wide shape so the grid stays even; the player
  // only goes tall once it's playing a vertical video (Instagram's embed
  // also needs room for its own header and caption).
  const frame = !playing
    ? "aspect-video"
    : video?.provider === "Instagram"
      ? "h-[620px]"
      : vertical
        ? "mx-auto aspect-[9/16] max-h-[620px]"
        : "aspect-video";

  return (
    <Card className="overflow-hidden">
      <div className={`relative w-full overflow-hidden bg-green-950 ${frame}`}>
        {video && playing ? (
          <iframe
            src={video.embed}
            title={item.title || tr("Past work")}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            disabled={!video}
            aria-label={tr("Play {title}", { title: item.title || "" })}
            className="group absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {video?.thumb ? (
              <img src={video.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity duration-200 group-hover:opacity-100" />
            ) : (
              <>
                <span className="bg-pattern-dots-dark absolute inset-0 opacity-50" />
                <span className="absolute inset-x-0 top-4 px-5 text-start font-display text-h2 font-bold leading-tight text-beige-100">
                  <bdi>{item.brand || item.title}</bdi>
                </span>
              </>
            )}
            <span className="relative flex h-[56px] w-[56px] items-center justify-center rounded-pill bg-accent text-green-950 shadow-lg transition-transform duration-200 group-hover:scale-110">
              <Icon name="play" size={24} fill />
            </span>
            {video && (
              <span className="absolute bottom-2 start-2">
                <Badge tone="inverse">{video.provider}</Badge>
              </span>
            )}
          </button>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-body text-small font-semibold text-text-primary">
            <bdi>{item.title || tr("Untitled")}</bdi>
          </div>
          {(item.brand || item.role) && (
            <div className="truncate font-body text-micro text-text-secondary">
              <bdi>{[item.brand, item.role && tr("as {role}", { role: item.role })].filter(Boolean).join(" · ")}</bdi>
            </div>
          )}
        </div>
        {(item.type || item.year) && <span className="shrink-0 font-mono text-[11px] text-text-secondary">{[opt(item.type), item.year].filter(Boolean).join(" · ")}</span>}
      </div>
    </Card>
  );
}
