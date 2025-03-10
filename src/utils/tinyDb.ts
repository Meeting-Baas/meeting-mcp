/**
 * TinyDB - A simple file-based database for tracking bot usage
 * 
 * This module provides a lightweight persistence layer to track bot usage across sessions.
 * It stores recently used bots along with their metadata for enhanced search experiences.
 */

import fs from 'fs';
import path from 'path';

// Interface for bot metadata in our tiny database
export interface BotRecord {
  id: string;                    // Bot UUID
  name?: string;                 // Bot name if available
  meetingUrl?: string;          // URL of the meeting
  meetingType?: string;         // Type of meeting (e.g., "sales", "standup")
  createdAt?: string;           // When the bot/meeting was created
  lastAccessedAt: string;       // When the bot was last accessed by a user
  accessCount: number;          // How many times this bot has been accessed
  creator?: string;             // Who created/requested the bot
  participants?: string[];      // Meeting participants if known
  topics?: string[];            // Key topics discussed in the meeting
  extra?: Record<string, any>;  // Additional metadata from the original API
}

// Main database class
export class TinyDb {
  private dbPath: string;
  private data: {
    recentBots: BotRecord[];
    lastUpdated: string;
  };
  
  constructor(dbFilePath?: string) {
    // Use provided path or default to the project root
    this.dbPath = dbFilePath || path.resolve(process.cwd(), 'bot-history.json');
    
    // Initialize with empty data
    this.data = {
      recentBots: [],
      lastUpdated: new Date().toISOString()
    };
    
    // Try to load existing data
    this.loadFromFile();
  }
  
  // Load database from file
  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const fileContent = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(fileContent);
        console.log(`TinyDB: Loaded ${this.data.recentBots.length} bot records from ${this.dbPath}`);
      } else {
        console.log(`TinyDB: No existing database found at ${this.dbPath}, starting fresh`);
      }
    } catch (error) {
      console.error(`TinyDB: Error loading database:`, error);
      // Continue with empty data
    }
  }
  
  // Save database to file
  private saveToFile(): void {
    try {
      // Update the lastUpdated timestamp
      this.data.lastUpdated = new Date().toISOString();
      
      // Write to file
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
      console.log(`TinyDB: Saved ${this.data.recentBots.length} bot records to ${this.dbPath}`);
    } catch (error) {
      console.error(`TinyDB: Error saving database:`, error);
    }
  }
  
  // Add or update a bot record
  public trackBot(botData: Partial<BotRecord> & { id: string }): BotRecord {
    // Find if bot already exists
    const existingIndex = this.data.recentBots.findIndex(bot => bot.id === botData.id);
    
    if (existingIndex >= 0) {
      // Update existing record
      const existingBot = this.data.recentBots[existingIndex];
      
      // Preserve existing data while updating with new data
      const updatedBot: BotRecord = {
        ...existingBot,
        ...botData,
        // Always update these fields
        lastAccessedAt: new Date().toISOString(),
        accessCount: (existingBot.accessCount || 0) + 1,
      };
      
      // Remove from current position
      this.data.recentBots.splice(existingIndex, 1);
      
      // Add to the front (most recent)
      this.data.recentBots.unshift(updatedBot);
      
      // Save changes
      this.saveToFile();
      
      return updatedBot;
    } else {
      // Create new record
      const newBot: BotRecord = {
        ...botData,
        lastAccessedAt: new Date().toISOString(),
        accessCount: 1,
      };
      
      // Add to the front (most recent)
      this.data.recentBots.unshift(newBot);
      
      // Trim the list if it gets too long (keeping most recent 50)
      if (this.data.recentBots.length > 50) {
        this.data.recentBots = this.data.recentBots.slice(0, 50);
      }
      
      // Save changes
      this.saveToFile();
      
      return newBot;
    }
  }
  
  // Get most recent bots (defaults to 5)
  public getRecentBots(limit: number = 5): BotRecord[] {
    return this.data.recentBots.slice(0, limit);
  }
  
  // Get most accessed bots (defaults to 5)
  public getMostAccessedBots(limit: number = 5): BotRecord[] {
    // Sort by access count (descending) and return top ones
    return [...this.data.recentBots]
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, limit);
  }
  
  // Search bots by meeting type
  public getBotsByMeetingType(meetingType: string): BotRecord[] {
    return this.data.recentBots.filter(bot => 
      bot.meetingType?.toLowerCase() === meetingType.toLowerCase()
    );
  }
  
  // Get bot by ID
  public getBot(id: string): BotRecord | undefined {
    return this.data.recentBots.find(bot => bot.id === id);
  }
  
  // Update session with recent bot IDs
  public updateSession(session: any): void {
    if (!session) return;
    
    // Add recentBotIds to session
    session.recentBotIds = this.getRecentBots(5).map(bot => bot.id);
  }
}

// Singleton instance
let db: TinyDb | null = null;

// Get the singleton instance
export function getTinyDb(dbFilePath?: string): TinyDb {
  if (!db) {
    db = new TinyDb(dbFilePath);
  }
  return db;
} 