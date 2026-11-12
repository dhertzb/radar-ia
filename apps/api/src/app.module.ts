import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { PublicController } from "./public.controller";
import { IngestController } from "./ingest.controller";
import { RadarService } from "./radar.service";
@Module({
  controllers: [PublicController, IngestController],
  providers: [PrismaService, RadarService],
})
export class AppModule {}
