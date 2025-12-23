import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ArtistService } from './artist.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async getArtist(@Param('id') id: string) {
    return this.artistService.getArtist(id);
  }
}
