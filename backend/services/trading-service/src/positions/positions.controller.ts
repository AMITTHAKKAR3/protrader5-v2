import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PositionsService } from './positions.service';

@ApiTags('positions')
@ApiBearerAuth()
@Controller('api/v2/trading/positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all positions' })
  getAllPositions(@Request() req, @Query('isOpen') isOpen?: boolean) {
    return this.positionsService.getAllPositions(req.user.userId, isOpen);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by ID' })
  getPositionById(@Request() req, @Param('id') id: string) {
    return this.positionsService.getPositionById(req.user.userId, id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close position (full or partial)' })
  closePosition(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { quantity?: number },
  ) {
    return this.positionsService.closePosition(req.user.userId, id, body.quantity);
  }

  @Post('close-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close all open positions' })
  closeAllPositions(@Request() req) {
    return this.positionsService.closeAllPositions(req.user.userId);
  }

  @Put(':id/sl-tp')
  @ApiOperation({ summary: 'Update stop loss and take profit' })
  updateStopLossTakeProfit(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { stopLoss?: number; takeProfit?: number },
  ) {
    return this.positionsService.updateStopLossTakeProfit(
      req.user.userId,
      id,
      body.stopLoss,
      body.takeProfit,
    );
  }
}
