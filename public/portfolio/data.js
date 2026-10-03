/*
  portfolio.aboustate.tech — content file.
  Edit this file only; the page builds itself from it.

  Media fields accept:
    { type: "youtube", id: "dQw4w9WgXcQ" }
    { type: "vimeo",   id: "123456789" }
    { type: "drive",   id: "<Google Drive file id>" }   // file must be "Anyone with the link"
    { type: "file",    src: "/portfolio/media/clip.mp4" } // or any direct .mp4 / .mp3 URL

  Images: put files in public/portfolio/media/ and reference them as "/portfolio/media/name.jpg".
  Anything with draft: true is hidden unless the URL has ?drafts=1.
  Personalise the hero for one person with ?for=Kareem%20Elshenawy
*/
window.PORTFOLIO = {
  name: "Mostafa Aboustate",
  headline: "Editor, colorist & sound designer.",
  intro:
    "I take films from the first assembly to the final mix — cut, grade, sound and finishing under one roof.",
  location: "Egypt",
  email: "studio@aboustate.tech",
  phone: "+201501538408",
  links: {
    studio: "https://www.aboustate.tech",
    instagram: "https://www.instagram.com/aboustate",
    linkedin: "https://www.linkedin.com/company/aboustate-tech/",
  },

  // Optional showreel. A muted loop plays behind the hero when `loop` is a direct .mp4.
  reel: null, // e.g. { video: { type: "vimeo", id: "..." }, loop: "/portfolio/media/reel-loop.mp4" }

  disciplines: [
    { label: "Editing", detail: "Story-first cutting, from assembly to picture lock." },
    { label: "Color", detail: "Look development and final grade." },
    { label: "Sound", detail: "Sound design, music curation and the final mix." },
    { label: "Finishing & VFX", detail: "Online, clean-up, compositing and end-credit design." },
    { label: "3D", detail: "Modeling, look-dev and rendered sequences." },
    { label: "Motion & VO", detail: "Motion graphics, titles and voice-over." },
  ],

  tools: [], // e.g. ["DaVinci Resolve", "Premiere Pro", "After Effects", "Blender", "Pro Tools"]

  about: [
    "I'm Mostafa Aboustate, an editor, colorist and sound designer, and the founder of aboustate.tech — a post-production studio where a film's cut, grade, sound and finishing happen in one pipeline instead of four.",
    "I care about the parts of a film nobody should notice: the cut that lands a beat a frame early, the grade that holds a scene together, the room tone under a silence. On set I record sound; in post I see the film through to delivery.",
  ],

  films: [
    {
      slug: "spirit",
      title: "Spirit",
      year: 2026,
      featured: true,
      format: "Short film",
      runtime: null, // e.g. "14 min"
      genre: null,
      logline: null,
      poster: null, // e.g. "/portfolio/media/spirit-poster.jpg" (2.39:1 or 16:9 still works best)
      video: null, // screening link; card shows "Screener on request" until set
      roles: ["Finishing Editor", "Colorist", "Audio Mixer", "Sound Design & Music", "VFX & End Credits", "On-Set Sound"],
      tags: ["Edit", "Color", "Sound", "VFX"],
      director: "Hazem Elsoufy",
      credits: [
        {
          group: "Post-production — aboustate.tech",
          rows: [
            ["Finishing Editor & Audio Mixer", "Mostafa Aboustate"],
            ["Editor", "Nadeen Amr"],
            ["Colorist", "Mostafa Aboustate"],
            ["Sound Design & Music Production / Curation", "Mostafa Aboustate, Omar Sherif (Three)"],
            ["VFX & End Credit Design", "Mostafa Aboustate"],
            ["Post-Logistics", "Ziad Emad"],
          ],
        },
        {
          group: "Production",
          rows: [
            ["Director", "Hazem Elsoufy"],
            ["Assistant Director", "Nadeen Amr"],
            ["Executive Director", "Pascal Victor"],
            ["Director of Photography", "Samuel Adel"],
            ["Camera Assistants", "George Nabil, Youssef Khaled, Yehia Ashraf"],
            ["Costume Designer", "Joseph Nassim"],
            ["Production Designer", "Adam Shoueb"],
            ["Production Manager", "Ziad Emad"],
            ["Dramatic Treatment", "Fady Yasser"],
            ["On-Set Sound Mixer", "Mostafa Aboustate"],
          ],
        },
        {
          group: "Cast",
          rows: [
            ["Khayal Team", "Omar Emam, Adam Shoueb, Omar Sherif, Ahmed Sherif"],
            ["Spirit Team", "Hazem Elsoufy, Hussein Zorba, Hassam Ashraf, Fouad Ashoush, Omar Mahmoud"],
          ],
        },
      ],
    },

    // Template entries — copy one, fill it in, delete `draft: true`.
    {
      slug: "film-two",
      draft: true,
      title: "Film title",
      year: 2025,
      format: "Short film",
      runtime: "12 min",
      genre: "Drama",
      logline: "One sentence on what the film is about.",
      poster: null,
      video: null,
      roles: ["Editor", "Colorist"],
      tags: ["Edit", "Color"],
      director: "Director name",
      credits: [],
    },
    {
      slug: "film-three",
      draft: true,
      title: "Music video",
      year: 2025,
      format: "Music video",
      runtime: "3 min",
      genre: null,
      logline: null,
      poster: null,
      video: null,
      roles: ["Editor", "VFX"],
      tags: ["Edit", "VFX"],
      director: "Director name",
      credits: [],
    },
  ],

  // 3D: image stills or rendered clips.
  threeD: [
    { draft: true, title: "Product render", note: "Blender · Cycles", image: null, video: null },
    { draft: true, title: "Environment study", note: "Look-dev", image: null, video: null },
    { draft: true, title: "Turntable", note: "Animated", image: null, video: null },
  ],

  // Motion graphics: `loop` is a short muted .mp4 that plays on hover; `video` opens full screen.
  motion: [
    { draft: true, title: "Title sequence", note: "Kinetic type", poster: null, loop: null, video: null },
    { draft: true, title: "Social package", note: "9:16 · 6 deliverables", poster: null, loop: null, video: null },
  ],

  // Voice-over: `src` is a direct audio URL (.mp3 / .wav / .m4a).
  voiceover: [
    { draft: true, title: "Commercial read", language: "Arabic — Egyptian", style: "Warm, conversational", duration: "0:30", src: null },
    { draft: true, title: "Documentary narration", language: "English", style: "Measured", duration: "1:10", src: null },
  ],
};
