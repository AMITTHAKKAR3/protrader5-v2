import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlgorithmsService } from './algorithms.service';
import { CreateAlgorithmDto } from './dto/create-algorithm.dto';
import { RunBacktestDto } from './dto/run-backtest.dto';

@ApiTags('algorithms')
@ApiBearerAuth()
@Controller('api/v2/algo-trading/algorithms')
export class AlgorithmsController {
  constructor(private readonly algorithmsService: AlgorithmsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trading algorithm' })
  create(@Request() req, @Body() createAlgorithmDto: CreateAlgorithmDto) {
    return this.algorithmsService.create(req.user.userId, createAlgorithmDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all algorithms for current user' })
  findAll(@Request() req, @Query() filters: any) {
    return this.algorithmsService.findAll(req.user.userId, filters);
  }

  @Get('public')
  @ApiOperation({ summary: 'Get public algorithms' })
  getPublic() {
    return this.algorithmsService.getPublicAlgorithms();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get algorithm by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.algorithmsService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update algorithm' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updates: Partial<CreateAlgorithmDto>,
  ) {
    return this.algorithmsService.update(req.user.userId, id, updates);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update algorithm status' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.algorithmsService.updateStatus(req.user.userId, id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete algorithm' })
  delete(@Request() req, @Param('id') id: string) {
    return this.algorithmsService.delete(req.user.userId, id);
  }

  @Post(':id/backtest')
  @ApiOperation({ summary: 'Run backtest for algorithm' })
  runBacktest(
    @Request() req,
    @Param('id') id: string,
    @Body() backtestDto: RunBacktestDto,
  ) {
    return this.algorithmsService.runBacktest(req.user.userId, id, backtestDto);
  }

  @Get(':id/backtests')
  @ApiOperation({ summary: 'Get all backtests for algorithm' })
  getBacktests(@Request() req, @Param('id') id: string) {
    return this.algorithmsService.getBacktests(req.user.userId, id);
  }

  @Get('backtests/:backtestId')
  @ApiOperation({ summary: 'Get backtest by ID' })
  getBacktest(@Request() req, @Param('backtestId') backtestId: string) {
    return this.algorithmsService.getBacktest(req.user.userId, backtestId);
  }
}
