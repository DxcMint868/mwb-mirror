import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ArtistService } from '@/src/artist/artist.service';
import { ClerkAuthGuard } from '@/src/auth/clerk-auth.guard';

@Controller('artists')
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  async getArtist(@Param('id') id: string) {
    return this.artistService.getArtist(id);
  }
}
