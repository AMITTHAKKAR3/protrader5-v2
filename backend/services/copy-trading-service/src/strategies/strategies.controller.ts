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
import { StrategiesService } from './strategies.service';
import { CreateStrategyDto } from './dto/create-strategy.dto';

@ApiTags('strategies')
@ApiBearerAuth()
@Controller('api/v2/copy-trading/strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new trading strategy' })
  create(@Request() req, @Body() createStrategyDto: CreateStrategyDto) {
    return this.strategiesService.create(req.user.userId, createStrategyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all strategies with filters' })
  findAll(@Query() filters: any) {
    return this.strategiesService.findAll(filters);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured strategies' })
  getFeatured() {
    return this.strategiesService.getFeaturedStrategies();
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Get top performing strategies' })
  getTopPerformers() {
    return this.strategiesService.getTopPerformers();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search strategies by name, description, or tags' })
  search(@Query('q') searchTerm: string) {
    return this.strategiesService.searchStrategies(searchTerm);
  }

  @Get('my-strategies')
  @ApiOperation({ summary: 'Get strategies created by current user' })
  getMyStrategies(@Request() req) {
    return this.strategiesService.findByTrader(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get strategy by ID' })
  findOne(@Param('id') id: string) {
    return this.strategiesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update strategy' })
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updates: Partial<CreateStrategyDto>,
  ) {
    return this.strategiesService.update(req.user.userId, id, updates);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update strategy status' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.strategiesService.updateStatus(req.user.userId, id, body.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete strategy' })
  delete(@Request() req, @Param('id') id: string) {
    return this.strategiesService.delete(req.user.userId, id);
  }
}
