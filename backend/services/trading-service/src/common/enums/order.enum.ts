export enum OrderType {
  MARKET = 'Market',
  LIMIT = 'Limit',
  STOP_LOSS = 'StopLoss',
  STOP_LIMIT = 'StopLimit',
  TRAILING_STOP = 'TrailingStop',
  OCO = 'OCO', // One-Cancels-Other
  ICEBERG = 'Iceberg',
  TWAP = 'TWAP', // Time-Weighted Average Price
  VWAP = 'VWAP', // Volume-Weighted Average Price
  BRACKET = 'Bracket',
  FILL_OR_KILL = 'FillOrKill',
  IMMEDIATE_OR_CANCEL = 'ImmediateOrCancel',
}

export enum TradeType {
  BUY = 'Buy',
  SELL = 'Sell',
}

export enum ProductType {
  INTRADAY = 'Intraday',
  LONG_TERM = 'LongTerm',
  MARGIN = 'Margin',
}

export enum OrderStatus {
  PENDING = 'Pending',
  EXECUTED = 'Executed',
  PARTIALLY_FILLED = 'PartiallyFilled',
  CANCELLED = 'Cancelled',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

export enum ExecutionMode {
  IOC = 'IOC', // Immediate or Cancel
  FOK = 'FOK', // Fill or Kill
  GTC = 'GTC', // Good Till Cancelled
  GTD = 'GTD', // Good Till Date
  DAY = 'DAY', // Day Order
}

export enum Exchange {
  NSE = 'NSE',
  BSE = 'BSE',
  MCX = 'MCX',
  NCDEX = 'NCDEX',
  GIFT = 'GIFT',
  SGX = 'SGX',
}
