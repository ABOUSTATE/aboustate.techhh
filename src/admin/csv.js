const COLUMNS = [
  "Timestamp",
  "Type",
  "Name",
  "Email",
  "Phone",
  "Project Description",
  "Timeline",
  "Student Project",
  "Services",
  "Other Service Description",
  "Status",
  "Notes",
];

function escapeCsvValue(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportLeadsToCsv(leads, filename = "leads.csv") {
  const rows = [
    COLUMNS.join(","),
    ...leads.map((lead) => COLUMNS.map((col) => escapeCsvValue(lead[col])).join(",")),
  ];
  const csv = rows.join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
