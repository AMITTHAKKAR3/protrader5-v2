import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('api/v2/copy-trading/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Subscribe to a trading strategy' })
  create(@Request() req, @Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(req.user.userId, createSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  findAll(@Request() req, @Query() filters: any) {
    return this.subscriptionsService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.findOne(req.user.userId, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update subscription status' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.subscriptionsService.updateStatus(req.user.userId, id, body.status);
  }

  @Put(':id/settings')
  @ApiOperation({ summary: 'Update subscription settings' })
  updateSettings(
    @Request() req,
    @Param('id') id: string,
    @Body() settings: any,
  ) {
    return this.subscriptionsService.updateSettings(req.user.userId, id, settings);
  }

  @Put(':id/copy-ratio')
  @ApiOperation({ summary: 'Update copy ratio' })
  updateCopyRatio(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { copyRatio: number },
  ) {
    return this.subscriptionsService.updateCopyRatio(req.user.userId, id, body.copyRatio);
  }
}
