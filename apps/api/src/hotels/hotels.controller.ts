import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Controller('admin/hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Post()
  create(@Body() body: CreateHotelDto) {
    return this.hotelsService.create(body);
  }

  @Get()
  list() {
    return this.hotelsService.list();
  }

  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('cover', new DefaultValuePipe(false), ParseBoolPipe) cover: boolean,
  ) {
    return this.hotelsService.addImage(id, file, { cover });
  }
}
