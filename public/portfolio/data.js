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
  headline: "Film Editor",
  subline: "Director & cinematographer",
  intro:
    "I shoot my own films, then cut, grade and mix them myself.",
  location: "Cairo, Egypt",
  since: 2017,
  // The slate line under the hero: [label, value].
  heroFacts: [
    ["Cutting since", "2017"],
    ["Cuts in", "Resolve & Premiere"],
    ["Works in", "Arabic & English"],
    ["Based in", "Cairo"],
  ],
  email: "mostafaaboustate@gmail.com",
  phone: "+201002221670",
  // Full photo, shown as a duotone eye strip that opens to the whole colour picture when About scrolls into view.
  portrait: { duotone: "/portfolio/media/portrait-duotone.jpg", color: "/portfolio/media/portrait-color.jpg" },
  // Personal links, shown in Contact in this order. Add your own Instagram / Vimeo / LinkedIn here.
  links: [
    { label: "Instagram", url: "https://www.instagram.com/aboustatee/" },
    { label: "YouTube", url: "https://www.youtube.com/@aboustatee" },
    { label: "My studio · aboustate.tech", url: "https://www.aboustate.tech" },
  ],

  // Optional showreel: `loop` plays muted behind the hero, `video` opens from the "Watch showreel" button.
  reel: null,

  disciplines: [
    { label: "Directing & Camera", detail: "Documentary and narrative. I shoot what I direct." },
    { label: "Editing", detail: "Cutting from the first assembly to picture lock." },
    { label: "Color", detail: "Building the look and doing the final grade." },
    { label: "Sound", detail: "Sound design, foley, mixing and mastering." },
    { label: "Finishing & VFX", detail: "Online, clean-up, compositing and end credits." },
    { label: "3D", detail: "Modelling, texturing, rigging and animation in Maya and Unreal Engine 5." },
    { label: "Motion & VO", detail: "Motion graphics, titles and voice-over." },
    { label: "Graphic design", detail: "Posters, logos and campaign artwork." },
  ],

  tools: ["DaVinci Resolve", "Premiere Pro", "After Effects", "Unreal Engine 5", "Maya", "Photoshop", "Illustrator", "Pro Tools", "Logic Pro", "FL Studio"],

  languages: ["Arabic", "English"],

  // Shown under About as a short timeline, newest first.
  experience: [
    {
      years: "Since 2021",
      role: "Freelance editor, colorist & post-production lead",
      org: "Independent",
      detail: "Edits, grades and motion for brand campaigns, delivered to broadcast spec. I work directly with agencies.",
    },
    {
      years: "2017 to 2021",
      role: "Intern → TV Production Manager's Associate",
      org: "MBC Group · Dubai",
      detail: "Lighting, equipment and floor coordination on studio TV productions.",
    },
  ],

  // Brands whose campaigns you've edited or graded (names only, no logos).
  clients: ["Vodafone Egypt", "Vodafone Red", "Edita · Bake Rollz", "NXT Bank", "Sohoula"],

  about: [
    "I'm Mostafa Aboustate, a filmmaker and editor in Cairo. I direct, shoot and cut, and I usually stay on through the grade and the mix. That's where a film gets finished.",
    "I started on MBC's studio floors in Dubai in 2017 as a 12-year-old intern. Four years later I left as a production manager's associate. Since 2021 I've been cutting and grading campaigns for brands like Vodafone and Edita.",
    "The work I like most starts behind the camera and ends in the edit. I make documentaries and short films, some of them in a few days, and I do finishing work on other directors' films. What I care about most is the stuff you're not meant to notice, like a cut that comes a beat early or the room tone under a silence.",
    "When I'm not on my own films, I run aboustate.tech, a post-production studio.",
  ],

  // The film with featured: true is the hero card. Order here = order on the page.
  films: [
    {
      slug: "arabesque",
      title: "Arabesque", // working title: change to the documentary's real title
      year: null,
      featured: true,
      format: "Documentary",
      runtime: null,
      genre: "Craft / Heritage",
      logline: "A documentary on the arabesque woodcraft of Egypt.",
      highlight: "Shot, directed, edited & graded",
      poster: "/portfolio/media/arabesque.jpg", // frame from 47% through the film
      video: { type: "drive", id: "1AjL2wTx0xjBZXVbEl8Y8-q5HiU_CkPAm" },
      roles: ["Director", "Director of Photography", "Editor", "Colorist"],
      tags: ["Direct", "Camera", "Edit", "Color"],
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
      highlight: "Shot, edited & graded",
      poster: "/portfolio/media/vodka.jpg", // frame from the middle of the film
      video: { type: "drive", id: "1EPk4AeDnHufQXbBAN59VuhZEslfV6n_D" },
      roles: ["Director of Photography", "Editor", "Colorist"],
      tags: ["Camera", "Edit", "Color"],
      director: null,
      credits: [],
    },
    {
      slug: "3enwan",
      title: "3enwan",
      year: null,
      format: "Short film",
      runtime: "5 min",
      genre: null,
      logline: null,
      highlight: "Shot, edited & graded in two days",
      poster: "/portfolio/media/3enwan.jpg", // YouTube's mid-video frame
      video: { type: "youtube", id: "mbIDe4sjB88" },
      roles: ["Director of Photography", "Editor", "Colorist"],
      tags: ["Camera", "Edit", "Color"],
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
      highlight: "Edit, color & sound",
      poster: "/portfolio/media/spirit.jpg",
      video: { type: "drive", id: "1-XrDz5IydoY8wr7N9WkU5dP29ZA1UAQR" },
      roles: ["Editor", "Finishing Editor", "Colorist", "Audio Mixer", "Sound Design & Music", "VFX & End Credits", "On-Set Sound"],
      tags: ["Edit", "Color", "Sound", "VFX"],
      director: "Hazem Elsoufy",
      credits: [
        {
          group: "Post-production (aboustate.tech)",
          rows: [
            ["Finishing Editor & Audio Mixer", "Mostafa Aboustate"],
            ["Editor", "Mostafa Aboustate, Nadeen Amr"],
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
    { title: "Xine 3D test", note: "Teaser test · vertical", aspect: "9:16", poster: "/portfolio/media/3d-xine.jpg", loop: null, video: { type: "drive", id: "1NlHSpwpOHHzQcLoGieap2uhf7xqmXc-P" } },
    { title: "Porsche Taycan Turbo GT", note: "Weissach Package · UE5 · 2025", poster: "/portfolio/media/3d-porsche.jpg", loop: null, video: { type: "drive", id: "1XQcpGrWAv1MnYAZ9Nm0IjW_cRIGe8JR6" } },
    { title: "White Horse", note: "Modelling, texture, rig & animation · Maya + UE5 · 2026", poster: "/portfolio/media/3d-horse.jpg", loop: null, video: { type: "drive", id: "1Q5B0UHp1ZKi5tD42hSA2f4eLXTP9xXx-" } },
    { title: "Natural Environment", note: "Environment & particles, inspired by The Last of Us · UE5 · 2026", poster: "/portfolio/media/3d-env.jpg", loop: null, video: { type: "drive", id: "1CMCqYDVOpCyzTlry1lv4eJwcoCKiMauh" } },
    { title: "Sunrise on Horizon", note: "Demo showcase · UE5 · 2026", poster: "/portfolio/media/3d-horizon.jpg", loop: null, video: { type: "drive", id: "1S-HIOLycCKht1roONDL0gSmEfZZXtbby" } },
    { title: "Room Showcase", note: "Modelling, shading, texturing & cinematography · UE5 · 2025", poster: "/portfolio/media/3d-room.jpg", loop: null, video: { type: "drive", id: "17SwaRtyN2xqfrdGHBPU8y0axvrZonlYL" } },
    { title: "Xine teaser test", note: "Post Dabygannhom · UE5 · 2026", poster: "/portfolio/media/3d-xine-teaser.jpg", loop: null, video: { type: "drive", id: "1-QMc0WKEKo50riCvmZs878IHdkUYxdTM" } },
    { title: "Dabygannhom multicam test", note: "3D test · vertical", aspect: "9:16", poster: "/portfolio/media/3d-dabygannhom.jpg", loop: null, video: { type: "drive", id: "1lK2HqbGWjCS8tm2QLqjt4ZXo-_CN7ae4" } },
  ],

  // Your own motion pieces. `loop` = muted hover preview, `video` = full piece.
  motion: [
    { draft: true, title: "Title sequence", note: "Kinetic type", poster: null, loop: null, video: null },
    { draft: true, title: "Social package", note: "6 deliverables", poster: null, loop: null, video: null },
  ],

  // Your own graphic design: any aspect ratio — the grid keeps each image's natural shape.
  graphic: [
    { draft: true, title: "Film poster", note: "Key art", image: null, aspect: "2:3" },
    { draft: true, title: "Album cover", note: "Artwork", image: null, aspect: "1:1" },
  ],

  voiceover: [
    { draft: true, title: "Commercial read", language: "Arabic (Egyptian)", style: "Warm, conversational", duration: "0:30", src: null },
    { draft: true, title: "Documentary narration", language: "English", style: "Measured", duration: "1:10", src: null },
  ],
};
