export interface CountryMetric {
  id: string;
  code: string;
  name: string;
  value: number;
}

const FALLBACK_HIGHLIGHTS: CountryMetric[] = [
  { id: 'GB', code: 'GBR', name: 'United Kingdom', value: 62 },
  { id: 'IN', code: 'IND', name: 'India', value: 88 },
  { id: 'US', code: 'USA', name: 'United States', value: 94 },
  { id: 'JP', code: 'JPN', name: 'Japan', value: 51 },
  { id: 'FR', code: 'FRA', name: 'France', value: 46 },
];

const normalizeCode = (code: string): string => code.trim().toUpperCase();

export const normalizeCountryMetrics = (
  rows: Array<{ cca2?: string; cca3?: string; name?: { common?: string } }>,
): CountryMetric[] =>
  rows
    .map((row, index) => {
      const code3 = normalizeCode(row.cca3 || '');
      const code2 = normalizeCode(row.cca2 || code3.slice(0, 2));
      const name = row.name?.common?.trim() || code3 || `Country ${index + 1}`;
      const deterministicValue = ((index * 37 + code3.length * 11) % 99) + 1;

      return {
        id: code2 || code3,
        code: code3 || code2,
        name,
        value: deterministicValue,
      };
    })
    .filter((metric) => metric.id && metric.code);

export const fetchCountryMetrics = async (signal?: AbortSignal): Promise<CountryMetric[]> => {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,cca3,name', {
      signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`RESTcountries failure (${response.status})`);
    }

    const rows = (await response.json()) as Array<{ cca2?: string; cca3?: string; name?: { common?: string } }>;
    const normalized = normalizeCountryMetrics(rows);

    if (normalized.length === 0) {
      return FALLBACK_HIGHLIGHTS;
    }

    return normalized;
  } catch {
    return FALLBACK_HIGHLIGHTS;
  }
};

export const KEY_COUNTRY_CODES = new Set(['GBR', 'IND', 'USA', 'JPN', 'FRA']);
