'use strict';

/**
 * State Management
 * =================
 * Centralized, reactive state store using observable pattern.
 * Replaces global variables with a single source of truth.
 */

import { STORAGE_KEYS } from '../constants.js';

class StateStore {
  constructor() {
    this._state = {
      // Navigation
      activeStage: 'home',
      activeCategory: 'Combos',
      catalogSearch: '',
      
      // Cart
      cart: [],
      
      // Checkout
      receiptCheck: { valid: false, message: 'Elegí un medio de pago.' },
      selectedPayment: null,
      formData: {},
      
      // Order
      lastOrder: null,
      pendingRequestId: null,
      pendingAccessCode: null,
      submitInFlight: false,
      
      // UI
      soundEnabled: localStorage.getItem('plop.sound.enabled') !== 'false',
      audioContext: null,
      
      // Tracking
      shownGuideStates: new Set(),
      
      // Internal
      _version: 1 // For schema migration
    };
    
    this._subscribers = new Map(); // {key: Set<callback>}
  }
  
  /**
   * Get current state value
   */
  get(key, defaultValue = undefined) {
    return this._state[key] ?? defaultValue;
  }
  
  /**
   * Set state value and notify subscribers
   */
  set(key, value) {
    const oldValue = this._state[key];
    
    // Prevent unnecessary updates
    if (oldValue === value) return;
    
    this._state[key] = value;
    this._notify(key, value, oldValue);
  }
  
  /**
   * Batch updates for performance
   */
  batch(updates) {
    const changes = {};
    
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this._state[key];
      if (oldValue !== value) {
        this._state[key] = value;
        changes[key] = { value, oldValue };
      }
    }
    
    // Notify all changed keys
    for (const [key, { value, oldValue }] of Object.entries(changes)) {
      this._notify(key, value, oldValue);
    }
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(key, callback) {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }
    
    this._subscribers.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this._subscribers.get(key).delete(callback);
    };
  }
  
  /**
   * Notify all subscribers of a change
   */
  _notify(key, value, oldValue) {
    const callbacks = this._subscribers.get(key);
    if (!callbacks) return;
    
    for (const callback of callbacks) {
      try {
        callback(value, oldValue);
      } catch (error) {
        console.error(`Error in subscriber for '${key}':`, error);
      }
    }
  }
  
  /**
   * Get entire state (for debugging)
   */
  getAll() {
    return { ...this._state };
  }
  
  /**
   * Reset state to initial values
   */
  reset() {
    this._state = {
      activeStage: 'home',
      activeCategory: 'Combos',
      catalogSearch: '',
      cart: [],
      receiptCheck: { valid: false, message: 'Elegí un medio de pago.' },
      selectedPayment: null,
      formData: {},
      lastOrder: null,
      pendingRequestId: null,
      pendingAccessCode: null,
      submitInFlight: false,
      soundEnabled: localStorage.getItem('plop.sound.enabled') !== 'false',
      audioContext: null,
      shownGuideStates: new Set(),
      _version: 1
    };
  }
  
  /**
   * Cart operations
   */
  addToCart(productId, quantity = 1) {
    const item = this._state.cart.find(i => i.id === productId);
    
    if (item) {
      item.qty += quantity;
    } else {
      this._state.cart.push({ id: productId, qty: quantity });
    }
    
    this._notify('cart', this._state.cart, undefined);
  }
  
  removeFromCart(productId) {
    const oldCart = this._state.cart;
    this._state.cart = this._state.cart.filter(i => i.id !== productId);
    this._notify('cart', this._state.cart, oldCart);
  }
  
  changeQuantity(productId, delta) {
    const item = this._state.cart.find(i => i.id === productId);
    if (!item) return;
    
    item.qty += delta;
    if (item.qty <= 0) {
      this.removeFromCart(productId);
    } else {
      this._notify('cart', this._state.cart, undefined);
    }
  }
  
  clearCart() {
    const oldCart = this._state.cart;
    this._state.cart = [];
    this._notify('cart', this._state.cart, oldCart);
  }
  
  /**
   * Order operations
   */
  setLastOrder(order) {
    this.set('lastOrder', order);
  }
  
  clearLastOrder() {
    this.set('lastOrder', null);
  }
  
  /**
   * Guide tracking for bot companion
   */
  hasShownGuide(guideKey) {
    return this._state.shownGuideStates.has(guideKey);
  }
  
  markGuideAsShown(guideKey) {
    this._state.shownGuideStates.add(guideKey);
  }
  
  clearGuideHistory() {
    this._state.shownGuideStates.clear();
  }
}

// Create singleton instance
export const store = new StateStore();

export default store;