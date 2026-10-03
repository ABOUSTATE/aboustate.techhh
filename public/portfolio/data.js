/*
  portfolio.aboustate.tech — content file.
  Edit this file only; the page builds itself from it.

  Video fields accept:
    { type: "youtube",   id: "dQw4w9WgXcQ" }
    { type: "vimeo",     id: "123456789" }
    { type: "drive",     id: "<Google Drive file id>" }   // sharing must be "Anyone with the link"
    { type: "instagram", id: "<reel shortcode>" }        // instagram.com/reel/<shortcode>/
    { type: "file",      src: "/portfolio/media/clip.mp4" } // or any direct .mp4 URL

  `loop` fields are short muted .mp4 previews that play on hover (optional).
  Images/clips go in public/portfolio/media/ and are referenced as "/portfolio/media/name.jpg".
  Anything with draft: true is hidden unless the URL has ?drafts=1.
  Personalise the hero for one person with ?for=Kareem%20Elshenawy
*/
window.PORTFOLIO = {
  name: "Mostafa Aboustate",
  headline: "Editor, director & cinematographer.",
  intro:
    "I shoot, cut, grade and mix — from the first frame on set to the final deliverable, under one roof.",
  location: "Egypt",
  email: "studio@aboustate.tech",
  phone: "+201501538408",
  portrait: null, // e.g. "/portfolio/media/portrait.jpg" (4:5)
  links: {
    studio: "https://www.aboustate.tech",
    instagram: "https://www.instagram.com/aboustate",
    linkedin: "https://www.linkedin.com/company/aboustate-tech/",
  },

  // Optional showreel: `loop` plays muted behind the hero, `video` opens from the "Watch showreel" button.
  reel: null,

  disciplines: [
    { label: "Directing & Camera", detail: "Documentary and narrative — I shoot what I direct." },
    { label: "Editing", detail: "Story-first cutting, from assembly to picture lock." },
    { label: "Color", detail: "Look development and final grade." },
    { label: "Sound", detail: "Sound design, music curation and the final mix." },
    { label: "Finishing & VFX", detail: "Online, clean-up, compositing and end-credit design." },
    { label: "3D", detail: "Modeled, lit and rendered 16:9 sequences." },
    { label: "Motion & VO", detail: "Motion graphics, titles and voice-over." },
    { label: "Graphic design", detail: "Posters, identities and campaign visuals." },
  ],

  tools: [], // e.g. ["DaVinci Resolve", "Premiere Pro", "After Effects", "Blender", "Photoshop"]

  about: [
    "I'm Mostafa Aboustate — I direct, shoot and edit, and I founded aboustate.tech, a post-production studio where a film's cut, grade, sound and finishing happen in one pipeline instead of four.",
    "My favourite work starts behind the camera and ends in the edit suite: a documentary on Egypt's arabesque woodcraft I shot, directed and cut myself, short films turned around in days, and finishing work on other directors' films. I care about the parts nobody should notice — the cut that lands a beat early, the grade that holds a scene together, the room tone under a silence.",
  ],

  // The film with featured: true is the hero card. Order here = order on the page.
  films: [
    {
      slug: "arabesque",
      title: "Arabesque", // working title — change to the documentary's real title
      year: null,
      featured: true,
      format: "Documentary",
      runtime: null,
      genre: "Craft / Heritage",
      logline: "A documentary on the arabesque woodcraft of Egypt.",
      highlight: "Shot, directed & edited",
      poster: null, // a wide still works best, e.g. "/portfolio/media/arabesque.jpg"
      video: null,
      roles: ["Director", "Director of Photography", "Editor"],
      tags: ["Direct", "Camera", "Edit"],
      director: "Mostafa Aboustate",
      credits: [],
    },
    {
      slug: "vodka",
      title: "Vodka",
      year: null,
      format: "Short film",
      runtime: null,
      genre: null,
      logline: null,
      highlight: "Shot & edited",
      poster: null,
      video: null,
      roles: ["Director of Photography", "Editor"],
      tags: ["Camera", "Edit"],
      director: null,
      credits: [],
    },
    {
      slug: "3enwan",
      title: "3enwan",
      year: null,
      format: "Short film",
      runtime: null,
      genre: null,
      logline: null,
      highlight: "Shot & edited in two days",
      poster: null,
      video: null,
      roles: ["Director of Photography", "Editor"],
      tags: ["Camera", "Edit"],
      director: null,
      credits: [],
    },
    {
      slug: "spirit",
      title: "Spirit",
      year: 2026,
      format: "Short film",
      runtime: null,
      genre: null,
      logline: null,
      highlight: "Finishing, color & sound",
      poster: null,
      video: null,
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
  ],

  // Reels dashboard. `hero` = the two big reels; `items` = everything else.
  // `category` drives the filter chips. `aspect` defaults to "9:16"; use "16:9" for landscape.
  reels: {
    hero: [
      { draft: true, title: "Hero reel one", category: "Edit", client: null, poster: null, loop: null, video: null },
      { draft: true, title: "Hero reel two", category: "Motion", client: null, poster: null, loop: null, video: null },
    ],
    items: [
      { draft: true, title: "Brand launch", category: "Edit", poster: null, loop: null, video: null },
      { draft: true, title: "Product teaser", category: "3D", poster: null, loop: null, video: null },
      { draft: true, title: "Event recap", category: "Edit", poster: null, loop: null, video: null },
      { draft: true, title: "Kinetic type", category: "Motion", poster: null, loop: null, video: null },
      { draft: true, title: "Talking head", category: "Edit", poster: null, loop: null, video: null },
      { draft: true, title: "Lyric visual", category: "Motion", poster: null, loop: null, video: null },
    ],
  },

  // 3D: 16:9 rendered videos. `poster` = still, `loop` = hover preview, `video` = full piece.
  threeD: [
    { draft: true, title: "3D piece one", note: "Rendered sequence", poster: null, loop: null, video: null },
    { draft: true, title: "3D piece two", note: "Rendered sequence", poster: null, loop: null, video: null },
  ],

  motion: [
    { draft: true, title: "Title sequence", note: "Kinetic type", poster: null, loop: null, video: null },
    { draft: true, title: "Social package", note: "6 deliverables", poster: null, loop: null, video: null },
  ],

  // Graphic design: any aspect ratio — the grid keeps each image's natural shape.
  graphic: [
    { draft: true, title: "Film poster", note: "Key art", image: null, aspect: "2:3" },
    { draft: true, title: "Brand identity", note: "Logo & system", image: null, aspect: "4:3" },
    { draft: true, title: "Campaign", note: "Social visuals", image: null, aspect: "1:1" },
    { draft: true, title: "Event poster", note: "Print", image: null, aspect: "3:4" },
    { draft: true, title: "Album cover", note: "Artwork", image: null, aspect: "1:1" },
  ],

  voiceover: [
    { draft: true, title: "Commercial read", language: "Arabic — Egyptian", style: "Warm, conversational", duration: "0:30", src: null },
    { draft: true, title: "Documentary narration", language: "English", style: "Measured", duration: "1:10", src: null },
  ],
};
