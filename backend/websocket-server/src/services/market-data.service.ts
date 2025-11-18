import { Server, Socket } from 'socket.io';
import axios from 'axios';
import { logger } from '../utils/logger';

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  high24h: number;
  low24h: number;
  change24h: number;
  changePercent24h: number;
  timestamp: number;
}

export class MarketDataService {
  private io: Server;
  private subscribedSymbols: Map<string, Set<string>> = new Map(); // symbol -> Set of socket IDs
  private marketDataCache: Map<string, MarketData> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 1000; // 1 second

  constructor(io: Server) {
    this.io = io;
  }

  async start(): Promise<void> {
    logger.info('Starting Market Data Service');
    
    // Start periodic market data updates
    this.updateInterval = setInterval(() => {
      this.broadcastMarketData();
    }, this.UPDATE_FREQUENCY);
  }

  async stop(): Promise<void> {
    logger.info('Stopping Market Data Service');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async subscribe(socket: Socket, symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      if (!this.subscribedSymbols.has(symbol)) {
        this.subscribedSymbols.set(symbol, new Set());
      }

      this.subscribedSymbols.get(symbol)!.add(socket.id);
      socket.join(`market:${symbol}`);

      // Send current data immediately
      const currentData = this.marketDataCache.get(symbol);
      if (currentData) {
        socket.emit('market:data', currentData);
      } else {
        // Fetch initial data
        await this.fetchMarketData(symbol);
        const data = this.marketDataCache.get(symbol);
        if (data) {
          socket.emit('market:data', data);
        }
      }
    }
  }

  async unsubscribe(socket: Socket, symbols: string[]): Promise<void> {
    for (const symbol of symbols) {
      const subscribers = this.subscribedSymbols.get(symbol);
      if (subscribers) {
        subscribers.delete(socket.id);
        
        // Clean up if no more subscribers
        if (subscribers.size === 0) {
          this.subscribedSymbols.delete(symbol);
          this.marketDataCache.delete(symbol);
        }
      }

      socket.leave(`market:${symbol}`);
    }
  }

  private async fetchMarketData(symbol: string): Promise<void> {
    try {
      // In production, this would fetch from exchange APIs
      // For now, we'll simulate market data
      const mockData: MarketData = {
        symbol,
        price: Math.random() * 50000 + 10000, // Random price between 10000-60000
        volume: Math.random() * 1000000,
        high24h: Math.random() * 55000 + 10000,
        low24h: Math.random() * 45000 + 10000,
        change24h: Math.random() * 1000 - 500,
        changePercent24h: Math.random() * 10 - 5,
        timestamp: Date.now(),
      };

      this.marketDataCache.set(symbol, mockData);
    } catch (error) {
      logger.error(`Failed to fetch market data for ${symbol}:`, error);
    }
  }

  private async broadcastMarketData(): Promise<void> {
    const symbols = Array.from(this.subscribedSymbols.keys());

    for (const symbol of symbols) {
      try {
        await this.fetchMarketData(symbol);
        const data = this.marketDataCache.get(symbol);

        if (data) {
          this.io.to(`market:${symbol}`).emit('market:data', data);
        }
      } catch (error) {
        logger.error(`Failed to broadcast market data for ${symbol}:`, error);
      }
    }
  }

  // Method to update market data from external source (e.g., exchange webhooks)
  async updateMarketData(symbol: string, data: Partial<MarketData>): Promise<void> {
    const currentData = this.marketDataCache.get(symbol) || {
      symbol,
      price: 0,
      volume: 0,
      high24h: 0,
      low24h: 0,
      change24h: 0,
      changePercent24h: 0,
      timestamp: Date.now(),
    };

    const updatedData: MarketData = {
      ...currentData,
      ...data,
      timestamp: Date.now(),
    };

    this.marketDataCache.set(symbol, updatedData);
    this.io.to(`market:${symbol}`).emit('market:data', updatedData);
  }
}
