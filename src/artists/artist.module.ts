import { Module } from '@nestjs/common';
import { ArtistService } from '@/src/artists/artist.service';
import { ArtistController } from '@/src/artists/artist.controller';

@Module({
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
