import {Body,Controller,Headers,HttpCode,Post,UnauthorizedException} from "@nestjs/common";import {ApiBearerAuth,ApiOperation,ApiTags} from "@nestjs/swagger";import {RadarService} from "./radar.service";
@ApiTags("internal") @Controller("internal") export class IngestController{constructor(private readonly radar:RadarService){}
 private auth(value:string|undefined){const expected=process.env.INGEST_TOKEN;if(!expected||value!==`Bearer ${expected}`)throw new UnauthorizedException()}
 @Post("ingest")@HttpCode(201)@ApiBearerAuth()@ApiOperation({summary:"Ingere e publica um relatório de forma transacional"})ingest(@Headers("authorization") auth:string|undefined,@Body() body:unknown){this.auth(auth);return this.radar.ingest(body)}
 @Post("runs")@HttpCode(202)@ApiBearerAuth()@ApiOperation({summary:"Registra início ou falha anterior à publicação"})run(@Headers("authorization") auth:string|undefined,@Body() body:unknown){this.auth(auth);return this.radar.recordRun(body)}
}
