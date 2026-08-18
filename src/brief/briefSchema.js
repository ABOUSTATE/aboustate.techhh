// Data-driven form schema, transcribed from the client-supplied field spec
// (aboustate-briefing-form.html / BRIEF-HANDOFF.md). Field `name`s are the
// exact snake_case keys from that spec and map directly to the JSON payload
// sent to /api/brief/submit and stored in briefs.data.

export const SERVICE_OPTIONS = [
  { value: "media", label: "Media production" },
  { value: "post", label: "Post-production" },
  { value: "brand", label: "Brand identity" },
  { value: "marketing", label: "Digital marketing" },
];

export const CONTACT_SECTION = {
  id: "contact",
  title: "1. Contact & company",
  rows: [
    [
      { name: "contact_name", label: "Full name", type: "text", required: true },
      { name: "contact_role", label: "Role / title", type: "text" },
    ],
    [
      { name: "contact_email", label: "Email", type: "email", required: true },
      { name: "contact_phone", label: "Phone", type: "tel" },
    ],
    [
      { name: "company_name", label: "Company / organization", type: "text" },
      { name: "company_website", label: "Company website", type: "url", placeholder: "https://" },
    ],
    [
      {
        name: "contact_method",
        label: "Preferred contact method",
        type: "select",
        options: ["Email", "Phone", "WhatsApp", "Video call"],
      },
      {
        name: "referral_source",
        label: "How did you hear about us?",
        type: "select",
        options: [
          "Referral / word of mouth",
          "Past client",
          "Search engine",
          "Social media",
          "Industry event",
          "Other",
        ],
      },
    ],
    [
      {
        name: "client_status",
        label: "New or returning client?",
        type: "radio-group",
        options: [
          { value: "new", label: "New client" },
          { value: "returning", label: "Returning client" },
        ],
      },
    ],
    [
      {
        name: "approval_chain",
        label: "Who else is involved in reviewing / approving this project?",
        hint: 'Names, roles, or just "final approval sits with me"',
        type: "textarea",
      },
    ],
  ],
};

export const OVERVIEW_SECTION = {
  id: "overview",
  title: "2. Project overview",
  rows: [
    [{ name: "project_name", label: "Project name / working title", type: "text" }],
    [{ name: "project_summary", label: "One-line summary of the project", type: "text" }],
    [
      {
        name: "project_background",
        label: "Background & context",
        hint: "Why this project, why now",
        type: "textarea",
      },
    ],
    [{ name: "project_goals", label: "Goals / what does success look like", type: "textarea" }],
    [
      {
        name: "target_audience",
        label: "Target audience",
        hint: "Who is this for — demographics, psychographics, market",
        type: "textarea",
      },
    ],
    [{ name: "key_message", label: "Key message / value proposition", type: "textarea" }],
    [{ name: "competitor_references", label: "Competitors or brands to reference", type: "textarea" }],
    [{ name: "dealbreakers", label: "Anything to avoid / dealbreakers", type: "textarea" }],
    [
      {
        name: "has_brand_guidelines",
        label: "Existing brand guidelines?",
        type: "radio-group",
        options: [
          { value: "yes", label: "Yes — link below" },
          { value: "no", label: "No" },
        ],
      },
    ],
    [
      {
        name: "brand_guidelines_link",
        label: "Link to guidelines",
        type: "url",
        placeholder: "Drive, Dropbox, etc.",
      },
    ],
  ],
};

export const MEDIA_SECTION = {
  id: "media",
  serviceKey: "media",
  title: "3.1 Media production",
  rows: [
    [
      {
        name: "media_project_type",
        label: "Project type",
        type: "select",
        options: [
          "Commercial / ad",
          "Brand or documentary film",
          "Corporate / internal video",
          "Event coverage",
          "Music video",
          "Social / short-form content",
          "Other",
        ],
      },
      {
        name: "media_concept_status",
        label: "Concept status",
        type: "select",
        options: [
          "We have a full script",
          "We have a rough concept",
          "We need concept development from you",
          "We have a storyboard / treatment",
        ],
      },
    ],
    [
      {
        name: "media_deliverables",
        label: "Deliverables needed",
        hint: 'e.g. "one 60s hero film + three 15s social cutdowns"',
        type: "textarea",
      },
    ],
    [
      {
        name: "media_aspect_ratio",
        label: "Aspect ratios needed",
        type: "checkbox-group",
        options: ["16:9", "9:16", "1:1", "4:5"].map((v) => ({ value: v, label: v })),
      },
      { name: "media_shoot_days", label: "Number of shoot days (est.)", type: "text" },
      { name: "media_locations_count", label: "Number of locations", type: "text" },
    ],
    [{ name: "media_locations", label: "Shoot location(s)", type: "text" }],
    [
      {
        name: "media_shoot_setting",
        label: "Studio or on-location?",
        type: "select",
        options: ["Studio", "On location", "Both"],
      },
      {
        name: "media_talent_needed",
        label: "Talent needed?",
        type: "select",
        options: [
          "Yes, need casting help",
          "Yes, we'll provide talent",
          "Voiceover only",
          "No talent needed",
        ],
      },
    ],
    [{ name: "media_wardrobe_props", label: "Wardrobe / props / set requirements", type: "textarea" }],
    [
      {
        name: "media_equipment",
        label: "Special equipment needed",
        type: "checkbox-group",
        options: [
          { value: "drone", label: "Drone" },
          { value: "underwater", label: "Underwater" },
          { value: "steadicam", label: "Steadicam / gimbal" },
          { value: "jib", label: "Jib / crane" },
          { value: "none", label: "None known" },
        ],
      },
      {
        name: "media_permits",
        label: "Permits likely required?",
        type: "select",
        options: ["Yes", "No", "Not sure — need guidance"],
      },
    ],
    [
      { name: "media_languages", label: "Language(s) required on screen / audio", type: "text" },
      {
        name: "media_distribution_channels",
        label: "Where will this run?",
        hint: "TV, social, web, out-of-home, internal, etc.",
        type: "text",
      },
    ],
    [{ name: "media_references", label: "Reference videos / links", type: "textarea" }],
  ],
};

export const POST_SECTION = {
  id: "post",
  serviceKey: "post",
  title: "3.2 Post-production",
  rows: [
    [
      {
        name: "post_footage_status",
        label: "Footage status",
        type: "select",
        options: [
          "Already shot — ready to hand off",
          "Shooting soon, need post lined up",
          "Need production and post together",
        ],
      },
      {
        name: "post_raw_footage_volume",
        label: "Amount of raw footage (approx.)",
        type: "text",
        placeholder: "e.g. 4 hours, 200GB",
      },
    ],
    [
      { name: "post_source_format", label: "Source format / codec (if known)", type: "text" },
      {
        name: "post_deliverable_count",
        label: "Number of final deliverables / versions",
        type: "text",
        placeholder: "e.g. 60s main + 30s + 15s cutdowns",
      },
    ],
    [{ name: "post_edit_style_reference", label: "Editing style reference", type: "textarea" }],
    [
      {
        name: "post_needs",
        label: "Needed services",
        type: "checkbox-group",
        options: [
          { value: "color_grading", label: "Color grading" },
          { value: "sound_design", label: "Sound design / mix" },
          { value: "motion_graphics", label: "Motion graphics" },
          { value: "vfx", label: "VFX" },
          { value: "2d_animation", label: "2D animation" },
          { value: "3d_animation", label: "3D animation" },
          { value: "subtitles", label: "Subtitles / captions" },
          { value: "voiceover", label: "Voiceover" },
        ],
      },
    ],
    [
      { name: "post_color_reference", label: "Color grading reference / look", type: "text" },
      {
        name: "post_music_type",
        label: "Music",
        type: "select",
        options: [
          "Licensed track (client to provide or approve)",
          "Original composition needed",
          "Library music is fine",
          "Undecided",
        ],
      },
    ],
    [
      { name: "post_voiceover_notes", label: "Voiceover language / tone (if applicable)", type: "text" },
      {
        name: "post_subtitle_languages",
        label: "Subtitle / caption languages (if applicable)",
        type: "text",
      },
    ],
    [
      {
        name: "post_delivery_specs",
        label: "Delivery formats / specs",
        hint: "Codec, resolution, platform specs if known",
        type: "text",
      },
      { name: "post_revision_rounds", label: "Expected revision rounds", type: "text" },
    ],
    [
      {
        name: "post_archive_handling",
        label: "Raw footage / archive handling",
        type: "select",
        options: [
          "Return all raw media to client",
          "Cloud archive for a defined period",
          "Agency retains, client to request as needed",
          "Not sure yet",
        ],
      },
    ],
  ],
};

export const BRAND_SECTION = {
  id: "brand",
  serviceKey: "brand",
  title: "3.3 Brand identity",
  rows: [
    [
      {
        name: "brand_scope",
        label: "Scope",
        type: "checkbox-group",
        options: [
          { value: "logo", label: "Logo only" },
          { value: "full_identity", label: "Full identity system" },
          { value: "rebrand", label: "Rebrand of existing identity" },
          { value: "guidelines", label: "Brand guidelines document" },
          { value: "naming", label: "Naming" },
          { value: "packaging", label: "Packaging" },
          { value: "tagline", label: "Tagline / messaging" },
        ],
      },
    ],
    [{ name: "brand_background", label: "Company / brand background", type: "textarea" }],
    [{ name: "brand_mission_values", label: "Mission, vision, or values (if defined)", type: "textarea" }],
    [
      {
        name: "brand_existing_assets",
        label: "Existing brand assets?",
        type: "select",
        options: ["None yet — starting fresh", "Some, but inconsistent", "Full kit, needs refresh"],
      },
      { name: "brand_personality", label: "Three words for how the brand should feel", type: "text" },
    ],
    [{ name: "brand_competitors", label: "Competitor brands / what to differentiate from", type: "textarea" }],
    [{ name: "brand_mood_references", label: "Aesthetic references / mood board links", type: "textarea" }],
    [
      { name: "brand_color_preferences", label: "Color preferences or restrictions", type: "text" },
      { name: "brand_type_preferences", label: "Typography preferences", type: "text" },
    ],
    [
      {
        name: "brand_applications",
        label: "Where will the brand be applied?",
        type: "checkbox-group",
        options: [
          { value: "digital", label: "Digital" },
          { value: "print", label: "Print" },
          { value: "packaging", label: "Packaging" },
          { value: "environmental", label: "Environmental / signage" },
          { value: "merch", label: "Merchandise" },
        ],
      },
    ],
    [
      {
        name: "brand_legal_considerations",
        label: "Trademark / legal considerations to be aware of",
        type: "textarea",
      },
    ],
  ],
};

export const MARKETING_SECTION = {
  id: "marketing",
  serviceKey: "marketing",
  title: "3.4 Digital marketing",
  rows: [
    [
      {
        name: "dm_channels",
        label: "Channels needed",
        type: "checkbox-group",
        options: [
          { value: "social_organic", label: "Social (organic)" },
          { value: "paid_social", label: "Paid social" },
          { value: "search_ads", label: "Search / PPC" },
          { value: "seo", label: "SEO" },
          { value: "email", label: "Email marketing" },
          { value: "content", label: "Content / blog" },
          { value: "influencer", label: "Influencer" },
          { value: "pr", label: "PR" },
        ],
      },
    ],
    [
      {
        name: "dm_objective",
        label: "Primary campaign objective",
        type: "select",
        options: [
          "Brand awareness",
          "Lead generation",
          "Sales / conversions",
          "Customer retention",
          "Product / campaign launch",
        ],
      },
      {
        name: "dm_current_status",
        label: "Current marketing status",
        type: "select",
        options: [
          "Nothing in place yet",
          "In-house team currently manages it",
          "Previous agency, now switching",
          "We run some, need help scaling",
        ],
      },
    ],
    [{ name: "dm_target_audience", label: "Target audience / personas for this campaign", type: "textarea" }],
    [
      { name: "dm_geo_targeting", label: "Geographic targeting", type: "text" },
      {
        name: "dm_ad_spend",
        label: "Monthly ad spend budget",
        hint: "Separate from agency management fee",
        type: "text",
      },
    ],
    [{ name: "dm_kpis", label: "KPIs / success metrics", type: "textarea" }],
    [
      {
        name: "dm_reporting_frequency",
        label: "Reporting frequency expected",
        type: "select",
        options: ["Weekly", "Bi-weekly", "Monthly", "Quarterly"],
      },
      {
        name: "dm_content_ownership",
        label: "Who creates content assets?",
        type: "select",
        options: ["Agency creates everything", "Client provides assets, agency deploys", "Mixed / case by case"],
      },
    ],
    [
      {
        name: "dm_analytics_setup",
        label: "Existing analytics / tracking in place",
        hint: "GA4, pixels, CRM integrations, etc.",
        type: "textarea",
      },
    ],
    [{ name: "dm_competitor_accounts", label: "Competitor accounts to benchmark against", type: "textarea" }],
  ],
};

export const SERVICE_SECTIONS = [MEDIA_SECTION, POST_SECTION, BRAND_SECTION, MARKETING_SECTION];

export const ASSETS_SECTION = {
  id: "assets",
  title: "4. Assets & access",
  rows: [
    [
      {
        name: "assets_existing_links",
        label: "Existing assets to share",
        hint: "Logos, footage, photography, brand guidelines — paste links",
        type: "textarea",
      },
    ],
    [
      {
        name: "access_needed",
        label: "Access we'll need from you",
        type: "checkbox-group",
        options: [
          { value: "website_cms", label: "Website / CMS" },
          { value: "hosting", label: "Hosting" },
          { value: "social_accounts", label: "Social accounts" },
          { value: "ad_accounts", label: "Ad accounts" },
          { value: "analytics", label: "Analytics" },
          { value: "none", label: "None expected" },
        ],
      },
    ],
    [
      { name: "approvals_contact", label: "Point of contact for approvals", type: "text" },
      {
        name: "file_sharing_preference",
        label: "File sharing preference",
        type: "select",
        options: ["Google Drive", "Dropbox", "WeTransfer", "Other"],
      },
    ],
  ],
};

export const TIMELINE_SECTION = {
  id: "timeline",
  title: "5. Timeline & milestones",
  rows: [
    [
      { name: "timeline_kickoff_date", label: "Desired kickoff date", type: "date" },
      { name: "timeline_deadline_date", label: "Hard launch / deadline date", type: "date" },
    ],
    [
      {
        name: "deadline_flexible",
        label: "Is the deadline flexible?",
        type: "radio-group",
        options: [
          { value: "fixed", label: "Fixed — tied to an external event" },
          { value: "flexible", label: "Somewhat flexible" },
          { value: "open", label: "No fixed date" },
        ],
      },
    ],
    [
      {
        name: "timeline_milestones",
        label: "Key milestone dates",
        hint: "Concept approval, shoot date, delivery, launch, etc.",
        type: "textarea",
      },
    ],
    [
      {
        name: "timeline_external_dates",
        label: "Any fixed external dates driving this?",
        hint: "Event, campaign, PR embargo, fiscal deadline",
        type: "text",
      },
    ],
  ],
};

export const BUDGET_SECTION = {
  id: "budget",
  title: "6. Budget & commercial",
  rows: [
    [
      {
        name: "budget_range",
        label: "Overall budget range",
        type: "select",
        options: ["Under $5k", "$5k – $15k", "$15k – $40k", "$40k – $100k", "$100k+", "Not sure yet"],
      },
      {
        name: "budget_status",
        label: "Is this budget approved or an estimate?",
        type: "select",
        options: ["Approved", "Estimate / pending approval", "Need agency to help build the case"],
      },
    ],
    [
      {
        name: "payment_terms_preference",
        label: "Payment terms preference",
        type: "text",
        placeholder: "e.g. 50/50, net 30",
      },
      {
        name: "procurement_process",
        label: "Procurement / PO process",
        type: "select",
        options: ["PO required before work starts", "Standard invoicing, no PO", "Not sure — need guidance"],
      },
    ],
  ],
};

export const LEGAL_SECTION = {
  id: "legal",
  title: "7. Legal & admin",
  rows: [
    [
      {
        name: "nda_required",
        label: "NDA required before details are shared further?",
        type: "radio-group",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      },
      {
        name: "confidentiality_level",
        label: "Confidentiality level",
        type: "select",
        options: ["Standard", "Sensitive — limited internal distribution", "Embargoed / under wraps until launch"],
      },
    ],
    [
      {
        name: "usage_rights_notes",
        label: "Usage rights needed",
        hint: "Where will the work run, for how long, which media/geographies",
        type: "textarea",
      },
    ],
    [
      { name: "music_licensing_budget", label: "Music licensing budget (if applicable)", type: "text" },
      {
        name: "talent_release_needed",
        label: "Talent releases needed?",
        type: "select",
        options: ["Yes", "No", "Not applicable"],
      },
    ],
    [
      {
        name: "permits_insurance_responsibility",
        label: "Who is responsible for permits / insurance?",
        type: "select",
        options: ["Agency handles it", "Client handles it", "To be discussed"],
      },
    ],
  ],
};

export const FINAL_SECTION = {
  id: "final",
  title: "8. Final notes",
  rows: [
    [{ name: "final_reference_links", label: "Reference / inspiration links not covered above", type: "textarea" }],
    [
      {
        name: "final_attachments_links",
        label: "Attachments",
        hint: "Paste links to any briefs, decks, or files",
        type: "textarea",
      },
    ],
    [{ name: "final_notes", label: "Anything else we should know", type: "textarea" }],
  ],
};

export const STATIC_SECTIONS = [
  CONTACT_SECTION,
  OVERVIEW_SECTION,
  ASSETS_SECTION,
  TIMELINE_SECTION,
  BUDGET_SECTION,
  LEGAL_SECTION,
  FINAL_SECTION,
];
