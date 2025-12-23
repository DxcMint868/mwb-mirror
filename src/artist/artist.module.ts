import { Module } from '@nestjs/common';
import { ArtistService } from '@/src/artist/artist.service';
import { ArtistController } from '@/src/artist/artist.controller';

@Module({
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
