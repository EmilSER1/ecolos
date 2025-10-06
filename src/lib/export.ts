export function exportTableToExcel(table: HTMLElement, filename: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; }
    td, th { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; font-weight: bold; }
  </style>
</head>
<body>${table.outerHTML}</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function exportMultipleTablesToExcel(tableIds: string[], filename: string) {
  const tables = tableIds
    .map((id) => document.querySelector(id))
    .filter(Boolean)
    .map((el) => el?.outerHTML || "")
    .join("<br><br>");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; margin-bottom: 20px; }
    td, th { border: 1px solid #ddd; padding: 8px; }
    th { background-color: #f2f2f2; font-weight: bold; }
  </style>
</head>
<body>${tables}</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}
