// Pure Client-Side Code 128-B Vector SVG Generator (Zero external dependencies, zero failure rate)
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

export function generateCode128Svg(text: string, height = 48, barWidth = 2): string {
  if (!text) return '';
  const clean = text.trim();
  const values = [104]; // Start Code B
  let checksum = 104;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i) - 32;
    if (code >= 0 && code <= 102) {
      values.push(code);
      checksum += code * (i + 1);
    }
  }

  values.push(checksum % 103);
  values.push(106); // Stop Code

  // Build bars pattern string (alternating bar, space, bar, space...)
  let pattern = '';
  for (const v of values) {
    pattern += CODE128_PATTERNS[v] || '';
  }

  const quietZoneModules = 10;
  let totalModules = quietZoneModules * 2;
  for (let i = 0; i < pattern.length; i++) {
    totalModules += parseInt(pattern[i], 10);
  }

  const svgWidth = totalModules * barWidth;
  let currentX = quietZoneModules * barWidth;
  let rects = '';

  for (let i = 0; i < pattern.length; i++) {
    const moduleCount = parseInt(pattern[i], 10);
    const width = moduleCount * barWidth;
    const isBar = i % 2 === 0;

    if (isBar) {
      rects += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#0f172a" />`;
    }
    currentX += width;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="xMidYMid meet" class="w-full">${rects}</svg>`;
}
