import { Artist } from '@/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ArtistService {
  private readonly logger = new Logger(ArtistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getArtist(id: string) {
    this.logger.log(`Getting artist: ${id}`);
    try {
      const artist = await this.prisma.artist.findUnique({
        where: { id },
      });

      if (!artist) {
        throw new NotFoundException(`Artist with id ${id} not found`);
      }

      return artist;
    } catch (error) {
      this.logger.error(`Failed to get artist: ${error}`);
      throw error;
    }
  }
}
