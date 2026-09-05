/**
 * commandTypes.js - Strongly Typed Application Command Tokens
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export const CommandTypes = Object.freeze({
  // Lot & Drafting
  CREATE_LOT_DRAFT: 'CREATE_LOT_DRAFT',
  UPDATE_WEIGHT: 'UPDATE_WEIGHT',
  UPDATE_MATERIAL: 'UPDATE_MATERIAL',
  UPDATE_UNITS: 'UPDATE_UNITS',
  UPDATE_GRADE: 'UPDATE_GRADE',
  RESET_DRAFT: 'RESET_DRAFT',

  // Marketplace & Matching
  QUERY_MARKET_RATES: 'QUERY_MARKET_RATES',
  FIND_BUYERS: 'FIND_BUYERS',
  SELECT_OFFER: 'SELECT_OFFER',
  EXPLAIN_OFFER: 'EXPLAIN_OFFER',
  COMPARE_OFFERS: 'COMPARE_OFFERS',
  FILTER_OFFERS: 'FILTER_OFFERS',
  CREATE_BUY_REQUIREMENT: 'CREATE_BUY_REQUIREMENT',

  // Consequential Operations (Policy Gated)
  REQUEST_ACCEPT_OFFER: 'REQUEST_ACCEPT_OFFER', // Arms confirmation gate; never commits directly
  COMMIT_TRANSACTION: 'COMMIT_TRANSACTION',     // Requires physical tap (<1L) or 5s hold (>=1L)

  // Navigation & Safety
  NAVIGATE_TO: 'NAVIGATE_TO',
  NAVIGATE_BACK: 'NAVIGATE_BACK',
  CANCEL_CURRENT_OPERATION: 'CANCEL_CURRENT_OPERATION',
  UNDO_LAST_ACTION: 'UNDO_LAST_ACTION'
});

export const InputSources = Object.freeze({
  VOICE: 'VOICE',
  TOUCH: 'TOUCH',
  CAMERA: 'CAMERA',
  HOLD: 'HOLD',
  SYSTEM: 'SYSTEM'
});
