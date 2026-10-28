"""Test profiles for ON: fictional people, placeholder photos, clearly
marked (on_profiles.seed = true). Delete them all from Admin.

    python docs/seed/make_seed.py      # writes photos/ and seed.sql

Every account gets an unusable random password and a seed+...@on-test.local
email; nobody can sign in as them.
"""
import io
import json
import random
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
PHOTOS = HERE / "photos"
FONT = Path("D:/Aboustate Design System/assets/fonts/FunnelDisplay-Bold.ttf")
random.seed(7)

# Design-system colours (globals.css tokens).
GREENS = ["#011f1a", "#02362f", "#1b4943", "#4c706a"]
MINTS = ["#90b495", "#bacfbb", "#65826b"]
BEIGES = ["#f2efeb", "#dfdad4", "#c3bcb3"]

# name, handle, gender, age, height, build, hair, eyes, categories, languages, accents, skills, city, minor
PEOPLE = [
    ("Salma Hassan", "test.salma", "Female", (22, 28), 165, "Slim", "Black", "Brown", ["Actor", "Model"], ["Arabic", "English"], ["Cairene"], ["Contemporary dance", "Swimming"], "Cairo", False),
    ("Omar Khaled", "test.omar", "Male", (25, 32), 182, "Athletic", "Black", "Brown", ["Actor"], ["Arabic", "English"], ["Cairene", "British"], ["Martial arts", "Driving", "Football"], "Giza", False),
    ("Nour El Sherif", "test.nour", "Female", (18, 24), 160, "Slim", "Dark brown", "Hazel", ["Model", "Influencer"], ["Arabic", "English", "French"], ["Cairene"], ["Yoga"], "Cairo", False),
    ("Hassan Abdel Aziz", "test.hassan", "Male", (45, 55), 175, "Average", "Grey", "Brown", ["Actor"], ["Arabic"], ["Sa'idi", "Fusha (MSA)"], ["Horse riding", "Driving"], "Luxor", False),
    ("Mona Fathy", "test.mona", "Female", (40, 50), 162, "Curvy", "Black", "Brown", ["Actor", "Presenter"], ["Arabic"], ["Cairene", "Alexandrian"], ["Singing", "Comedy"], "Alexandria", False),
    ("Youssef Adel", "test.youssef", "Male", (20, 26), 185, "Plus size", "Black", "Brown", ["Actor", "Dancer"], ["Arabic", "English"], ["Cairene"], ["Comedy", "Improv"], "Cairo", False),
    ("Mariam Ashraf", "test.mariam", "Female", (25, 32), 170, "Athletic", "Light brown", "Green", ["Model", "Dancer"], ["Arabic", "English"], ["Cairene"], ["Ballet", "Contemporary dance", "Gymnastics"], "Cairo", False),
    ("Karim Mostafa", "test.karim", "Male", (30, 38), 178, "Muscular", "Black", "Brown", ["Actor", "Stunt performer"], ["Arabic", "English"], ["Cairene"], ["Stage combat", "Boxing", "Motorbike", "Driving"], "Giza", False),
    ("Habiba Samir", "test.habiba", "Female", (14, 17), 158, "Slim", "Brown", "Brown", ["Actor"], ["Arabic", "English"], ["Cairene"], ["Singing", "Piano"], "Cairo", True),
    ("Ziad Tamer", "test.ziad", "Male", (10, 13), 145, "Slim", "Black", "Brown", ["Actor"], ["Arabic"], ["Cairene"], ["Football", "Swimming"], "Cairo", True),
    ("Amira Lotfy", "test.amira", "Female", (28, 35), 168, "Average", "Dark brown", "Brown", ["Voice actor", "Presenter"], ["Arabic", "English", "French"], ["Fusha (MSA)", "Cairene", "American"], ["Singing", "Impressions"], "Cairo", False),
    ("Mahmoud Saeed", "test.mahmoud", "Male", (50, 60), 172, "Plus size", "Bald", "Brown", ["Actor"], ["Arabic"], ["Sa'idi", "Fellahi"], ["Comedy", "Driving"], "Aswan", False),
    ("Farida Nabil", "test.farida", "Female", (60, 70), 160, "Average", "Grey", "Brown", ["Actor"], ["Arabic", "English"], ["Cairene"], [], "Cairo", False),
    ("Ahmed Fouad", "test.ahmed", "Male", (22, 28), 176, "Slim", "Black", "Brown", ["Actor", "Singer"], ["Arabic"], ["Alexandrian"], ["Singing", "Guitar", "Oud"], "Alexandria", False),
    ("Laila Hamdy", "test.laila", "Female", (20, 26), 163, "Slim", "Black", "Brown", ["Actor", "Dancer"], ["Arabic"], ["Cairene"], ["Belly dance", "Contemporary dance"], "Cairo", False),
    ("Tarek Salah", "test.tarek", "Male", (35, 45), 180, "Average", "Dark brown", "Brown", ["Actor", "Presenter"], ["Arabic", "English"], ["Cairene", "British"], ["Driving", "Improv"], "Cairo", False),
    ("Rana Mahmoud", "test.rana", "Female", (30, 40), 166, "Curvy", "Brown", "Hazel", ["Actor"], ["Arabic"], ["Sa'idi", "Cairene"], ["Comedy", "Singing"], "Giza", False),
    ("Mostafa Gamal", "test.mostafa", "Male", (18, 22), 188, "Athletic", "Black", "Brown", ["Model", "Actor"], ["Arabic", "English"], ["Cairene"], ["Football", "Swimming", "Skateboarding"], "Cairo", False),
    ("Dina Raafat", "test.dina", "Female", (35, 45), 158, "Plus size", "Black", "Brown", ["Actor"], ["Arabic"], ["Fellahi", "Cairene"], ["Comedy", "Improv"], "Mansoura", False),
    ("Sherif Adly", "test.sherif", "Male", (60, 70), 170, "Average", "Grey", "Brown", ["Actor"], ["Arabic", "English"], ["Fusha (MSA)", "Cairene"], ["Horse riding"], "Cairo", False),
    ("Yara Wael", "test.yara", "Female", (22, 28), 172, "Slim", "Blonde", "Blue", ["Model"], ["Arabic", "English", "Russian"], ["Cairene"], ["Yoga", "Swimming"], "Hurghada", False),
    ("Bassem Nagy", "test.bassem", "Male", (28, 35), 174, "Average", "Black", "Brown", ["Extra", "Actor"], ["Arabic"], ["Cairene"], ["Driving", "Cycling"], "Giza", False),
    ("Hana Osama", "test.hana", "Female", (18, 23), 161, "Slim", "Dark brown", "Brown", ["Influencer", "Model"], ["Arabic", "English"], ["Cairene"], ["Contemporary dance"], "Cairo", False),
    ("Ali Ramadan", "test.ali", "Male", (25, 30), 179, "Muscular", "Black", "Brown", ["Stunt performer", "Actor"], ["Arabic"], ["Sa'idi"], ["Martial arts", "Horse riding", "Stage combat"], "Luxor", False),
]
OTHERS = [
    # name, handle, role, extra
    ("Test Director (approved)", "test.director", "director", {"director_status": "approved", "company": "Test Films"}),
    ("Test Director (pending)", "test.director.pending", "director", {"director_status": "pending", "company": "Pending Productions"}),
    ("Test Parent", "test.parent", "guardian", {}),
]
LEVELS = ["New face", "Some experience", "Experienced", "Professional"]


def initials(name):
    return "".join(w[0] for w in name.split()[:2]).upper()


def portrait(name, variant, w=800, h=1000):
    """A clearly-placeholder portrait: silhouette, initials, TEST tag."""
    bg = random.choice(GREENS[:3]) if variant != 1 else random.choice(BEIGES[1:])
    fg = random.choice(MINTS) if variant != 1 else random.choice(GREENS[1:3])
    img = Image.new("RGB", (w, h), bg)
    d = ImageDraw.Draw(img)
    for y in range(0, h, 36):
        for x in range(0, w, 36):
            d.ellipse([x, y, x + 3, y + 3], fill=fg if variant == 1 else GREENS[2])
    cx = w // 2 + (0 if variant != 2 else 90)
    if variant == 0:  # headshot
        d.ellipse([cx - 150, 230, cx + 150, 560], fill=fg)
        d.rounded_rectangle([cx - 300, 600, cx + 300, h + 200], radius=260, fill=fg)
    elif variant == 1:  # full length
        d.ellipse([cx - 70, 120, cx + 70, 280], fill=fg)
        d.rounded_rectangle([cx - 150, 300, cx + 150, 700], radius=90, fill=fg)
        d.rounded_rectangle([cx - 120, 680, cx - 20, h - 60], radius=40, fill=fg)
        d.rounded_rectangle([cx + 20, 680, cx + 120, h - 60], radius=40, fill=fg)
    else:  # three-quarter
        d.ellipse([cx - 130, 260, cx + 130, 560], fill=fg)
        d.rounded_rectangle([cx - 260, 600, cx + 260, h + 200], radius=220, fill=fg)
    big = ImageFont.truetype(str(FONT), 120)
    small = ImageFont.truetype(str(FONT), 34)
    ink = BEIGES[0] if variant != 1 else GREENS[0]
    d.text((48, 40), initials(name), font=big, fill=ink)
    d.rounded_rectangle([48, h - 100, 270, h - 44], radius=8, fill=MINTS[0])
    d.text((66, h - 94), "TEST", font=small, fill=GREENS[0])
    return img


def sql(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def arr(values):
    return "array[" + ",".join(sql(v) for v in values) + "]::text[]" if values else "'{}'::text[]"


def main():
    """Writes photos/, uploads.json and seed.sql (one compact JSON-driven script)."""
    PHOTOS.mkdir(exist_ok=True)
    people, uploads, ids = [], [], {}
    for name, handle, role, extra in OTHERS:
        ids[handle] = str(uuid.uuid4())
        people.append({"id": ids[handle], "handle": handle, "name": name, "role": role, **extra})
    for i, (name, handle, gender, age, height, build, hair, eyes, cats, langs, accents, skills, city, minor) in enumerate(PEOPLE):
        pid = ids[handle] = str(uuid.uuid4())
        credits = [{"title": "Sample short film", "role": "Lead" if i % 3 == 0 else "Supporting", "type": "Short film", "year": str(2022 + i % 4)}]
        if i % 2 == 0:
            credits.append({"title": "Sample TV ad", "role": "", "type": "TV ad", "year": "2025"})
        people.append({
            "id": pid, "handle": handle, "name": name, "role": "talent", "city": city, "minor": minor,
            "guardian": ids["test.parent"] if minor else None, "verified": i % 5 == 0,
            "headline": " and ".join(c.lower() for c in cats[:2]).capitalize() + ". Test profile.",
            "bio": f"Fictional test profile for trying ON. Plays {age[0]} to {age[1]}, {height} cm, based in {city}.",
            "phone": f"+20 100 000 {1000 + i:04d}",
            "t": {"gender": gender, "playing_age_min": age[0], "playing_age_max": age[1], "height_cm": height, "build": build,
                  "hair_color": hair, "eye_color": eyes, "nationality": "Egyptian", "languages": langs, "accents": accents,
                  "skills": skills, "categories": cats, "experience_level": LEVELS[i % 4], "credits": credits,
                  "available": i % 3 != 2, "will_travel": i % 2 == 1},
        })
        for v in range(3):
            buf = io.BytesIO()
            portrait(name, v).save(buf, "JPEG", quality=82)
            local = PHOTOS / f"{handle}-{v + 1}.jpg"
            local.write_bytes(buf.getvalue())
            uploads.append({"local": local.name, "path": f"{pid}/{v + 1}.jpg"})
    data = json.dumps(people, ensure_ascii=False, separators=(",", ":")).replace("'", "''")
    sql_text = SQL.replace("__DATA__", data)
    (HERE / "seed.sql").write_text(sql_text, encoding="utf-8")
    (HERE / "uploads.json").write_text(json.dumps(uploads, indent=1), encoding="utf-8")
    print(f"{len(PEOPLE)} talents + {len(OTHERS)} other accounts, {len(uploads)} photos, sql {len(sql_text)} chars")


SQL = """-- Generated by make_seed.py: test profiles only (seed = true).
do $$
declare
  p jsonb;
  t jsonb;
  em text;
begin
  for p in select * from jsonb_array_elements('__DATA__'::jsonb) loop
    em := 'seed+' || (p->>'handle') || '@on-test.local';
    insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    values ('00000000-0000-0000-0000-000000000000',(p->>'id')::uuid,'authenticated','authenticated',em,
            extensions.crypt(encode(extensions.gen_random_bytes(24),'hex'),extensions.gen_salt('bf')),now(),
            '{"provider":"email","providers":["email"]}','{"seed":true}',now(),now(),'','','','');
    insert into auth.identities (provider_id,user_id,identity_data,provider,created_at,updated_at)
    values (p->>'id',(p->>'id')::uuid,jsonb_build_object('sub',p->>'id','email',em,'email_verified',true),'email',now(),now());

    insert into public.on_profiles (id,role,handle,display_name,headline,bio,city,seed,is_minor,guardian_id,guardian_email,guardian_approved_at,verified,director_status,company,avatar_path,cover_path)
    values ((p->>'id')::uuid, p->>'role', p->>'handle', p->>'name', coalesce(p->>'headline','Test account'), p->>'bio', p->>'city', true,
            coalesce((p->>'minor')::boolean,false), (p->>'guardian')::uuid,
            case when (p->>'minor')::boolean then 'seed+test.parent@on-test.local' end,
            case when (p->>'minor')::boolean then now() end,
            coalesce((p->>'verified')::boolean,false), p->>'director_status', p->>'company',
            case when p->>'role'='talent' then (p->>'id')||'/1.jpg' end,
            case when p->>'role'='talent' then (p->>'id')||'/3.jpg' end);

    if p->>'role' = 'talent' then
      t := p->'t';
      insert into public.on_talent (profile_id,gender,playing_age_min,playing_age_max,height_cm,build,hair_color,eye_color,nationality,languages,accents,skills,categories,experience_level,credits,available,will_travel)
      values ((p->>'id')::uuid, t->>'gender', (t->>'playing_age_min')::int, (t->>'playing_age_max')::int, (t->>'height_cm')::int,
              t->>'build', t->>'hair_color', t->>'eye_color', t->>'nationality',
              array(select jsonb_array_elements_text(t->'languages')), array(select jsonb_array_elements_text(t->'accents')),
              array(select jsonb_array_elements_text(t->'skills')), array(select jsonb_array_elements_text(t->'categories')),
              t->>'experience_level', t->'credits', (t->>'available')::boolean, (t->>'will_travel')::boolean);
      insert into public.on_talent_private (profile_id,phone,contact_email,guardian_name,guardian_phone)
      values ((p->>'id')::uuid,
              case when (p->>'minor')::boolean then null else p->>'phone' end, em,
              case when (p->>'minor')::boolean then 'Test Parent' end,
              case when (p->>'minor')::boolean then p->>'phone' end);
      insert into public.on_media (profile_id,kind,path,mime,width,height,bytes,position)
      select (p->>'id')::uuid, case when n=1 then 'headshot' else 'photo' end, (p->>'id')||'/'||n||'.jpg', 'image/jpeg', 800, 1000, 60000, n-1
      from generate_series(1,3) n;
    end if;
  end loop;
end $$;
"""


if __name__ == "__main__":
    main()
