import { PrismaClient } from '../../generated/prisma/client';
import { generatedId } from './utils/id';
import * as fs from 'fs';
import * as path from 'path';

// Year to use for date parsing (can be overridden)
const DEFAULT_YEAR = 2026;

interface CsvRow {
  date: string;
  card: string;
  artist: string;
  zodiacSign: string;
  time: string;
  work: string;
  money: string;
  love: string;
  luck: string;
  health: string;
  luckyNumber: string;
}

interface CardContentData {
  zodiacSign: string;
  work: string;
  money: string;
  love: string;
  luck: string;
  health: string;
  luckyNumber: string;
}

interface CardEntry {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  artId?: string;
  contents: Map<string, CardContentData>; // languageCode -> content
}

/**
 * Parse time string like "06:45 - 08:57 น. (72 นาที)" or "06:45-08:57 น. (120 นาที)"
 * Returns [startHour, startMinute, endHour, endMinute]
 */
function parseTimeRange(timeStr: string): [number, number, number, number] {
  // Remove Thai text and extra spaces, normalize separators
  const cleaned = timeStr
    .replace(/น\./g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Match patterns like "06:45 - 08:57" or "06:45-08:57"
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!match) {
    throw new Error(`Unable to parse time range: "${timeStr}"`);
  }

  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    parseInt(match[4], 10),
  ];
}

/**
 * Parse date string like "1 Feb" or "Feb 2" and return month and day
 */
function parseDateString(dateStr: string): { month: number; day: number } {
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const cleaned = dateStr.trim().toLowerCase();

  // Try "1 Feb" format
  let match = cleaned.match(/^(\d{1,2})\s+([a-z]{3})/);
  if (match) {
    return { day: parseInt(match[1], 10), month: months[match[2]] };
  }

  // Try "Feb 2" format
  match = cleaned.match(/^([a-z]{3})\s+(\d{1,2})/);
  if (match) {
    return { day: parseInt(match[2], 10), month: months[match[1]] };
  }

  throw new Error(`Unable to parse date: "${dateStr}"`);
}

/**
 * Build UTC+7 timestamp from date parts and time
 * Note: We store in UTC but the times in CSV are Bangkok time (UTC+7)
 */
function buildTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Create date in UTC, then adjust for Bangkok timezone (UTC+7)
  // If Bangkok time is 06:45, UTC time is 23:45 of previous day
  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0),
  );
  return utcDate;
}

/**
 * Generate a composite key for Card lookup
 */
function getCardKey(periodStart: Date, periodEnd: Date): string {
  return `${periodStart.toISOString()}|${periodEnd.toISOString()}`;
}

/**
 * Parse a single CSV file and return rows
 */
function parseCsvFile(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Skip header row
  const rows: CsvRow[] = [];
  let currentDate = '';

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (handle quoted fields with commas)
    const fields = parseCsvLine(line);

    // Update current date if this row has a date
    if (fields[0] && fields[0].trim()) {
      currentDate = fields[0].trim();
    }

    // Skip rows without time (empty rows or section dividers)
    const time = fields[4]?.trim();
    if (!time || !currentDate) continue;

    rows.push({
      date: currentDate,
      card: fields[1]?.trim() || '',
      artist: fields[2]?.trim() || '',
      zodiacSign: fields[3]?.trim() || '',
      time: time,
      work: fields[5]?.trim() || '',
      money: fields[6]?.trim() || '',
      love: fields[7]?.trim() || '',
      luck: fields[8]?.trim() || '',
      health: fields[9]?.trim() || '',
      luckyNumber: fields[10]?.trim() || '',
    });
  }

  return rows;
}

/**
 * Parse a CSV line handling quoted fields
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

/**
 * Process CSV files and build card entries
 * @param csvFiles Array of { filePath, languageCode }
 * @param year Year to use for date parsing
 */
export function processCardCsvFiles(
  csvFiles: { filePath: string; languageCode: string }[],
  year: number = DEFAULT_YEAR,
): CardEntry[] {
  // Map to store cards by their time period key
  const cardMap = new Map<string, CardEntry>();

  for (const { filePath, languageCode } of csvFiles) {
    console.log(`Processing CSV file: ${filePath} (language: ${languageCode})`);

    const rows = parseCsvFile(filePath);
    console.log(`  Found ${rows.length} valid rows`);

    for (const row of rows) {
      try {
        // Parse date and time
        const { month, day } = parseDateString(row.date);
        const [startHour, startMinute, endHour, endMinute] = parseTimeRange(
          row.time,
        );

        // Build timestamps
        let periodStart = buildTimestamp(
          year,
          month,
          day,
          startHour,
          startMinute,
        );
        let periodEnd = buildTimestamp(year, month, day, endHour, endMinute);

        // Handle overnight periods (e.g., 23:33-02:21)
        if (
          endHour < startHour ||
          (endHour === startHour && endMinute < startMinute)
        ) {
          // End time is on the next day
          periodEnd = buildTimestamp(year, month, day + 1, endHour, endMinute);
        }

        const cardKey = getCardKey(periodStart, periodEnd);

        // Get or create card entry
        let cardEntry = cardMap.get(cardKey);
        if (!cardEntry) {
          cardEntry = {
            id: generatedId(),
            periodStart,
            periodEnd,
            contents: new Map(),
          };
          cardMap.set(cardKey, cardEntry);
        }

        // Add content for this language
        const contentData: CardContentData = {
          zodiacSign: row.zodiacSign,
          work: row.work,
          money: row.money,
          love: row.love,
          luck: row.luck,
          health: row.health,
          luckyNumber: row.luckyNumber,
        };

        cardEntry.contents.set(languageCode, contentData);
      } catch (error) {
        console.warn(
          `  Skipping row with date="${row.date}", time="${row.time}": ${error}`,
        );
      }
    }
  }

  return Array.from(cardMap.values());
}

/**
 * Seed cards and card contents from processed card entries
 */
export async function seedCardsAndContents(
  prisma: PrismaClient,
  cardEntries: CardEntry[],
) {
  console.log(`\nSeeding ${cardEntries.length} cards...`);

  // Step 1: Batch upsert all cards in a transaction
  const timePerCardMs = 350;
  const startTime = Date.now();
  const upsertedCards = await prisma.$transaction(async (tx) => {
    return Promise.all(cardEntries.map((entry) =>
      tx.card.upsert({
        where: {
          periodStart_periodEnd: {
            periodStart: entry.periodStart,
            periodEnd: entry.periodEnd,
          },
        },
        update: {},
        create: {
          id: entry.id,
          periodStart: entry.periodStart,
          periodEnd: entry.periodEnd,
        },
      }),
    ))
  },
    { timeout: cardEntries.length * timePerCardMs }
  );
  const endTime = Date.now();
  console.log(`  Upserted cards in ${endTime - startTime}ms`);
  console.log(`  Time per card: ${((endTime - startTime) / cardEntries.length).toFixed(2)}ms`);

  // Build a map of periodKey -> actual card ID (in case card already existed with different ID)
  const cardIdMap = new Map<string, string>();
  upsertedCards.forEach((card, index) => {
    const entry = cardEntries[index];
    const key = getCardKey(entry.periodStart, entry.periodEnd);
    cardIdMap.set(key, card.id);
  });

  console.log(`  Upserted ${upsertedCards.length} cards`);

  // Step 2: Nuke all card contents (safe - no FK references to CardContent)
  const deleted = await prisma.cardContent.deleteMany({});
  console.log(`  Deleted ${deleted.count} existing card contents`);

  // Step 3: Build all card content records and insert in one createMany
  const allContents: {
    cardId: string;
    languageCode: string;
    contentJson: object;
  }[] = [];

  for (const entry of cardEntries) {
    const key = getCardKey(entry.periodStart, entry.periodEnd);
    const cardId = cardIdMap.get(key)!;

    for (const [languageCode, contentData] of entry.contents) {
      allContents.push({
        cardId,
        languageCode,
        contentJson: {
          zodiacSign: contentData.zodiacSign,
          work: contentData.work,
          money: contentData.money,
          love: contentData.love,
          luck: contentData.luck,
          health: contentData.health,
          luckyNumber: contentData.luckyNumber,
        },
      });
    }
  }

  const created = await prisma.cardContent.createMany({
    data: allContents,
  });

  console.log(`  Created ${created.count} card contents`);
  console.log(`\nSeeding complete!`);
}

/**
 * Main seed function for cards
 * @param prisma PrismaClient instance
 * @param csvConfigs Array of CSV file configurations
 * @param year Year for date parsing (default: 2026)
 */
export async function seedCards(
  prisma: PrismaClient,
  csvConfigs?: { filePath: string; languageCode: string }[],
  year?: number,
) {
  // Default CSV files if not provided
  const defaultCsvConfigs = [
    // January 2026
    {
      filePath: path.join(__dirname, 'data/card', '1-31_jan_2026_th.csv'),
      languageCode: 'th',
    },
    {
      filePath: path.join(__dirname, 'data/card', '1-31_jan_2026_en.csv'),
      languageCode: 'en',
    },
    // February 2026
    {
      filePath: path.join(__dirname, 'data/card', '1-7_feb_2026_th.csv'),
      languageCode: 'th',
    },
    // Add more language files here as they become available
    // {
    //   filePath: path.join(__dirname, 'card-data', '1-7_feb_2026_en.csv'),
    //   languageCode: 'en',
    // },
  ];

  const configs = csvConfigs || defaultCsvConfigs;
  const cardEntries = processCardCsvFiles(configs, year || DEFAULT_YEAR);
  await seedCardsAndContents(prisma, cardEntries);
}
