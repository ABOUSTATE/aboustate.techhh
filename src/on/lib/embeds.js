// Turns a link to a video hosted elsewhere into an embeddable player, so
// talent can show past work without uploading it (no storage used on ON).

const PROVIDERS = [
  {
    name: "YouTube",
    match: (u) => {
      const host = u.hostname.replace(/^www\.|^m\./, "");
      if (host === "youtu.be") return u.pathname.slice(1);
      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/);
        return m && m[1];
      }
      return null;
    },
    embed: (id) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`,
    thumb: (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    vertical: (u) => u.pathname.startsWith("/shorts/"),
  },
  {
    name: "Google Drive",
    match: (u) => {
      if (u.hostname !== "drive.google.com") return null;
      const m = u.pathname.match(/\/file\/d\/([\w-]{10,})/);
      return (m && m[1]) || u.searchParams.get("id");
    },
    embed: (id) => `https://drive.google.com/file/d/${id}/preview`,
    thumb: (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w960`,
  },
  {
    name: "Vimeo",
    match: (u) => {
      if (!/(^|\.)vimeo\.com$/.test(u.hostname)) return null;
      const m = u.pathname.match(/\/(?:video\/)?(\d{5,})/);
      return m && m[1];
    },
    embed: (id) => `https://player.vimeo.com/video/${id}?autoplay=1`,
  },
  {
    name: "Instagram",
    match: (u) => {
      if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
      const m = u.pathname.match(/\/(?:reel|reels|p|tv)\/([\w-]{5,})/);
      return m && m[1];
    },
    embed: (id) => `https://www.instagram.com/p/${id}/embed/`,
    vertical: () => true,
  },
];

// { provider, id, embed, thumb, vertical } or null for unsupported links.
export function parseVideoLink(raw) {
  if (!raw) return null;
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  for (const p of PROVIDERS) {
    const id = p.match(u);
    if (id) {
      return {
        provider: p.name,
        id,
        embed: p.embed(id),
        thumb: p.thumb ? p.thumb(id) : null,
        vertical: p.vertical ? p.vertical(u) : false,
      };
    }
  }
  return null;
}
