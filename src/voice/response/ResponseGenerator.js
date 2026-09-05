/**
 * ResponseGenerator.js - Context-Sensitive Vernacular Response Generation Engine
 * Part of E-Waste Bridge Architecture Blueprint v2
 */

export class ResponseGenerator {
  generate(command, toolResult = {}, lang = 'hi') {
    if (!command) return { text: 'हाँ, बताइए मैं क्या मदद करूँ?', audioKey: 'help_generic' };

    switch (command.type) {
      case 'FIND_BUYERS': {
        const count = toolResult.buyersCount || 3;
        const bestRate = toolResult.bestNetPayout || 2960;
        const material = command.payload?.material || 'लैपटॉप';
        const weight = command.payload?.weightKg || 10;

        if (lang === 'mr') {
          return {
            text: `${weight} किलो ${material} साठी ${count} verified खरेदीदार मिळाले आहेत. सर्वोत्तम भाव ${bestRate.toLocaleString('en-IN')} रुपये आहे.`,
            audioKey: 'buyers_found_mr'
          };
        }
        return {
          text: `${weight} किलो ${material} के लिए ${count} verified buyers मिले हैं। सबसे अच्छा दाम ${bestRate.toLocaleString('en-IN')} रुपये है।`,
          audioKey: 'buyers_found_hi'
        };
      }

      case 'UPDATE_WEIGHT': {
        const weight = command.payload?.weightKg || 7;
        const newTotal = toolResult.estimatedPayout || (weight * 296);

        if (lang === 'mr') {
          return {
            text: `वजन बदलून ${weight} किलो केले आहे. नवीन किंमत अंदाजे ${newTotal.toLocaleString('en-IN')} रुपये आहे.`,
            audioKey: 'weight_updated_mr'
          };
        }
        return {
          text: `वज़न बदलकर ${weight} किलो कर दिया है। नया दाम लगभग ${newTotal.toLocaleString('en-IN')} रुपये है।`,
          audioKey: 'weight_updated_hi'
        };
      }

      case 'SELECT_OFFER': {
        const buyerName = toolResult.buyerName || command.payload?.buyerName || 'EcoRecycle';
        const net = toolResult.netPayout || 2960;

        return {
          text: `${buyerName} का ${net.toLocaleString('en-IN')} रुपये वाला ऑफर चुन लिया गया है।`,
          audioKey: 'offer_selected_hi'
        };
      }

      case 'EXPLAIN_OFFER': {
        const buyerName = toolResult.buyerName || 'GreenTech Solutions';
        const distance = toolResult.distanceKm || 1.8;
        const net = toolResult.netPayout || 2960;

        return {
          text: `${buyerName} सिर्फ ${distance} किलोमीटर दूर है, इसलिए गाड़ी का खर्चा सबसे कम है और पूरा ${net.toLocaleString('en-IN')} रुपये मिलेगा।`,
          audioKey: 'offer_explained_hi'
        };
      }

      case 'REQUEST_ACCEPT_OFFER': {
        const net = command.payload?.netPayout || 2960;
        const isHighValue = net >= 100000;

        if (isHighValue) {
          return {
            text: `${net.toLocaleString('en-IN')} रुपये का बड़ा सौदा है। पक्का करने के लिए 5 सेकंड दबा कर रखें।`,
            audioKey: 'high_value_hold_hi'
          };
        }
        return {
          text: `${net.toLocaleString('en-IN')} रुपये का सौदा पक्का करने के लिए कन्फर्म बटन दबाएं।`,
          audioKey: 'confirm_tap_hi'
        };
      }

      case 'COMMIT_TRANSACTION': {
        return {
          text: `सौदा पक्का हो गया। CPCB रसीद और पिकअप कोड तैयार है।`,
          audioKey: 'committed_success_hi'
        };
      }

      case 'NAVIGATE_BACK': {
        return {
          text: `पीछे वापस आ गए हैं। बताइए आगे क्या करना है?`,
          audioKey: 'nav_back_hi'
        };
      }

      default:
        return {
          text: `समझ गया।`,
          audioKey: 'generic_ack_hi'
        };
    }
  }
}

export const responseGenerator = new ResponseGenerator();
