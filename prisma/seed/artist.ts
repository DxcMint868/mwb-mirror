import { PrismaClient } from '../../generated/prisma/client';

export async function seedArtists(prisma: PrismaClient) {
  const artists = [
    {
      id: 'bntvvw5s6qxssmuys3xbggvu',
      fullName: 'Veeraya',
      avatarUrl:
        'https://muwow-assets.sgp1.cdn.digitaloceanspaces.com/artist-avatar/veeraya-bw.webp',
      description:
        'Visionary artist specializing in mystical illustration and cosmic animation',
      specialties: ['Illustrated Animation', 'Mixed-media Drawing'],
    },
    {
      id: 'j10ym87hxd5fmqa1mtecy3cd',
      fullName: 'Teerath',
      avatarUrl:
        'https://muwow-assets.sgp1.cdn.digitaloceanspaces.com/artist-avatar/teerath-bw.webp',
      description:
        'Visionary artist specializing in abstract painting and ceramic art',
      specialties: ['Abstract Painting', 'Ceramic'],
    },
    {
      id: 'exe7hfwrdhcicbk38i4yj8ya',
      fullName: 'Krilas',
      avatarUrl:
        'https://muwow-assets.sgp1.cdn.digitaloceanspaces.com/artist-avatar/krilas-bw.webp',
      description:
        'Visionary artist specializing in hand-knitting and yarn-crafted art',
      specialties: ['Hand-Knitting', 'Yarn-Crafted'],
    },
  ];

  for (const artistData of artists) {
    const artist = await prisma.artist.upsert({
      where: { id: artistData.id },
      update: {
        ...artistData,
      },
      create: {
        ...artistData,
      },
    });
    console.log(
      `Created/Updated artist: ${artist.fullName} (ID: ${artist.id})`,
    );
  }
}
