import { Link } from "react-router-dom";
import { mediaUrl } from "../lib/media.js";
import { playingAge } from "../lib/options.js";
import { Badge, Verified } from "./ui.jsx";
import { Icon } from "./icons.jsx";
import { opt, tr } from "../lib/i18n.jsx";

export const CARD_SELECT =
  "id, handle, display_name, headline, city, avatar_path, verified, is_minor, created_at, on_talent(playing_age_min, playing_age_max, categories, available, gender, height_cm)";

export function TalentCard({ p }) {
  const t = Array.isArray(p.on_talent) ? p.on_talent[0] : p.on_talent;
  const age = playingAge(t);
  const img = mediaUrl(p.avatar_path);
  return (
    <Link
      to={`/@${p.handle}`}
      className="group block overflow-hidden rounded-lg border border-border-subtle bg-surface-card transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-mint-100">
        {img ? (
          <img src={img} alt={p.display_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-display-l font-bold text-mint-300">
            {p.display_name?.[0]}
          </div>
        )}
        <div className="absolute start-2 top-2 flex gap-1">
          {t?.available && <Badge tone="accent">{tr("Available")}</Badge>}
          {p.is_minor && <Badge tone="inverse">{tr("Under 18")}</Badge>}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <span className="truncate font-body text-small font-semibold text-text-primary"><bdi>{p.display_name}</bdi></span>
          {p.verified && <Verified size={14} />}
        </div>
        <div className="truncate font-body text-micro text-text-secondary">{(p.headline && <bdi>{p.headline}</bdi>) || (t?.categories || []).map(opt).join(" · ") || <bdi dir="ltr">@{p.handle}</bdi>}</div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-text-secondary">
          {age && <span>{tr("Plays {age}", { age })}</span>}
          {p.city && (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={12} />
              {opt(p.city)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TalentGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((p) => (
        <TalentCard key={p.id} p={p} />
      ))}
    </div>
  );
}
