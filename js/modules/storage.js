'use strict';

/**
 * Storage Module
 * ===============
 * Unified interface for localStorage/sessionStorage with auto-sync to state.
 * Handles serialization, versioning, and error recovery.
 */

import { STORAGE_KEYS } from '../constants.js';
import { store } from './state.js';

class StorageManager {
  constructor() {
    this._localStorage = window.localStorage;
    this._sessionStorage = window.sessionStorage;
    this._migrations = new Map();
  }
  
  /**
   * Save cart to localStorage
   */
  saveCart(cart) {
    try {
      const data = cart.map(({ id, qty }) => ({ id, qty }));
      this._localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save cart:', error);
      return false;
    }
  }
  
  /**
   * Load cart from localStorage
   */
  loadCart() {
    try {
      const data = JSON.parse(this._localStorage.getItem(STORAGE_KEYS.CART) || '[]');
      
      // Validate and sanitize
      return Array.isArray(data)
        ? data.filter(item => 
            typeof item.id === 'string' &&
            Number.isInteger(item.qty) &&
            item.qty > 0
          )
        : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  }
  
  /**
   * Save checkout draft to sessionStorage
   */
  saveDraft(formData) {
    try {
      const draft = {};
      const fieldNames = ['nombre', 'whatsapp', 'email', 'fecha_entrega', 'datos_diseno', 'medio_pago', 'otro_medio_pago'];
      
      for (const name of fieldNames) {
        draft[name] = String(formData[name] || '');
      }
      
      this._sessionStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  }
  
  /**
   * Load checkout draft from sessionStorage
   */
  loadDraft() {
    try {
      return JSON.parse(this._sessionStorage.getItem(STORAGE_KEYS.DRAFT) || 'null');
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }
  
  /**
   * Clear draft
   */
  clearDraft() {
    try {
      this._sessionStorage.removeItem(STORAGE_KEYS.DRAFT);
      return true;
    } catch (error) {
      console.error('Failed to clear draft:', error);
      return false;
    }
  }
  
  /**
   * Save pending order (for retry logic)
   */
  savePending(requestId, accessCode, fingerprint) {
    try {
      const pending = {
        requestId,
        accessCode,
        fingerprint,
        at: Date.now()
      };
      this._sessionStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(pending));
      return true;
    } catch (error) {
      console.error('Failed to save pending order:', error);
      return false;
    }
  }
  
  /**
   * Load pending order
   */
  loadPending(fingerprint) {
    try {
      const pending = JSON.parse(this._sessionStorage.getItem(STORAGE_KEYS.PENDING) || 'null');
      
      if (!pending || pending.fingerprint !== fingerprint) {
        return null;
      }
      
      // Check if still valid (< 24 hours)
      if (Date.now() - pending.at > 86400000) {
        this.clearPending();
        return null;
      }
      
      return pending;
    } catch (error) {
      console.error('Failed to load pending order:', error);
      return null;
    }
  }
  
  /**
   * Clear pending order
   */
  clearPending() {
    try {
      this._sessionStorage.removeItem(STORAGE_KEYS.PENDING);
      return true;
    } catch (error) {
      console.error('Failed to clear pending order:', error);
      return false;
    }
  }
  
  /**
   * Save completed order (for coupon display)
   */
  saveLastOrder(order) {
    try {
      const data = {
        ...order,
        createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt
      };
      this._sessionStorage.setItem(STORAGE_KEYS.LAST_ORDER, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save last order:', error);
      return false;
    }
  }
  
  /**
   * Load completed order
   */
  loadLastOrder() {
    try {
      const data = JSON.parse(this._sessionStorage.getItem(STORAGE_KEYS.LAST_ORDER) || 'null');
      
      if (data && data.createdAt) {
        data.createdAt = new Date(data.createdAt);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load last order:', error);
      return null;
    }
  }
  
  /**
   * Clear order session data (draft + pending + last order)
   */
  clearOrderSession() {
    return this.clearDraft() && this.clearPending();
  }
  
  /**
   * Save user preference (sound, etc.)
   */
  setPreference(key, value) {
    try {
      this._localStorage.setItem(`plop.pref.${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to save preference '${key}':`, error);
      return false;
    }
  }
  
  /**
   * Load user preference
   */
  getPreference(key, defaultValue = undefined) {
    try {
      const value = this._localStorage.getItem(`plop.pref.${key}`);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to load preference '${key}':`, error);
      return defaultValue;
    }
  }
  
  /**
   * Clear all Plop data (for logout/reset)
   */
  clearAll() {
    const keys = Object.values(STORAGE_KEYS);
    const prefixesToClear = ['plop.pref.', 'plop.sound.'];
    
    try {
      // Clear session storage
      keys.forEach(key => this._sessionStorage.removeItem(key));
      
      // Clear preferences
      for (let i = 0; i < this._localStorage.length; i++) {
        const key = this._localStorage.key(i);
        if (key && prefixesToClear.some(prefix => key.startsWith(prefix))) {
          this._localStorage.removeItem(key);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear all storage:', error);
      return false;
    }
  }
  
  /**
   * Register a migration function for schema updates
   * Usage: storage.registerMigration(1, (data) => ({ ...data, newField: 'value' }))
   */
  registerMigration(version, fn) {
    this._migrations.set(version, fn);
  }
  
  /**
   * Run migrations on stored data
   */
  runMigrations(data, fromVersion = 0) {
    let result = data;
    
    for (let v = fromVersion + 1; v <= this._migrations.size; v++) {
      const migration = this._migrations.get(v);
      if (migration) {
        try {
          result = migration(result);
        } catch (error) {
          console.error(`Migration ${v} failed:`, error);
          return null;
        }
      }
    }
    
    return result;
  }
}

// Create singleton instance
export const storage = new StorageManager();

export default storage;