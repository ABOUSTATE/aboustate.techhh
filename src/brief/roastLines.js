// Playful, low-stakes callbacks based on what the client actually submitted.
// Falls back to a generic line if nothing matches — never references a field
// that wasn't filled in.
export function getRoastLine(values) {
  const name = values.contact_name ? values.contact_name.split(" ")[0] : null;
  const services = Array.isArray(values.service) ? values.service : [];

  if (values.budget_range === "Not sure yet") {
    return "Budget: “not sure yet.” Bold strategy. We'll help you find out.";
  }
  if (values.budget_range === "Under $5k" && services.length >= 3) {
    return `${services.length} services, under $5k. We admire the ambition.`;
  }
  if (values.timeline_field === "ASAP" || values.deadline_flexible === "fixed") {
    return "Tight deadline, fixed date — our favorite kind of Tuesday.";
  }
  if (values.deadline_flexible === "open") {
    return "No fixed date. We'll believe that lasts right up until it doesn't.";
  }
  if (services.length >= 4) {
    return "You selected almost everything. We like where your head's at.";
  }
  if (name) {
    return `Got it, ${name} — this looks like a real brief, not a napkin sketch.`;
  }
  return "Brief received. Refreshingly specific, as far as briefs go.";
}
