type CsvValue = string | number | boolean | null | undefined;

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvValue[][],
) {
  const encode = (value: CsvValue) => {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replaceAll('"', '""')}"`;
  };

  const content = [headers, ...rows]
    .map((row) => row.map(encode).join(','))
    .join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
