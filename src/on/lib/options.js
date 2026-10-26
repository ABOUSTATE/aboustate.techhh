export const CATEGORIES = ["Actor", "Model", "Voice actor", "Dancer", "Presenter", "Extra", "Singer", "Stunt performer", "Influencer"];

export const SKILLS = [
  "Stage combat", "Horse riding", "Swimming", "Driving", "Motorbike", "Singing", "Piano", "Guitar", "Oud",
  "Football", "Martial arts", "Boxing", "Gymnastics", "Ballet", "Contemporary dance", "Belly dance", "Tanoura",
  "Improv", "Comedy", "Impressions", "Puppetry", "Juggling", "Magic", "Skateboarding", "Cycling", "Yoga",
];

export const LANGUAGES = ["Arabic", "English", "French", "German", "Italian", "Spanish", "Turkish", "Russian", "Chinese"];

export const ACCENTS = [
  "Cairene", "Alexandrian", "Sa'idi", "Bedouin", "Nubian", "Fellahi", "Gulf", "Levantine", "Moroccan",
  "Fusha (MSA)", "British", "American",
];

export const CITIES = ["Cairo", "Giza", "Alexandria", "Mansoura", "Tanta", "Luxor", "Aswan", "Port Said", "Ismailia", "Hurghada", "Sharm El Sheikh"];

export const GENDERS = ["Female", "Male", "Non-binary"];
export const BUILDS = ["Slim", "Athletic", "Average", "Muscular", "Curvy", "Plus size"];
export const EYES = ["Brown", "Dark brown", "Hazel", "Green", "Blue", "Grey"];
export const HAIR = ["Black", "Dark brown", "Brown", "Light brown", "Blonde", "Red", "Grey", "Bald"];
export const LEVELS = ["New face", "Some experience", "Experienced", "Professional"];
export const CREDIT_TYPES = ["Film", "Short film", "Series", "TV ad", "Theatre", "Music video", "Campaign", "Voice"];

export const MEDIA_KINDS = {
  headshot: "Headshot",
  photo: "Photo",
  reel: "Showreel",
  selftape: "Self-tape",
  audio: "Voice clip",
};

export function ageFrom(birthDate) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return age;
}

export function playingAge(t) {
  if (!t?.playing_age_min && !t?.playing_age_max) return null;
  if (t.playing_age_min && t.playing_age_max && t.playing_age_min !== t.playing_age_max) {
    return `${t.playing_age_min}–${t.playing_age_max}`;
  }
  return String(t.playing_age_min || t.playing_age_max);
}

// What a profile still needs, in the order a casting director would care.
export function profileStrength(profile, talent, media) {
  const photos = media.filter((m) => m.kind === "headshot" || m.kind === "photo");
  const videos = media.filter((m) => m.kind === "reel" || m.kind === "selftape");
  const checks = [
    { label: "Add a profile photo", done: !!profile.avatar_path, weight: 15 },
    { label: "Write a headline", done: !!profile.headline, weight: 8 },
    { label: "Add your city", done: !!profile.city, weight: 5 },
    { label: "Set your playing age", done: !!(talent?.playing_age_min || talent?.playing_age_max), weight: 10 },
    { label: "Add height and look", done: !!(talent?.height_cm && talent?.hair_color && talent?.eye_color), weight: 10 },
    { label: "Pick what you do", done: (talent?.categories || []).length > 0, weight: 8 },
    { label: "Add languages", done: (talent?.languages || []).length > 0, weight: 6 },
    { label: "Upload 3+ photos", done: photos.length >= 3, weight: 14 },
    { label: "Upload a reel or self-tape", done: videos.length > 0, weight: 14 },
    { label: "Write a short bio", done: !!profile.bio, weight: 5 },
    { label: "Add a credit or training", done: (talent?.credits || []).length > 0 || !!talent?.training, weight: 5 },
  ];
  const score = checks.reduce((sum, c) => sum + (c.done ? c.weight : 0), 0);
  return { score, missing: checks.filter((c) => !c.done) };
}
export const PRIVATE_COLUMNS = "profile_id, phone, whatsapp, contact_email, guardian_name, guardian_phone";
