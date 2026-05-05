import type { RegexFlags } from '../types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExampleEntry {
  id: string;
  label: string;
  description: string;
  pattern: string;
  flags: Partial<RegexFlags>;
  sampleText: string;
}

export interface ExampleCategory {
  id: string;
  label: string;
  examples: ExampleEntry[];
}

// ─── Categories ───────────────────────────────────────────────────────────────

const identifiers: ExampleCategory = {
  id: 'cat-identifiers',
  label: 'Identifiers',
  examples: [
    {
      id: 'id-email',
      label: 'Email address',
      description: 'Matches standard email addresses',
      pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
      flags: {},
      sampleText: 'user@example.com, bad@, admin@corp.org, support+team@company.co.uk',
    },
    {
      id: 'id-uuid',
      label: 'UUID v4',
      description: 'RFC 4122 UUID version 4',
      pattern: '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
      flags: { caseInsensitive: true },
      sampleText: '550e8400-e29b-41d4-a716-446655440000 and 6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    },
    {
      id: 'id-ssn',
      label: 'US Social Security Number',
      description: 'SSN in NNN-NN-NNNN format',
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
      flags: {},
      sampleText: 'SSN: 123-45-6789. Invalid: 000-00-0000',
    },
    {
      id: 'id-phone-us',
      label: 'US phone number',
      description: 'Matches (NNN) NNN-NNNN or NNN-NNN-NNNN',
      pattern: '\\(?\\d{3}\\)?[\\s\\-]\\d{3}[\\s\\-]\\d{4}',
      flags: {},
      sampleText: 'Call (555) 123-4567 or 800-555-0100 today.',
    },
    {
      id: 'id-ip4',
      label: 'IPv4 address',
      description: 'Dotted-decimal IPv4 notation',
      pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
      flags: {},
      sampleText: 'Hosts: 192.168.1.1, 10.0.0.255, gateway 172.16.254.1',
    },
    {
      id: 'id-credit-card',
      label: 'Credit card number',
      description: '16-digit card number with optional spaces/dashes',
      pattern: '\\b(?:\\d[ \\-]?){15}\\d\\b',
      flags: {},
      sampleText: 'Card: 4111 1111 1111 1111 or 4111-1111-1111-1111',
    },
  ],
};

const datesAndTimes: ExampleCategory = {
  id: 'cat-dates',
  label: 'Dates & Times',
  examples: [
    {
      id: 'dt-iso8601',
      label: 'ISO 8601 datetime',
      description: 'Full datetime with optional fractional seconds and Z suffix',
      pattern: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?Z?',
      flags: {},
      sampleText: 'Created: 2024-01-15T09:30:00Z, Updated: 2024-06-01T14:22:11.456Z',
    },
    {
      id: 'dt-iso-date',
      label: 'ISO date (YYYY-MM-DD)',
      description: 'Date-only part of ISO 8601',
      pattern: '\\b\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b',
      flags: {},
      sampleText: 'Shipped 2024-01-15, expires 1999-12-31, invalid 2024-13-01',
    },
    {
      id: 'dt-us',
      label: 'US date (MM/DD/YYYY)',
      description: 'North-American short date format',
      pattern: '\\b(0?[1-9]|1[0-2])\\/(0?[1-9]|[12]\\d|3[01])\\/\\d{4}\\b',
      flags: {},
      sampleText: 'Dates: 01/15/2024, 12/31/1999, 9/5/2023',
    },
    {
      id: 'dt-time24',
      label: '24-hour time (HH:MM[:SS])',
      description: 'Time in 24-hour format with optional seconds',
      pattern: '\\b([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?\\b',
      flags: {},
      sampleText: 'Start: 09:30, end: 23:59:59, invalid: 25:00',
    },
    {
      id: 'dt-epoch',
      label: 'Unix epoch (seconds)',
      description: '10-digit Unix timestamp',
      pattern: '\\b1[0-9]{9}\\b',
      flags: {},
      sampleText: 'ts=1705312200, ts=1700000000, bad: 123456',
    },
  ],
};

const numbersAndCurrency: ExampleCategory = {
  id: 'cat-numbers',
  label: 'Numbers & Currency',
  examples: [
    {
      id: 'num-integer',
      label: 'Integer (positive or negative)',
      description: 'Whole number, optional leading minus',
      pattern: '-?\\b\\d+\\b',
      flags: {},
      sampleText: 'Values: 42, -7, 0, 1000000, -999',
    },
    {
      id: 'num-decimal',
      label: 'Decimal number',
      description: 'Number with a decimal point',
      pattern: '-?\\d+\\.\\d+',
      flags: {},
      sampleText: 'Prices: 3.14, -0.5, 100.00, 9.99',
    },
    {
      id: 'num-currency-usd',
      label: 'USD currency',
      description: 'Dollar sign followed by formatted number',
      pattern: '\\$\\s?\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?',
      flags: {},
      sampleText: 'Total: $1,234.56. Subtotal: $99. Tip: $ 0.99',
    },
    {
      id: 'num-percent',
      label: 'Percentage',
      description: 'Number followed by percent sign',
      pattern: '\\d+(?:\\.\\d+)?%',
      flags: {},
      sampleText: 'Completion: 99%, growth: 3.5%, discount: 100%',
    },
    {
      id: 'num-scientific',
      label: 'Scientific notation',
      description: 'Floating-point with e/E exponent',
      pattern: '-?\\d+(?:\\.\\d+)?[eE][+\\-]?\\d+',
      flags: {},
      sampleText: 'Mass: 1.5e10 kg, charge: -3.2E-4 C, speed: 2.998e8',
    },
    {
      id: 'num-hex',
      label: 'Hexadecimal value',
      description: '0x-prefixed hex literal',
      pattern: '\\b0[xX][0-9a-fA-F]+\\b',
      flags: {},
      sampleText: 'Color: 0xFF3300, mask: 0x00FF, addr: 0xDEADBEEF',
    },
  ],
};

const webAndNetwork: ExampleCategory = {
  id: 'cat-web',
  label: 'Web & Network',
  examples: [
    {
      id: 'web-url',
      label: 'HTTP/HTTPS URL',
      description: 'Full URL starting with http:// or https://',
      pattern: 'https?:\\/\\/[^\\s<>"{}|\\\\^`[\\]]+',
      flags: {},
      sampleText: 'Visit https://example.com/path?q=1 or http://old.example.org',
    },
    {
      id: 'web-mac',
      label: 'MAC address',
      description: 'Six octets separated by : or -',
      pattern: '([0-9A-Fa-f]{2}[:\\-]){5}[0-9A-Fa-f]{2}',
      flags: {},
      sampleText: 'NIC: 00:1A:2B:3C:4D:5E, device: AA-BB-CC-DD-EE-FF',
    },
    {
      id: 'web-html-tag',
      label: 'HTML tag',
      description: 'Any HTML opening, closing, or self-closing tag',
      pattern: '<[^>]+>',
      flags: {},
      sampleText: '<div class="x"><p>Hello</p><br/></div>',
    },
    {
      id: 'web-query-param',
      label: 'URL query parameter',
      description: 'key=value pair in a query string',
      pattern: '[?&]([\\w.%+\\-]+)=([\\w.%+\\-]*)',
      flags: {},
      sampleText: 'https://api.example.com/search?q=regex&page=2&lang=en',
    },
    {
      id: 'web-jwt',
      label: 'JWT token',
      description: 'Three base64url segments separated by dots',
      pattern: 'eyJ[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+',
      flags: {},
      sampleText: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    },
  ],
};

const dqSentinels: ExampleCategory = {
  id: 'cat-dq',
  label: 'Data Quality Sentinels',
  examples: [
    {
      id: 'dq-null-literal',
      label: 'NULL / null / None / NA literal',
      description: 'Common null-equivalent placeholders in data pipelines',
      pattern: '\\bNULL\\b|\\bnull\\b|\\bNone\\b|\\bNA\\b|\\bN\\/A\\b',
      flags: {},
      sampleText: 'Values: NULL, null, None, NA, N/A, "not null"',
    },
    {
      id: 'dq-whitespace-only',
      label: 'Whitespace-only field',
      description: 'A field that contains only spaces or tabs — effectively empty',
      pattern: '^[ \\t]+$',
      flags: { multiline: true },
      sampleText: '   ',
    },
    {
      id: 'dq-leading-trailing-ws',
      label: 'Leading or trailing whitespace',
      description: 'Detects padding that should have been trimmed',
      pattern: '^\\s+|\\s+$',
      flags: { multiline: true },
      sampleText: '  padded left\nright padded  \n  both  \nnone',
    },
    {
      id: 'dq-repeated-delimiter',
      label: 'Repeated CSV delimiter',
      description: 'Consecutive commas or semicolons indicating empty fields',
      pattern: ',{2,}|;{2,}',
      flags: {},
      sampleText: 'a,,b,,,c;d;;e',
    },
    {
      id: 'dq-control-chars',
      label: 'Control characters (non-printable)',
      description: 'Embedded control bytes that corrupt downstream parsing',
      pattern: '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]',
      flags: {},
      sampleText: 'clean\x01dirty\x07value\x1Bhere',
    },
    {
      id: 'dq-duplicate-words',
      label: 'Duplicate consecutive words',
      description: 'Repeated words (common copy-paste artefact)',
      pattern: '\\b(\\w+)\\s+\\1\\b',
      flags: { caseInsensitive: true },
      sampleText: 'the the quick brown fox fox jumped over the the lazy dog',
    },
  ],
};

const logFormats: ExampleCategory = {
  id: 'cat-logs',
  label: 'Log Formats',
  examples: [
    {
      id: 'log-level',
      label: 'Log level keyword',
      description: 'Standard severity keywords used in most logging frameworks',
      pattern: '\\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|TRACE|CRITICAL)\\b',
      flags: {},
      sampleText: '2024-01-15 ERROR failed to connect\n2024-01-15 INFO server started\n2024-01-15 WARN slow query',
    },
    {
      id: 'log-apache-combined',
      label: 'Apache Combined Log Format',
      description: 'Standard Apache/Nginx access log line',
      pattern: '^(\\S+) \\S+ \\S+ \\[([^\\]]+)\\] "(\\S+) (\\S+) \\S+" (\\d{3}) (\\d+|-)',
      flags: { multiline: true },
      sampleText: '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326\n10.0.0.1 - - [10/Oct/2000:13:56:00 -0700] "POST /login HTTP/1.1" 302 -',
    },
    {
      id: 'log-sap-hana',
      label: 'SAP HANA trace header',
      description: 'HANA indexserver / nameserver trace line prefix',
      pattern: '^\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d+\\]\\s+\\w+\\s+\\(\\w+\\)',
      flags: { multiline: true },
      sampleText: '[2024-01-15 09:30:00.123] INFO (indexserver)\n[2024-01-15 09:30:01.456] ERROR (nameserver)',
    },
    {
      id: 'log-json-field',
      label: 'JSON key-value pair',
      description: 'Matches a quoted key with a primitive JSON value',
      pattern: '"(\\w+)"\\s*:\\s*("[^"]*"|\\d+|true|false|null)',
      flags: {},
      sampleText: '{"id": 42, "active": true, "name": "Alice", "score": null}',
    },
    {
      id: 'log-stacktrace-java',
      label: 'Java stack trace line',
      description: 'Indented at com./org./java. method reference',
      pattern: '^\\s+at [\\w.$]+\\([\\w.$]+\\.java:\\d+\\)',
      flags: { multiline: true },
      sampleText: '    at com.example.Foo.bar(Foo.java:42)',
    },
    {
      id: 'log-http-status',
      label: 'HTTP status code',
      description: '3-digit HTTP response code',
      pattern: '\\b[1-5]\\d{2}\\b',
      flags: {},
      sampleText: 'Responses: 200 OK, 404 Not Found, 500 Internal Server Error, 301 Moved',
    },
  ],
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  identifiers,
  datesAndTimes,
  numbersAndCurrency,
  webAndNetwork,
  dqSentinels,
  logFormats,
];

export const ALL_EXAMPLES: ExampleEntry[] = EXAMPLE_CATEGORIES.flatMap(c => c.examples);
