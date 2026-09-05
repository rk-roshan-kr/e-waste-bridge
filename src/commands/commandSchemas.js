/**
 * commandSchemas.js - Command Payload Validation Contracts
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { CommandTypes } from './commandTypes.js';

export class CommandValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'CommandValidationError';
    this.details = details;
  }
}

export function validateCommand(command) {
  if (!command || typeof command !== 'object') {
    throw new CommandValidationError('Command must be an object', { command });
  }

  if (!command.type || !CommandTypes[command.type]) {
    throw new CommandValidationError(`Unknown or missing command type: ${command.type}`, { command });
  }

  const payload = command.payload || {};

  switch (command.type) {
    case CommandTypes.UPDATE_WEIGHT:
      if (typeof payload.weightKg !== 'number' || isNaN(payload.weightKg) || payload.weightKg <= 0) {
        throw new CommandValidationError('UPDATE_WEIGHT requires valid positive weightKg', { payload });
      }
      break;

    case CommandTypes.UPDATE_MATERIAL:
      if (!payload.materialId && !payload.materialName) {
        throw new CommandValidationError('UPDATE_MATERIAL requires materialId or materialName', { payload });
      }
      break;

    case CommandTypes.SELECT_OFFER:
      if (typeof payload.offerIndex !== 'number' && !payload.offerId) {
        throw new CommandValidationError('SELECT_OFFER requires offerIndex or offerId', { payload });
      }
      break;

    case CommandTypes.REQUEST_ACCEPT_OFFER:
      if (!payload.offerId && typeof payload.offerIndex !== 'number') {
        throw new CommandValidationError('REQUEST_ACCEPT_OFFER requires offerId or offerIndex', { payload });
      }
      break;

    case CommandTypes.COMMIT_TRANSACTION:
      if (!payload.offerId && !payload.lotId) {
        throw new CommandValidationError('COMMIT_TRANSACTION requires offerId or lotId', { payload });
      }
      break;

    default:
      // Other commands pass structural validation
      break;
  }

  return true;
}
