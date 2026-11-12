import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { RadarService } from "./radar.service";
@ApiTags("public")
@Controller()
export class PublicController {
  constructor(private readonly radar: RadarService) {}
  @Get("health") health() {
    return { ok: true };
  }
  @Get("status")
  @ApiOperation({ summary: "Última tentativa e último relatório publicado" })
  status() {
    return this.radar.status();
  }
  @Get("reports/latest") latest() {
    return this.radar.latest();
  }
  @Get("reports") @ApiQuery({ name: "page", required: false }) reports(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 10,
  ) {
    return this.radar.reports(page, limit);
  }
  @Get("companies") companies() {
    return this.radar.companies();
  }
  @Get("companies/:slug") company(@Param("slug") slug: string) {
    return this.radar.company(slug);
  }
  @Get("events") events(@Query() query: Record<string, string>) {
    return this.radar.events(query);
  }
}
