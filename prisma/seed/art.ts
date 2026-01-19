import { PrismaClient } from '../../generated/prisma/client';
import { generatedId } from './utils/id';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { exit } from 'process';
import sharp from 'sharp';
import 'dotenv/config';
import fs from 'fs-extra';
import path from 'path';

const BUCKET = process.env.SPACES_BUCKET;
if (!BUCKET) {
  throw new Error('SPACES_BUCKET is not set');
}
const REGION = process.env.SPACES_REGION;
if (!REGION) {
  throw new Error('SPACES_REGION is not set');
}
const ENDPOINT = `https://${REGION}.digitaloceanspaces.com`;
const CDN_BASE = `https://${BUCKET}.${REGION}.cdn.digitaloceanspaces.com`;

const accessKeyId = process.env.SPACES_ACCESS_KEY_ID;
if (!accessKeyId) {
  throw new Error('ACCESS_KEY_ID is not set');
}
const secretKey = process.env.SPACES_SECRET_KEY;
if (!secretKey) {
  throw new Error('SECRET_KEY is not set');
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId,
    secretAccessKey: secretKey,
  },
});

/**
 * List all image URLs from a folder in the bucket
 */
async function listImagesFromFolder(
  folder: string = 'card-images-staging',
): Promise<string[]> {
  console.log(`Listing images from folder: ${folder}...`);

  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `${folder}/`,
  });

  const response = await s3.send(command);
  const imageUrls = (response.Contents || [])
    .filter((obj) => obj.Key && obj.Key.endsWith('.webp'))
    .map((obj) => `${CDN_BASE}/${obj.Key}`);

  console.log(`Found ${imageUrls.length} existing images in ${folder}`);
  return imageUrls;
}

/**
 * Delete all images in a folder
 */
async function deleteImagesInFolder(
  folder: string = 'card-images-staging',
): Promise<void> {
  console.log(`Deleting all images from folder: ${folder}...`);

  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `${folder}/`,
  });

  const response = await s3.send(listCommand);
  const objects = response.Contents || [];

  if (objects.length === 0) {
    console.log(`No images to delete in ${folder}`);
    return;
  }

  console.log(`Deleting ${objects.length} objects from ${folder}...`);

  // Delete in parallel
  await Promise.all(
    objects.map((obj) =>
      s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: obj.Key,
        }),
      ),
    ),
  );

  console.log(`Deleted ${objects.length} objects from ${folder}`);
}

async function uploadFile(
  localPath: string,
  fileAlias: string,
  folder: string = 'card-images-staging',
) {
  const input = await fs.readFile(localPath);
  const webpBuffer = await sharp(input)
    .webp({ quality: 85, effort: 6 })
    .toBuffer();
  const envSuffix =
    process.env.NODE_ENV === 'production' ? 'production' : 'staging';
  if (!folder) {
    folder = `card-images-${envSuffix}`;
    console.warn(`Folder is not specified, using default folder: ${folder}`);
  }

  const basename = path.basename(localPath);
  const key = `${folder}/${fileAlias}.webp`;

  console.log(`Uploading ${basename} -> ${key}...`);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: webpBuffer,
      ACL: 'public-read',
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return `${CDN_BASE}/${key}`;
}

const getFilesFromFolder = async (
  folderPath: string,
  aliasToPath: Map<string, string>,
) => {
  const folderBaseName = path.basename(folderPath);
  const [, artistName] = folderBaseName.split('-');

  const files = await fs.readdir(folderPath);
  const aliases: string[] = [];
  for (const fileName of files) {
    if (fileName.endsWith('.DS_Store')) continue;

    const localPath = path.join(folderPath, fileName);
    let fileAlias = generatedId();
    while (aliasToPath.has(fileAlias)) {
      fileAlias = generatedId();
    }
    aliasToPath.set(fileAlias, localPath);
    aliases.push(fileAlias);
  }
  return { aliases, artistName };
};

/**
 * Seed arts from existing CDN images (no reupload)
 */
async function seedArtsFromCdn(
  prisma: PrismaClient,
  folder: string = 'card-images-staging',
) {
  console.log('\n=== MODE: Seeding from existing CDN images ===\n');

  const imageUrls = await listImagesFromFolder(folder);

  if (imageUrls.length === 0) {
    console.warn('No images found in CDN. Run with isReuploadMode=true first.');
    return;
  }

  // For simplicity, assign all images to the first artist
  // You can customize this logic to map images to specific artists
  const artist = await prisma.artist.findFirst();
  if (!artist) {
    console.error('No artist found. Please seed artists first.');
    exit(1);
  }

  console.log(
    `Creating ${imageUrls.length} arts for artist ${artist.fullName}...`,
  );

  const arts = await prisma.art.createMany({
    data: imageUrls.map((imageUrl) => ({
      imageUrl,
      artistId: artist.id,
    })),
    skipDuplicates: true,
  });

  console.log(`Finished creating ${arts.count} arts from CDN images.`);
}

/**
 * Seed arts by uploading local images (reupload mode)
 */
async function seedArtsByUpload(prisma: PrismaClient) {
  console.log('\n=== MODE: Reuploading local images ===\n');

  const folder = 'card-images-staging';

  // Delete existing images in the folder
  await deleteImagesInFolder(folder);

  const aliasToPath = new Map<string, string>();
  const folderPaths = [
    '/Users/minhduc868/Desktop/muwow/cards-veeraya-SWEETY',
    '/Users/minhduc868/Desktop/muwow/cards-teerath-ALL_I_SEE',
    '/Users/minhduc868/Desktop/muwow/cards-krilas-IMONO',
    '/Users/minhduc868/Desktop/muwow/cards-teerath-CRAZY_DAISY',
  ];

  for (const folderPath of folderPaths) {
    let { aliases, artistName } = await getFilesFromFolder(
      folderPath,
      aliasToPath,
    );
    const artist = await prisma.artist.findFirst({
      where: { fullName: artistName.replace(/\b\w/g, (c) => c.toUpperCase()) }, // capitalize first letter
    });
    if (!artist) {
      console.error(`Artist ${artistName} not found. Aborting...`);
      exit(1);
    }

    const uploadPromises = aliases.map(async (alias) => {
      const localPath = aliasToPath.get(alias)!;
      return await uploadFile(localPath, alias, folder);
    });
    console.log(
      `Async uploading ${aliases.length} images for artist ${artistName}...`,
    );
    const imageUrls = await Promise.all(uploadPromises);
    console.log(
      `Finished uploading ${aliases.length} images for artist ${artistName}.`,
    );
    console.log(
      `Creating ${imageUrls.length} arts for artist ${artistName}...`,
    );
    const arts = await prisma.art.createMany({
      data: imageUrls.map((imageUrl) => ({
        imageUrl,
        artistId: artist.id,
      })),
    });
    console.log(
      `Finished creating ${arts.count} arts for artist ${artistName}.`,
    );
  }
}

/**
 * Main seed function with toggle mode
 * @param prisma - Prisma client
 * @param isReuploadMode - If true, delete and reupload images. If false, use existing CDN images.
 */
export async function seedArts(
  prisma: PrismaClient,
  options: {
    isReuploadMode: boolean,
  }
) {
  if (options.isReuploadMode) {
    await seedArtsByUpload(prisma);
  } else {
    await seedArtsFromCdn(prisma);
  }
}
