export function exportTableToExcel(table: HTMLElement, filename: string) {
  // Клонируем таблицу для обработки
  const clonedTable = table.cloneNode(true) as HTMLElement;
  
  // Получаем стили из оригинальной таблицы
  const originalCells = Array.from(table.querySelectorAll('th, td'));
  const clonedCells = Array.from(clonedTable.querySelectorAll('th, td'));
  
  // Применяем инлайн-стили на основе классов из оригинала
  clonedCells.forEach((cell, index) => {
    const originalCell = originalCells[index];
    if (originalCell) {
      const computedStyle = window.getComputedStyle(originalCell);
      const bgColor = computedStyle.backgroundColor;
      const color = computedStyle.color;
      const fontWeight = computedStyle.fontWeight;
      
      (cell as HTMLElement).style.backgroundColor = bgColor;
      (cell as HTMLElement).style.color = color;
      (cell as HTMLElement).style.fontWeight = fontWeight;
      (cell as HTMLElement).style.border = '1px solid #ddd';
      (cell as HTMLElement).style.padding = '8px';
    }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>${clonedTable.outerHTML}</body>
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
    .map((id) => {
      const table = document.querySelector(id);
      if (!table) return "";
      
      // Клонируем таблицу для обработки
      const clonedTable = table.cloneNode(true) as HTMLElement;
      
      // Получаем стили из оригинальной таблицы
      const originalCells = Array.from(table.querySelectorAll('th, td'));
      const clonedCells = Array.from(clonedTable.querySelectorAll('th, td'));
      
      // Применяем инлайн-стили на основе классов из оригинала
      clonedCells.forEach((cell, index) => {
        const originalCell = originalCells[index];
        if (originalCell) {
          const computedStyle = window.getComputedStyle(originalCell);
          const bgColor = computedStyle.backgroundColor;
          const color = computedStyle.color;
          const fontWeight = computedStyle.fontWeight;
          
          (cell as HTMLElement).style.backgroundColor = bgColor;
          (cell as HTMLElement).style.color = color;
          (cell as HTMLElement).style.fontWeight = fontWeight;
          (cell as HTMLElement).style.border = '1px solid #ddd';
          (cell as HTMLElement).style.padding = '8px';
        }
      });
      
      return clonedTable.outerHTML;
    })
    .filter(Boolean)
    .join("<br><br>");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; margin-bottom: 20px; }
    td, th { border: 1px solid #ddd; padding: 8px; }
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
