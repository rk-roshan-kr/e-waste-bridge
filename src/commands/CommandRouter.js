/**
 * CommandRouter.js - Intent to Typed Application Command Dispatcher
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

import { CommandTypes, InputSources } from './commandTypes.js';
import { validateCommand } from './commandSchemas.js';

export class CommandRouter {
  routeIntent(parsedIntent, context = {}, source = InputSources.VOICE) {
    const { intent, entities = {} } = parsedIntent;

    let command = null;

    switch (intent) {
      case 'FIND_BUYERS':
      case 'CREATE_DRAFT_LOT':
        command = {
          type: CommandTypes.FIND_BUYERS,
          payload: {
            material: entities.material || context.currentDraft?.materialName || 'LAPTOP',
            weightKg: entities.weightKg || context.currentDraft?.weightKg || 5,
            unitsCount: entities.unitsCount || 1
          },
          source,
          timestamp: Date.now()
        };
        break;

      case 'UPDATE_DRAFT':
        command = {
          type: CommandTypes.UPDATE_WEIGHT,
          payload: {
            lotId: context.selectedLot?.id || 'DRAFT_LOT',
            weightKg: entities.weightKg || 5
          },
          source,
          timestamp: Date.now()
        };
        break;

      case 'SELECT_OFFER':
        command = {
          type: CommandTypes.SELECT_OFFER,
          payload: {
            offerIndex: entities.offerIndex ?? 0,
            offerId: entities.offer?.id || null,
            reason: entities.reason
          },
          source,
          timestamp: Date.now()
        };
        break;

      case 'EXPLAIN_OFFER':
        command = {
          type: CommandTypes.EXPLAIN_OFFER,
          payload: {
            offerIndex: entities.offerIndex ?? 1
          },
          source,
          timestamp: Date.now()
        };
        break;

      case 'REQUEST_ACCEPT_OFFER':
        const targetOffer = context.visibleOffers?.[entities.offerIndex ?? 0] || null;
        command = {
          type: CommandTypes.REQUEST_ACCEPT_OFFER,
          payload: {
            offerId: targetOffer?.id || 'OFFER_0',
            offerIndex: entities.offerIndex ?? 0,
            buyerName: targetOffer?.buyerName || 'Verified Recycler',
            netPayout: targetOffer?.netPayout || targetOffer?.totalPayout || 2960,
            cpcbRegNo: targetOffer?.cpcbRegNo || ''
          },
          source,
          timestamp: Date.now()
        };
        break;

      case 'CANCEL_BACK':
        command = {
          type: CommandTypes.NAVIGATE_BACK,
          payload: {},
          source,
          timestamp: Date.now()
        };
        break;

      case 'QUERY_RATES':
        command = {
          type: CommandTypes.QUERY_MARKET_RATES,
          payload: {
            material: entities.material || 'LAPTOP'
          },
          source,
          timestamp: Date.now()
        };
        break;

      default:
        return null;
    }

    if (command) {
      validateCommand(command);
    }

    return command;
  }
}

export const commandRouter = new CommandRouter();
