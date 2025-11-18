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
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('api/v2/trading/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  placeOrder(@Request() req, @Body() placeOrderDto: PlaceOrderDto) {
    return this.ordersService.placeOrder(req.user.userId, placeOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with filters' })
  getAllOrders(@Request() req, @Query() filters: any) {
    return this.ordersService.getAllOrders(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modify pending order' })
  modifyOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() updates: Partial<PlaceOrderDto>,
  ) {
    return this.ordersService.modifyOrder(req.user.userId, id, updates);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel pending order' })
  cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.userId, id);
  }
}
