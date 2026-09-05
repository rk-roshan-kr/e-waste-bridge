# E-Waste Bridge: Master Catalog of 350+ Vernacular Voice Edge Cases
**Problem Statement 2: E-Waste Management & Informal Sector Formalization**
*Smart India Hackathon (SIH 2026) | Conversational AI Test Harness & Validation Dataset*

This document compiles **350+ realistic speaking edge cases** recorded and simulated from informal scrap clusters (Dharavi, Kurla, Seelampur, Mustafabad, Hadapsar). It serves as the authoritative benchmark for testing ASR resilience, speech normalization, deictic reference resolution, intent classification, and empathetic responses.

---

## Domain Index
1. [Audibility, Mic Testing & Audio Self-Diagnosis (Cases 1–35)](#1-audibility-mic-testing--audio-self-diagnosis-cases-135)
2. [Greetings, Chit-Chat, Identity & Govt Apprehension (Cases 36–75)](#2-greetings-chit-chat-identity--govt-apprehension-cases-3675)
3. [Vernacular Quantities, Fractions & Slang Weights (Cases 76–125)](#3-vernacular-quantities-fractions--slang-weights-cases-76125)
4. [Mid-Sentence Backtracking & Multi-Hop Self-Corrections (Cases 126–165)](#4-mid-sentence-backtracking--multi-hop-self-corrections-cases-126165)
5. [Colloquial E-Waste Slang & Compound Scrap Terminology (Cases 166–210)](#5-colloquial-e-waste-slang--compound-scrap-terminology-cases-166210)
6. [Bargaining, Counter-Offers & Financial Settlement (Cases 211–255)](#6-bargaining-counter-offers--financial-settlement-cases-211255)
7. [Relative Deictic References & Contextual Selections (Cases 256–285)](#7-relative-deictic-references--contextual-selections-cases-256285)
8. [Hesitations, Thinking Pauses, Fillers & Barge-In (Cases 286–315)](#8-hesitations-thinking-pauses-fillers--barge-in-cases-286315)
9. [CPCB Safety, Toxic Hazard Warnings & Emergencies (Cases 316–335)](#9-cpcb-safety-toxic-hazard-warnings--emergencies-cases-316335)
10. [Frustration, Cancellation, Confusion & Navigation (Cases 336–355)](#10-frustration-cancellation-confusion--navigation-cases-336355)

---

## 1. Audibility, Mic Testing & Audio Self-Diagnosis (Cases 1–35)
*Edge cases where the collector checks if the phone is listening, sounds are working, or mic is active.*

| # | Spoken Utterance (Vernacular) | Language | Expected Intent | Target Resolution / Agent Behavior |
|---|---|---|---|---|
| 1 | "हेलो हेलो... आवाज़ आ रही है क्या?" | Hindi | `SYSTEM_MIC_CHECK` | "हाँ, सुन रहे हैं! बोलिए क्या माल बेचना है?" |
| 2 | "माइक चालू है क्या भाई?" | Hindi | `SYSTEM_MIC_CHECK` | "माइक चालू है, आप बोल सकते हैं।" |
| 3 | "ऐकताय का? आवाज येतोय का माझा?" | Marathi | `SYSTEM_MIC_CHECK` | "हो, ऐकतोय! बोला, कोणता माल आहे?" |
| 4 | "मेरी आवाज़ पहुँच रही है तुम तक?" | Hindi | `SYSTEM_MIC_CHECK` | Confirm audio reception with green visual wave. |
| 5 | "हेलो? कोई है वहाँ?" | Hindi | `SYSTEM_MIC_CHECK` | "जी, मैं सुन रहा हूँ। बताइए।" |
| 6 | "माइक काम नहीं कर रहा शायद।" | Hindi | `SYSTEM_MIC_CHECK` | "माइक सही काम कर रहा है, आप बोलिए।" |
| 7 | "अरे सुनाई दे रहा है या बंद हो गया?" | Hindi | `SYSTEM_MIC_CHECK` | "सब सुनाई दे रहा है, बताइए।" |
| 8 | "Hello testing 1 2 3" | English | `SYSTEM_MIC_CHECK` | "Listening! Speak your scrap details." |
| 9 | "आवाज येत नाहीये मला तुझा" | Marathi | `SYSTEM_VOLUME_CHECK` | Increases TTS gain and triggers test chime. |
| 10 | "जोर से बोलो, कुछ सुनाई नहीं दिया" | Hindi | `SYSTEM_REPEAT_LOUDER` | Repeats last TTS utterance at +4dB gain. |
| 11 | "फिर से बोलो क्या बोले?" | Hindi | `SYSTEM_REPEAT_LAST` | Repeats previous response verbatim. |
| 12 | "दोनदा सांगा, मला समजलं नाही" | Marathi | `SYSTEM_REPEAT_LAST` | Repeats in slow, clear Marathi. |
| 13 | "फोन का स्पीकर खराब है क्या?" | Hindi | `SYSTEM_AUDIO_DIAG` | Plays clear chime and confirms speaker state. |
| 14 | "माइक दबा के रखना है क्या?" | Hindi | `SYSTEM_HELP_INPUT` | "हाँ, जब तक आप बोलें, बटन दबाकर रखें।" |
| 15 | "बोल के छोड़ दूँ?" | Hindi | `SYSTEM_HELP_INPUT` | "बोलने के बाद बटन छोड़ दीजिए।" |
| 16 | "[Blowing air into mic: फू फू]" | Audio | `NOISE_BREATH_ARTIFACT` | Filtered out by `SpeechNormalizer.isNoiseArtifact`. |
| 17 | "[Tapping mic: ठक ठक]" | Audio | `NOISE_TAP_ARTIFACT` | Filtered out; prevents ghost transcript. |
| 18 | "[Throat clearing: खंखारना]" | Audio | `NOISE_COUGH_ARTIFACT` | Stripped; VAD remains in `LISTENING`. |
| 19 | "हाँ... हूँ... हेलो?" | Hindi | `SYSTEM_MIC_CHECK` | "जी, मैं तैयार हूँ। माल का नाम बताइए।" |
| 20 | "माझा फोन हँग झाला का?" | Marathi | `SYSTEM_STATUS_QUERY` | "नाही, ॲप सुरू आहे. बोला." |
| 21 | "क्या तुम मुझे सुन सकते हो?" | Hindi | `SYSTEM_MIC_CHECK` | "हाँ बिल्कुल, बताइए क्या वजन है?" |
| 22 | "Are you listening to me?" | English | `SYSTEM_MIC_CHECK` | "Yes, I'm listening. How can I help?" |
| 23 | "काहीतरी बोल, गप्प का बसलास?" | Marathi | `SYSTEM_PROMPT_USER` | "मी ऐकतोय, तुमच्या मालाचे वजन सांगा." |
| 24 | "स्क्रीन पे कुछ दिख नहीं रहा आवाज़ तो आ रही है"| Hindi | `SYSTEM_UI_SYNC` | Navigates to active step and speaks context. |
| 25 | "आवाज़ बहुत कट रही है तुम्हारी" | Hindi | `SYSTEM_AUDIO_QUALITY`| Switches to local pre-rendered audio cache. |
| 26 | "अरे नेटवर्क चला गया क्या?" | Hindi | `QUERY_NETWORK_STATUS` | "इंटरनेट नहीं है, फिर भी ॲप ऑफलाइन चलेगा!" |
| 27 | "ऑफलाइन में काम करेगा ये?" | Hindi | `QUERY_NETWORK_STATUS` | "हाँ, बिना इंटरनेट के भी सब काम होगा।" |
| 28 | "बटन लाल क्यों हो गया?" | Hindi | `QUERY_UI_STATE` | "लाल बटन यानी रिकॉर्डिंग चालू है, बोलिए।" |
| 29 | "हरा बत्ती जल रहा है" | Hindi | `QUERY_UI_STATE` | Explains green status indicator. |
| 30 | "Hello? Anybody there?" | English | `SYSTEM_MIC_CHECK` | "Yes! Tell me what material you have." |
| 31 | "माइक चालू ठेवायचा का बंद करू?" | Marathi | `SYSTEM_HELP_INPUT` | Guides push-to-talk release. |
| 32 | "माइक पे हाथ लग गया था गलती से" | Hindi | `CANCEL_CURRENT` | Clears accidental short utterance (<0.5s). |
| 33 | "चुप क्यों हो गए?" | Hindi | `SYSTEM_PROMPT_USER` | Prompts next missing field (Weight/Material). |
| 34 | "बोलिए बोलिए मैं सुन रहा हूँ" | Hindi | `SYSTEM_REASSURE` | "जी, आप अपने कबाड़ का वजन बताएं।" |
| 35 | "अरे ये तो बोल ही नहीं रहा" | Hindi | `SYSTEM_AUDIO_TEST` | Plays audible confirmation tone. |

---

## 2. Greetings, Chit-Chat, Identity & Govt Apprehension (Cases 36–75)
*Edge cases around vernacular greetings, persona questions, trust, and fear of tax/police raids in the informal sector.*

| # | Spoken Utterance (Vernacular) | Language | Expected Intent | Target Resolution / Agent Behavior |
|---|---|---|---|---|
| 36 | "नमस्ते भाई" | Hindi | `GREETING` | "नमस्ते! आज क्या कबाड़ बेचना है?" |
| 37 | "राम राम जी" | Hindi | `GREETING` | "राम राम! बताइए कौन सा लॉट बनाना है?" |
| 38 | "सलाम वालेकुम भाईजान" | Hindi/Urdu | `GREETING` | "वालेकुम अस्सलाम! बताइए क्या माल है?" |
| 39 | "नमस्कार शेठ" | Marathi | `GREETING` | "नमस्कार! आज काय भंगार विकायचं आहे?" |
| 40 | "जय भीम" | Marathi/Hindi | `GREETING` | "जय भीम! सांगा कोणता माल आहे?" |
| 41 | "Good morning bhai" | Hinglish | `GREETING` | "Good morning! Tell me what scrap you have." |
| 42 | "तू कौन है भाई?" | Hindi | `PERSONA_QUERY` | "मैं आपका ई-वेस्ट साथी हूँ, सही भाव दिलाने के लिए।" |
| 43 | "तू कोण बोलतोय?" | Marathi | `PERSONA_QUERY` | "मी ई-वेस्ट सेतू सहाय्यक आहे, भंगाराचे योग्य भाव मिळवून देतो।" |
| 44 | "Who are you?" | English | `PERSONA_QUERY` | "I am E-Waste Bridge voice assistant." |
| 45 | "तू इंसान है या कंप्यूटर?" | Hindi | `PERSONA_QUERY` | "मैं कंप्यूटर हूँ, लेकिन भाव असली रीसाइक्लर के बताता हूँ!" |
| 46 | "क्या हाल चाल है?" | Hindi | `CHIT_CHAT` | "सब बढ़िया! आप बताइए आज कितना माल जमा हुआ?" |
| 47 | "कसा आहेस?" | Marathi | `CHIT_CHAT` | "एकदम मजेत! सांगा आज काय गोळा केलं?" |
| 48 | "तू मुझे जानता है?" | Hindi | `PERSONA_IDENTITY` | Recognizes collector profile: "हाँ रामू भाई, आपका स्वागत है।" |
| 49 | "तुम सरकारी आदमी हो क्या?" | Hindi | `TRUST_INQUIRY` | "नहीं, यह कबाड़ियों को सही दाम दिलाने का मंच है, कोई टैक्स नहीं कटेगा।" |
| 50 | "पोलीस तर नाही ना येणार?" | Marathi | `TRUST_INQUIRY` | "नाही, ही अधिकृत CPCB विक्री आहे, रोख पैसे मिळतील." |
| 51 | "मेरा आधार कार्ड लगेगा क्या?" | Hindi | `KYC_QUERY` | "कोई आधार कार्ड नहीं चाहिए! सीधा नकद भुगतान मिलेगा।" |
| 52 | "जीएसटी कटेगा क्या मेरे पैसे से?" | Hindi | `TAX_QUERY` | "नहीं! कबाड़ी भाइयों पर कोई जीएसटी या कमीशन नहीं कटता।" |
| 53 | "मुझे बेवकूफ तो नहीं बना रहे?" | Hindi | `TRUST_INQUIRY` | "बिल्कुल नहीं, यहाँ सरकारी भाव सूची और वजन का पूरा हिसाब है।" |
| 54 | "दुकानदार से ज्यादा भाव दोगे?" | Hindi | `VALUE_PROP_QUERY` | "यहाँ CPCB रीसाइक्लर सीधे बोली लगाते हैं, बिचौलियों से 40% ज्यादा!" |
| 55 | "शुक्रिया भाई" | Hindi | `COURTESY` | "आपका स्वागत है! कोई और माल है तो बताइए।" |
| 56 | "धन्यवाद" | Marathi/Hindi | `COURTESY` | "काही अडचण असेल तर नक्की विचारा!" |
| 57 | "Thanks a lot" | English | `COURTESY` | "You're welcome! Happy recycling." |
| 58 | "तू बहुत होशियार है यार" | Hindi | `CHIT_CHAT` | "धन्यवाद भाई! चलिए अब बढ़िया भाव निकालते हैं।" |
| 59 | "शाबाश बेटा" | Hindi | `CHIT_CHAT` | Acknowledges with warm gratitude. |
| 60 | "तू मेरी मदद कर सकता है?" | Hindi | `HELP_GENERAL` | "हाँ, बोलिए क्या मदद चाहिए? भाव जानना है या लॉट बनाना है?" |
| 61 | "मला काही समजत नाहीये, काय करू?" | Marathi | `HELP_GENERAL` | "काळजी करू नका, फक्त मालाचा फोटो दाखवा किंवा वजन सांगा." |
| 62 | "मैं पढ़ा लिखा नहीं हूँ" | Hindi | `LITERACY_REASSURANCE`| "कोई बात नहीं! आपको पढ़ना नहीं है, बस मुँह से बोलिए या सुनिए।" |
| 63 | "अंगूठा लगाने से काम हो जाएगा?" | Hindi | `LITERACY_REASSURANCE`| "हाँ, सिर्फ उंगली दबाकर पक्का करना है, लिखना कुछ नहीं।" |
| 64 | "गाड़ी कब आएगी लेने?" | Hindi | `LOGISTICS_QUERY` | "सौदा पक्का होने के 24 घंटे के अंदर अधिकृत गाड़ी आएगी।" |
| 65 | "पैसा कब मिलेगा?" | Hindi | `PAYMENT_TIMING` | "कांटे पर तौलते ही तुरंत हाथ में रोकड़!" |
| 66 | "कितना टाइम लगेगा?" | Hindi | `LOGISTICS_QUERY` | Explains pickup schedule window. |
| 67 | "बहुत थक गया हूँ आज" | Hindi | `EMPATHY` | "थोड़ा आराम कर लीजिए, माल का हिसाब मैं संभाल लूँगा।" |
| 68 | "आज धंधा मंदा है" | Hindi | `EMPATHY` | "कोई बात नहीं, आज के सबसे ऊंचे भाव ढूँढते हैं आपके लिए।" |
| 69 | "धरावी में कहाँ है रीसाइक्लर?" | Hindi | `LOCATION_QUERY` | Mentions nearest yard (Dharavi Consolidation Yard). |
| 70 | "कुर्ला का भाव क्या है?" | Hindi | `LOCATION_QUERY` | Filters benchmarks for Kurla scrap cluster. |
| 71 | "तुम कौन सी कंपनी के हो?" | Hindi | `PERSONA_QUERY` | Explains E-Waste Bridge non-profit consortium. |
| 72 | "क्या मैं कल आ सकता हूँ?" | Hindi | `OPERATIONAL_QUERY` | Confirms 24x7 availability. |
| 73 | "चाय पानी का खर्चा मिलेगा?" | Hindi | `CHIT_CHAT` | Chuckles warmly and cites transparent net payout. |
| 74 | "भाई एक नंबर काम है तुम्हारा" | Hindi | `CHIT_CHAT` | "शुक्रिया! आपकी मेहनत का सही फल मिलना चाहिए।" |
| 75 | "अलविदा भाई, फिर मिलेंगे" | Hindi | `FAREWELL` | "अलविदा! अपना ख्याल रखिएगा।" |

---

## 3. Vernacular Quantities, Fractions & Slang Weights (Cases 76–125)
*Edge cases involving traditional Indian fractional units, colloquial approximate measures, and mixed quantities.*

| # | Spoken Utterance (Vernacular) | Language | Extracted Weight | Material / Entity |
|---|---|---|---|---|
| 76 | "पौने दो किलो तांबा है" | Hindi | **1.75 kg** | Copper (`cables`) |
| 77 | "सवा पांच किलो तार" | Hindi | **5.25 kg** | Wire (`cables`) |
| 78 | "डेढ़ किलो मोबाइल की बैटरी" | Hindi | **1.5 kg** | Batteries (`batteries`) |
| 79 | "ढाई किलो कंप्यूटर का बोर्ड" | Hindi | **2.5 kg** | PCB (`pcb`) |
| 80 | "साढ़े तीन किलो मोटर का तार" | Hindi | **3.5 kg** | Motors (`motors_magnets`) |
| 81 | "साढ़े सात किलो प्लास्टिक" | Hindi | **7.5 kg** | Mixed Plastics (`abs_plastic`) |
| 82 | "पावणे तीन किलो वायर" | Marathi | **2.75 kg** | Wire (`cables`) |
| 83 | "सव्वा दोन किलो बॅटरी" | Marathi | **2.25 kg** | Batteries (`batteries`) |
| 84 | "दीड किलो लॅपटॉप मदरबोर्ड" | Marathi | **1.5 kg** | PCB (`pcb`) |
| 85 | "अडीच किलो तांबे" | Marathi | **2.5 kg** | Copper (`cables`) |
| 86 | "साडे चार किलो स्क्रीन" | Marathi | **4.5 kg** | LCD Panels (`lcd_panels`) |
| 87 | "आधा किलो सर्किट बोर्ड" | Hindi | **0.5 kg** | PCB (`pcb`) |
| 88 | "पाव किलो कॉपर" | Marathi | **0.25 kg** | Copper (`cables`) |
| 89 | "तीन पाव तांबा" (750g) | Hindi | **0.75 kg** | Copper (`cables`) |
| 90 | "सवा किलो" | Hindi | **1.25 kg** | Unspecified |
| 91 | "पौना किलो" | Hindi | **0.75 kg** | Unspecified |
| 92 | "दस बारह किलो होगा अंदाजन" | Hindi | **11.0 kg** (Mean) | Approximate |
| 93 | "चार पांच किलो है ज्यादा नहीं" | Hindi | **4.5 kg** | Approximate |
| 94 | "लगभग बीस किलो माल है" | Hindi | **20.0 kg** | Approximate |
| 95 | "एक बोरी तार भरा है" | Hindi | **15.0 kg** (Standard Sack)| Bounded estimate |
| 96 | "दो कट्टा प्लास्टिक केसिंग" | Hindi | **24.0 kg** (2x Sacks) | Mixed Plastics |
| 97 | "एक थैली मोबाइल की बैटरी" | Hindi | **3.0 kg** (Bag estimate)| Batteries |
| 98 | "एक पेटी पुराना फोन" | Hindi | **8.0 kg** (Box estimate)| Smartphones |
| 99 | "आधा क्विंटल स्क्रैप" | Hindi | **50.0 kg** | Bulk |
| 100| "एक क्विंटल तांबे की केबल" | Hindi | **100.0 kg** | Bulk Copper |
| 101| "दो टन पुराना ई-वेस्ट" | Hindi | **2000.0 kg** | Bulk E-Waste |
| 102| "दो सौ पचास ग्राम चांदी का पत्ता"| Hindi | **0.25 kg** | High-Grade PCB |
| 103| "साढ़े आठ किलो" | Hindi | **8.5 kg** | Unspecified |
| 104| "सवा ग्यारह किलो" | Hindi | **11.25 kg** | Unspecified |
| 105| "पौने बीस किलो" | Hindi | **19.75 kg** | Unspecified |
| 106| "डेढ़ सौ ग्राम" | Hindi | **0.15 kg** | Low quantity |
| 107| "ढाई सौ ग्राम" | Hindi | **0.25 kg** | Low quantity |
| 108| "पावणे पाचशे ग्रॅम" | Marathi | **0.475 kg** | Precision |
| 109| "सव्वाशे ग्रॅम" | Marathi | **0.125 kg** | Precision |
| 110| "दोन किलो दोनशे ग्रॅम" | Marathi | **2.2 kg** | Mixed units |
| 111| "पांच किलो सात सौ ग्राम" | Hindi | **5.7 kg** | Mixed units |
| 112| "दस किलो आठ सौ ग्राम" | Hindi | **10.8 kg** | Mixed units |
| 113| "पंद्रह किलो आधा" | Hindi | **15.5 kg** | Mixed units |
| 114| "2 point 5 kg battery" | English | **2.5 kg** | Batteries |
| 115| "10 kg and 200 grams" | English | **10.2 kg** | Unspecified |
| 116| "Just half a kilo" | English | **0.5 kg** | Low quantity |
| 117| "एक कांडी तांबा" | Hindi Slang | **1.0 kg** | Copper Rod |
| 118| "तीन डब्बा मोबाइल" | Hindi Slang | **6.0 kg** (2kg/dabba) | Smartphones |
| 119| "पांच नग पुराना टीवी" | Hindi | **5 Units** (Est. 45kg) | CRT Displays |
| 120| "दोन पीस लॅपटॉप" | Marathi | **2 Units** (Est. 4kg) | Laptops |
| 121| "दस पीस कीपैड फोन" | Hindi | **10 Units** (Est. 1kg) | Mobile Phones |
| 122| "चार बैटरी है इन्वर्टर का" | Hindi | **4 Units** (Est. 60kg) | Lead-Acid Battery |
| 123| "पचास ग्राम सोना वाला पिन" | Hindi | **0.05 kg** | Precious Pins |
| 124| "साडे सातशे ग्रॅम" | Marathi | **0.75 kg** | Precision |
| 125| "दीडशे किलो प्लास्टिक" | Marathi | **150.0 kg** | Bulk Plastics |

---

## 4. Mid-Sentence Backtracking & Multi-Hop Self-Corrections (Cases 126–165)
*Complex conversational utterances where the speaker changes weight, material, intent, or decision in mid-stream.*

| # | Spoken Utterance (Vernacular) | Primary Correction | Terminal Value Extracted |
|---|---|---|---|
| 126| "10 किलो तांबा है... नहीं नहीं 12 किलो करो" | Weight: 10 &rarr; 12 | `Weight: 12 kg, Material: Copper` |
| 127| "5 किलो बैटरी... अरे नहीं 5 नहीं 4 ही किलो है" | Weight: 5 &rarr; 4 | `Weight: 4 kg, Material: Battery` |
| 128| "8 किलो तांबा... अरे तांबा नहीं पीतल है" | Material: Copper &rarr; Brass | `Weight: 8 kg, Material: Brass` |
| 129| "लैपटॉप बेचना है... नहीं मोबाइल का भाव देखना था"| Intent: Sell &rarr; Query Rates | `Intent: QUERY_RATES, Material: Phone` |
| 130| "15 किलो प्लास्टिक... रुको रुको वजन गलत है, 18 किलो है"| Weight: 15 &rarr; 18 | `Weight: 18 kg, Material: Plastics` |
| 131| "पहला वाला रीसाइक्लर चुनो... नहीं नहीं बीच वाला सही है"| Selection: Index 0 &rarr; Index 1 | `Select: Index 1 (Middle Offer)` |
| 132| "ग्रीनटेक को बेचो... अरे रुको अपैक्स ज्यादा दे रहा है"| Buyer: GreenTech &rarr; Apex | `Select: Apex Recyclers` |
| 133| "दोन किलो... नाय नाय तीन किलो तांबं आहे" | Weight: 2 &rarr; 3 | `Weight: 3 kg, Material: Copper` |
| 134| "लॅपटॉप बोर्ड... नाही मोबाईल बोर्ड आहेत" | Material: Laptop &rarr; Mobile | `Material: Mobile PCB` |
| 135| "सौदा पक्का करो... अरे रुको रुको पहले गाड़ी का बताओ"| Action: Confirm &rarr; Inquire Logistics| `Halt Confirm, Intent: LOGISTICS_QUERY` |
| 136| "दस किलो तांबा... नहीं पीतल... अरे नहीं तांबा ही है!"| Double revert: Cu &rarr; Brass &rarr; Cu| `Material: Copper, Weight: 10 kg` |
| 137| "पावणे दोन किलो... म्हणजे दीड किलो समजा" | Fraction clarification: 1.75 &rarr; 1.5 | `Weight: 1.5 kg` |
| 138| "चार पीस टीवी... नहीं 3 ही चालू है 1 फूटा है" | Unit condition filter | `3 Sound Units, 1 Damaged Unit` |
| 139| "₹350 में दूंगा... नहीं 380 से कम नहीं चलेगा" | Counter Price: 350 &rarr; 380 | `Counter-Offer: ₹380/kg` |
| 140| "कैश चाहिए... चलो यूपीआई भी चलेगा" | Payment Mode: Cash &rarr; UPI | `Payment: UPI Optional Accepted` |
| 141| "यूपीआई करो... नहीं नहीं रोकड़ ही दो हाथ में" | Payment Mode: UPI &rarr; Cash | `Payment: Strict Spot Cash` |
| 142| "दो बोरी माल है... एक मिनट तोलने दो... हाँ 22 किलो"| Sack estimate &rarr; Exact Scale | `Weight: 22 kg` |
| 143| "20 किलो... अहाहा 10 ही किलो है, तराजू में गड़बड़ थी"| Faulty scale backtrack | `Weight: 10 kg` |
| 144| "सवा पांच किलो... नहीं पौने पांच किलो लिखो" | Fraction: 5.25 &rarr; 4.75 | `Weight: 4.75 kg` |
| 145| "50 पीस फोन... अरे 5 बैटरी निकाल ली मैंने तो 45 बचे"| Units: 50 &rarr; 45 | `Units: 45 Phones` |
| 146| "स्क्रीन टूटी हुई है... नहीं स्क्रीन सही है बॉडी टूटी है"| Defect classification | `Hazard: Low, Screen Intact` |
| 147| "अपैक्स वाला चुनो... अरे उसका रेटिंग कम है दूसरा देखो"| Rejection based on rating | `Filter: Higher Rated Buyer` |
| 148| "रद्द करो... नहीं रहने दो, चालू रखो" | Cancel &rarr; Resume | `State: RESUME_DRAFT` |
| 149| "होम स्क्रीन पर जाओ... नहीं नहीं लॉट दिखाओ पहले"| Nav: Home &rarr; Lots | `Nav: LOTS_LIST` |
| 150| "कल बेचूंगा... चलो आज ही निपटा दो" | Postpone &rarr; Transact | `Intent: FIND_BUYERS` |
| 151| "10 किलो तार... अरे प्लास्टिक चढ़ा हुआ है छिला नहीं है"| Uninsulated &rarr; Insulated | `Taxonomy: Insulated PVC Cable` |
| 152| "मोटर है... नहीं सिर्फ तांबे का लच्छा निकाला है"| Assembly &rarr; Pure Copper | `Taxonomy: Pure Secondary Copper` |
| 153| "साडेतीन किलो... नाय नाय चार किलो भरलंय" | Weight: 3.5 &rarr; 4.0 | `Weight: 4 kg` |
| 154| "पहिला ऑफर... नाही नाही खालचा ऑफर दाखव" | Positional: Top &rarr; Bottom | `Select: Last Offer` |
| 155| "₹200 भाव... नहीं 200 ग्राम वजन बोला मैंने!" | Semantic: Price &rarr; Weight | `Weight: 0.2 kg` |
| 156| "पांच सौ रुपया... अरे पांच सौ ग्राम है भाई" | Semantic: Currency &rarr; Weight | `Weight: 0.5 kg` |
| 157| "दो सौ ग्राम... नहीं ₹200 का भाव चाहिए" | Semantic: Weight &rarr; Price | `Price Inquiry: ₹200` |
| 158| "दो लैपटॉप... और एक टैबलेट भी जोड़ दो साथ में"| Additive entity chaining | `Composite: 2 Laptops + 1 Tablet` |
| 159| "तार हटाओ... सिर्फ बैटरी का भाव बताओ" | Material switch | `Material: Batteries` |
| 160| "₹300 मंजूर है... अरे रुको कितना कटेगा पहले बताओ"| Accept &rarr; Query Deductions | `Inquiry: NET_PAYOUT_BREAKDOWN` |
| 161| "छोड़ो यार... अच्छा ठीक है लगा दो बोली" | Walkaway &rarr; Re-engage | `Intent: REQUEST_QUOTES` |
| 162| "दहा किलो... नाय नाय वीस किलो आहे" | Marathi: 10 &rarr; 20 | `Weight: 20 kg` |
| 163| "अहमदनगर का भाव... अरे नहीं मुंबई का बताओ"| Location override | `Location: Mumbai Benchmark` |
| 164| "कांच का टीवी... नहीं LED वाला पतला टीवी है"| CRT &rarr; Flat Panel LCD | `Material: LCD Panels` |
| 165| "सादा फोन... नहीं टचस्क्रीन वाला स्मार्टफोन है"| Feature Phone &rarr; Smartphone | `Material: Smartphones` |

---

## 5. Colloquial E-Waste Slang & Compound Scrap Terminology (Cases 166–210)
*Raw scrap-market colloquial vocabulary used across North & West India.*

| # | Spoken Utterance (Vernacular) | Slang Term Used | Canonical CPCB Stream Mapped |
|---|---|---|---|
| 166| "चांदी वाला पत्ता है कंप्यूटर का" | *चांदी वाला पत्ता* | High-Grade PCB (`pcb`) |
| 167| "हरी पट्टी का भाव क्या है?" | *हरी पट्टी* | Motherboard PCB (`pcb`) |
| 168| "पीली पट्टी का क्या रेट है?" | *पीली पट्टी* | Low-Grade Single-Layer PCB (`pcb`) |
| 169| "कांच वाला बड़ा डिब्बा टीवी" | *कांच वाला डिब्बा* | CRT Television (`crt`) |
| 170| "पतली स्क्रीन वाला टीवी" | *पतली स्क्रीन* | LCD Panels (`lcd_panels`) |
| 171| "छिला हुआ लाल तांबा" | *छिला हुआ लाल तांबा* | Bright Bare Copper Wire (`cables`) |
| 172| "रबड़ चढ़ा हुआ काला तार" | *रबड़ चढ़ा हुआ तार* | PVC Insulated Cables (`cables`) |
| 173| "पंख्याची कॉपर वाइंडिंग आहे" | *वाइंडिंग* | Motors & Magnets (`motors_magnets`) |
| 174| "मिक्सर ची जळालेली मोटर" | *जळालेली मोटर* | Burned Motor Assembly (`motors_magnets`) |
| 175| "चुंबक वाली मोटर" | *चुंबक वाली मोटर* | Rare-Earth Magnets (`motors_magnets`) |
| 176| "स्पीकर का मैग्नेट" | *मैग्नेट* | Ferrite / NdFeB (`motors_magnets`) |
| 177| "कड़क प्लास्टिक बॉडी" | *कड़क प्लास्टिक* | ABS Casings (`abs_plastic`) |
| 178| "कंप्यूटर का डब्बा / खोखा" | *खोखा* | Mixed Plastics / Metal Casing |
| 179| "फुगा हुआ मोबाइल का बैटरी" | *फुगा हुआ बैटरी* | Swollen Li-Ion (`batteries`) |
| 180| "इनवर्टर का बड़ा तेजाब वाला बैटरी"| *तेजाब वाला बैटरी* | Lead-Acid Battery (`batteries`) |
| 181| "बटन वाला पुराना फोन" | *बटन वाला फोन* | Feature Phones (`smartphones`) |
| 182| "टच वाला फूटा मोबाइल" | *टच वाला मोबाइल* | Broken Smartphone (`smartphones`) |
| 183| "लैपटॉप का कीबोर्ड और चार्जर" | *चार्जर / कीबोर्ड* | Computer Peripherals |
| 184| "कूलर की पानी वाली मोटर" | *पानी वाली मोटर* | Submersible Pump (`motors_magnets`) |
| 185| "गाड़ी का अल्टरनेटर" | *अल्टरनेटर* | Copper Alternator (`motors_magnets`) |
| 186| "हार्ड डिस्क का अंदर का चक्का" | *अंदर का चक्का* | Hard Disk Platter (`pcb`) |
| 187| "सीडी रोम का कबाड़" | *सीडी रोम* | Optical Drive E-Waste |
| 188| "एसएमपीएस पावर सप्लाई" | *एसएमपीएस* | Power Supply Unit (`pcb`) |
| 189| "मोबाइल का चार्जर का गुच्छा" | *चार्जर का गुच्छा* | Low-Grade Wire (`cables`) |
| 190| "कम्प्रेसर का तांबा" | *कम्प्रेसर का तांबा* | Refrigerator Sealed Motor (`motors_magnets`) |
| 191| "फ्रिज की जाली" | *जाली* | Ferrous / Polymer scrap |
| 192| "वॉशिंग मशीन का टाइमर और गियर" | *टाइमर गियर* | Mixed Polymers (`abs_plastic`) |
| 193| "प्रिंटर का काला कार्ट्रिज" | *कार्ट्रिज* | Toner / Plastic (`abs_plastic`) |
| 194| "सोन्याची पिन असलेला माल" | *सोन्याची पिन* | Gold-Plated Connector Pins (`pcb`) |
| 195| "रिमोट कंट्रोल का सर्किट" | *रिमोट सर्किट* | Low-Grade PCB (`pcb`) |
| 196| "सेट टॉप बॉक्स का बोर्ड" | *सेट टॉप बॉक्स* | Consumer Electronics PCB (`pcb`) |
| 197| "राउटर का खोखा" | *राउटर* | Telecom Equipment (`pcb`) |
| 198| "माउस का तार" | *माउस का तार* | Thin Copper Wire (`cables`) |
| 199| "ई-रिक्शा की पुरानी लिथियम सेल" | *लिथियम सेल* | Cylindrical Li-Ion (`batteries`) |
| 200| "ड्रोन की जली हुई बैटरी" | *जली हुई बैटरी* | Damaged Li-Po (`batteries`) |
| 201| "ड्रिल मशीन का आर्मेचर" | *आर्मेचर* | Armature Winding (`motors_magnets`) |
| 202| "ट्रांसफार्मर की तांबे की पट्टी" | *ट्रांसफार्मर पट्टी* | Heavy Copper Strip (`cables`) |
| 203| "माइक्रोवेव का मैग्नेट्रॉन" | *मैग्नेट्रॉन* | High Hazard Waveguide (`motors_magnets`) |
| 204| "फोटोकॉपी मशीन का रोलर" | *रोलर* | Commercial E-Waste |
| 205| "सोलर पैनल का टूटा शीशा" | *सोलर शीशा* | Photovoltaic Panel |
| 206| "इलेक्ट्रॉनिक तराजू का बोर्ड" | *तराजू बोर्ड* | Precision Sensor PCB (`pcb`) |
| 207| "इमरजेंसी लाइट की बैटरी" | *इमरजेंसी लाइट* | Small Sealed Lead Acid (`batteries`) |
| 208| "वेपोराइज़र / ई-सिगरेट की बैटरी"| *ई-सिगरेट* | Hazardous Vape Battery (`batteries`) |
| 209| "बिजली का डिजिटल मीटर" | *डिजिटल मीटर* | Smart Meter Assembly (`pcb`) |
| 210| "जला हुआ तार" | *जला हुआ तार* | Burnt Copper (Flagged: CPCB Violation) |

---

## 6. Bargaining, Counter-Offers & Financial Settlement (Cases 211–255)
*Conversational bidding, price pushback, commission doubts, and cash vs digital settlement negotiations.*

| # | Spoken Utterance (Vernacular) | Extracted Intent | Financial Parameter |
|---|---|---|---|
| 211| "बहुत कम है यार, ₹300 तो कतई नहीं दूंगा, 350 कराओ"| `NEGOTIATE_COUNTER_OFFER` | Target Rate: `₹350/kg` |
| 212| "380 से एक रुपया कम नहीं होगा" | `NEGOTIATE_SET_FLOOR` | Rigid Floor: `₹380/kg` |
| 213| "बाजार में तो ₹400 चल रहा है तुम 340 क्यों दे रहे?"| `DISPUTE_BENCHMARK` | Comparison: Market vs Bid |
| 214| "हाथ में रोकड़ कौन देगा?" | `FILTER_PAYMENT_MODE` | Payment: `SPOT_CASH` |
| 215| "काट-कूट के हाथ में कितना रुपया मिलेगा?" | `QUERY_NET_PAYOUT` | Request Net in Hand |
| 216| "गाड़ी भाड़ा कितना काटोगे?" | `QUERY_LOGISTICS_FEE` | Deductions: Transport |
| 217| "हमाला का खर्चा किसका होगा?" | `QUERY_HANDLING_FEE` | Deductions: Labour / Weighing |
| 218| "कोई कमीशन तो नहीं काटोगे बीच में?" | `QUERY_COMMISSION` | Zero-Commission Guarantee |
| 219| "दुकानदार 320 नकद दे रहा है, तुम क्या दोगे?" | `COMPETITIVE_BID_QUERY`| Min Threshold: `₹320` |
| 220| "मला बँक खात्यात नको, रोख हातवर पाहिजे" | `FILTER_PAYMENT_MODE` | Strict Cash in Hand |
| 221| "काहीतरी वाढवून द्या ना साहेब" | `NEGOTIATE_FLEX` | Request Recycler Sweetener |
| 222| "पन्नास रुपये तरी वाढवा" | `NEGOTIATE_DELTA` | Delta Increase: `+₹50` |
| 223| "दस रुपया बढ़ा दो तो अभी सौदा पक्का" | `NEGOTIATE_DELTA_CLOSE`| Delta Increase: `+₹10` |
| 224| "आधा पैसा अभी, आधा गाड़ी चढ़ते वक्त चलेगा?"| `PARTIAL_PAYMENT_TERMS`| Terms: 50% Gate / 50% Loading |
| 225| "चेक नहीं चलेगा, सिर्फ कैश" | `PAYMENT_RESTRICTION` | Ban Cheques |
| 226| "यूपीआई 123PAY पर भेज सकते हो?" | `PAYMENT_FEATURE_PHONE`| UPI 123PAY Feature Phone |
| 227| "मेरे पास गूगल पे नहीं है" | `PAYMENT_FALLBACK` | Route to Spot Cash |
| 228| "कांटे पर ही पैसा गिन के दोगे ना?" | `PAYMENT_REASSURANCE` | Spot Gate Scale Settlement |
| 229| "पक्का ₹2,960 मिलेगा ना? कम तो नहीं होगा?" | `PAYMENT_LOCK_CONFIRM` | Lock Quoted Payout |
| 230| "भाव कितने दिन तक मान्य रहेगा?" | `QUOTE_VALIDITY_QUERY` | Offer TTL (30 min) |
| 231| "कल आऊँ तो यही भाव मिलेगा क्या?" | `FUTURE_RATE_QUERY` | Explain market volatility |
| 232| "दो लॉट एक साथ बेचूँ तो ज्यादा भाव मिलेगा?" | `BULK_BONUS_QUERY` | Bulk Tier Evaluation |
| 233| "हरा पत्ता और तांबा दोनों का मिलाकर कितना हुआ?"| `COMPOSITE_TOTAL_QUERY`| Combined Gross Sum |
| 234| "अरे वो रीसाइक्लर पैसा दबा तो नहीं लेगा?" | `COUNTERPARTY_RISK` | CPCB Authorization Guarantee |
| 235| "रसीद कच्ची मिलेगी या पक्की?" | `RECEIPT_TYPE_QUERY` | Official Form-6 Digital Voucher |
| 236| "कांटे का पर्ची दिखाओ" | `WEIGHBRIDGE_SLIP_REQ` | Certified Gate Slip |
| 237| "वजन में 100 ग्राम भी कम नहीं होना चाहिए"| `SCALE_ACCURACY_DEMAND`| Precision Certified Scale |
| 238| "चलो ठीक है ₹360 लगा दो" | `ACCEPT_COUNTER_PRICE` | Final Rate: `₹360` |
| 239| "नुकसान हो जाएगा मेरा इस भाव में" | `NEGOTIATE_REJECT_LOW` | Low-Ball Pushback |
| 240| "माल बहुत चोखा है, भाव सही लगाओ" | `QUALITY_ASSERTION` | Assert Grade A Material |
| 241| "पानी लगा हुआ नहीं है, सूखा माल है" | `MOISTURE_DISCLAIMER` | Zero Moisture Deduction |
| 242| "प्लास्टिक छांट के अलग कर दिया है" | `TARE_DEDUCTION_CLAIM` | Pure Net Weight Claim |
| 243| "पार्टनर से पूछ के बताता हूँ" | `PAUSE_NEGOTIATION` | Save Draft for Later |
| 244| "शेठ ला विचारून सांगतो" | `PAUSE_NEGOTIATION` | Marathi Consultation Pause |
| 245| "रोकड़ बाकी में मत रखना" | `CASH_IN_FULL_DEMAND` | Zero Pending Dues |
| 246| "बाकी रोकड़ कब तक मिलेगी?" | `PENDING_DUES_SCHEDULE`| Settlement Timeline |
| 247| "पिछला ₹1,850 बाकी है वो कब मिलेगा?" | `QUERY_SPECIFIC_DUE` | Inquire Unpaid Balance |
| 248| "मेरा खाता दिखाओ कितना जमा है" | `QUERY_LEDGER_BALANCE` | Open Earnings Ledger |
| 249| "इस महीने कुल कितना कमाया मैंने?" | `QUERY_MONTHLY_EARNING`| Monthly Diverted Revenue |
| 250| "कितना किलो माल बेच चुका हूँ अब तक?" | `QUERY_TOTAL_WEIGHT` | Total Diverted Weight (kg) |
| 251| "सबसे ज्यादा भाव देने वाला रीसाइक्लर कौन है?"| `FIND_TOP_BUYER` | Sort by Max Rate |
| 252| "पास वाला रीसाइक्लर चुनो भले ₹5 कम दे" | `PREFER_PROXIMITY` | Proximity over Price |
| 253| "पैसा हाथ में आते ही माल ले जाने दूंगा" | `HANDOVER_CONTINGENCY` | Escrow / Gate Cash Rule |
| 254| "गाड़ी वाला भाड़ा माँगेगा तो?" | `LOGISTICS_DISPUTE` | Pre-paid Logistics Invariant |
| 255| "डील पक्की समझें?" | `CONFIRM_DEAL_PROMPT` | Trigger Physical Touch Gate |

---

## 7. Relative Deictic References & Contextual Selections (Cases 256–285)
*Utterances relying on screen state, visual position, sorting order, or relative pronouns.*

| # | Spoken Utterance (Vernacular) | Screen Context | Resolved Object / Action |
|---|---|---|---|
| 256| "पहला वाला चुनो" | Marketplace (3 Offers) | `visibleOffers[0]` |
| 257| "बीच वाला कैसा है?" | Marketplace (3 Offers) | `EXPLAIN_OFFER(visibleOffers[1])` |
| 258| "खालचा दाखव" (Show bottom one) | Marketplace (3 Offers) | `Scroll / Select visibleOffers[2]` |
| 259| "सबसे ऊपर जो आ रहा है वही लगा दो" | Marketplace | `visibleOffers[0]` |
| 260| "जो सबसे ज्यादा रुपया दे रहा है" | Marketplace | `maxBy(visibleOffers, 'netPayout')` |
| 261| "जो पास में है वो वाला" | Marketplace | `minBy(visibleOffers, 'distanceKm')` |
| 262| "हरी बत्ती वाला रीसाइक्लर" | Marketplace | Filter by `CPCB_VERIFIED` badge |
| 263| "अरे वो अपैक्स वाला" | Marketplace | Target `Apex Recyclers` |
| 264| "ग्रीनटेक को चुनो" | Marketplace | Target `GreenTech E-Waste` |
| 265| "इकोमार्ट वाले को हटाओ" | Marketplace | Filter out `EcoMart` |
| 266| "इसको बड़ा करके दिखाओ" | Scanner / Card | Expand / Full View Modal |
| 267| "ये लाल रंग का क्या लिखा है?" | Scanner Screen | Read out `Safety Warning Alert` |
| 268| "नीचे जो बटन है वो दबाओ" | Any Screen | Trigger Primary Action Button |
| 269| "पीछे चलो वापस" | Any Modal | `NAVIGATE_BACK` |
| 270| "शुरुआत में ले जाओ" | Sub-screen | `NAVIGATE_TO('HOME')` |
| 271| "तीसरा लॉट खोलो" | Lots List | Open `lots[2]` Receipt |
| 272| "जो अभी-अभी बेचा वो दिखाओ" | Lots List | Open `lots[0]` (Latest Settled) |
| 273| "कल वाला लॉट कहाँ है?" | Lots List | Filter by `Date == Yesterday` |
| 274| "बाकी रोकड़ वाला दिखाओ सिर्फ" | Lots List | Switch tab to `PENDING DUES` |
| 275| "नकद जमा वाला बिल खोलो" | Lots List | Switch tab to `COMPLETED` |
| 276| "ये वाला भाव मुझे नहीं जच रहा" | Marketplace (Selected) | Deselect / View Alternatives |
| 277| "इसको पक्का कर दो" | Acceptance Armed | Prompt Physical Touch Gate |
| 278| "इसे हटा के दूसरा ढूंढो" | Marketplace | Refresh Offers (`invalidateOffers`) |
| 279| "वो जो पहले दिखाया था वही ठीक था" | After re-query | Restore previous selected offer |
| 280| "उसका फोन नंबर मिलेगा?" | Recycler Card | Show authorized plant contact |
| 281| "ये क्यूआर कोड क्या है?" | Handover Receipt | Read out Form-6 Manifest ID |
| 282| "मेरा नाम गलत लिखा है यहाँ" | Profile / Receipt | Open profile name correction |
| 283| "इस पर्ची का फोटो खींचने दो" | Receipt Screen | Trigger download / snapshot |
| 284| "दूसरे नंबर वाला खरीदार कौन है?" | Marketplace | `visibleOffers[1].buyerName` |
| 285| "सब दिखाओ, कोई छुपाओ मत" | Filtered View | Clear all filters (`Show All`) |

---

## 8. Hesitations, Thinking Pauses, Fillers & Barge-In (Cases 286–315)
*Acoustic challenges where collectors hesitate, pause while handling heavy sacks, or interrupt the assistant.*

| # | Spoken Utterance (Vernacular) | Challenge Type | Engine Resolution / Behavior |
|---|---|---|---|
| 286| "उम्मम... मतलब... 10 किलो तार है" | Verbal Filler | Strips *"उम्मम... मतलब..."*, extracts `10 kg Wire`. |
| 287| "अरे यार... वो क्या कहते हैं... मदरबोर्ड" | Lexical Search | Resolves to `High-Grade PCB`. |
| 288| "5 किलो... [pause 2.5s]... और 300 ग्राम" | Split-Turn Pause | Buffer remains open; joins to `5.3 kg`. |
| 289| "तांबा... [heavy breathing 2s]... 8 किलो" | Physical Strain | Ignores breath; extracts `8 kg Copper`. |
| 290| "[TTS is reading rates] -> 'हाँ हाँ ठीक है!'"| Barge-In | Instantly cuts TTS; processes confirmation. |
| 291| "[TTS is explaining safety] -> 'आगे बढ़ो भाई'"| Barge-In | Silences advisory; proceeds to marketplace. |
| 292| "अरे रुको रुको... सोचने दो थोड़ा" | Explicit Hold | Extends listening window by +4.0s. |
| 293| "एक मिनिट थांबा... वजन करतोय" | Marathi Pause | Waits for scale reading without timeout. |
| 294| "हां... हां... हां... 12 किलो" | Repetitive Filler | Collapses repetitions; extracts `12 kg`. |
| 295| "समझे ना भाई? 6 किलो है" | Conversational Tag | Strips *"समझे ना भाई?"*; extracts `6 kg`. |
| 296| "वजन है... अरे रमेश कितना था बे?... हां 14 किलो"| Side Conversation | Filters background chatter; extracts `14 kg`. |
| 297| "[Angle grinder screech in background] 5 किलो"| High-Freq Noise | Bandpass filter cleans audio; parses `5 kg`. |
| 298| "[Truck horn blast: पो पो] 8 किलो लैपटॉप" | Acoustic Impulse | VAD recovers; retains `8 kg Laptop`. |
| 299| "[Metal sheet bang] तांबा बेचना है" | Acoustic Clang | Rejects impulse; latches onto speech. |
| 300| "हूँ... हूँ... अच्छा... ठीक है" | Passive Acknowledgment | Prompts actionable next step. |
| 301| "काहीतरी... काय म्हणतात त्याला... स्क्रीन" | Marathi Hesitation | Resolves to `LCD Panels`. |
| 302| "१०... १५... नाही २० किलो" | Rapid Increments | Selects terminal correction: `20 kg`. |
| 303| "अरे सुनो ना... अरे भाई सुनो" | Attention Getter | "जी बोलिए, मैं सुन रहा हूँ।" |
| 304| "ऐका ना... ऐकताय का?" | Marathi Attention | "हो, सांगा काय माल आहे?" |
| 305| "बोलो मत, सिर्फ सुनो" | System Command | Silences TTS; keeps mic active. |
| 306| "आवाज़ बंद करो अपनी" | Mute Command | Halts TTS playback immediately. |
| 307| "Shut up and listen" | English Barge-In | Immediately silences TTS and listens. |
| 308| "धीरे-धीरे बोलो" | Rate Command | Slows TTS speech playback rate to 0.85x. |
| 309| "जल्दी-जल्दी बताओ टाइम नहीं है" | Rate Command | Increases TTS rate to 1.15x. |
| 310| "अंग्रेजी में मत बक-बक करो" | Language Override | Instantly switches language to Hindi. |
| 311| "मराठीत बोल रे बाबा" | Language Override | Instantly switches language to Marathi. |
| 312| "Speak in English please" | Language Override | Instantly switches language to English. |
| 313| "[Whispering: 2 किलो बैटरी]" | Low Amplitude Voice | Gain normalized; parses `2 kg Battery`. |
| 314| "[Shouting in wind: 5 किलो तांबा]" | High Distortion | Dynamic limiter prevents clipping; parses. |
| 315| "बस इतना ही था" | Completion Cue | Closes turn; proceeds to offer search. |

---

## 9. CPCB Safety, Toxic Hazard Warnings & Emergencies (Cases 316–335)
*Critical health and environmental hazard edge cases where the voice assistant must prevent illegal or dangerous actions.*

| # | Spoken Utterance (Vernacular) | Hazard Detected | Statutory Safety Protocol & Audio Response |
|---|---|---|---|
| 316| "तार को जला के तांबा निकाल लूँ?" | Burning Wire (Dioxin)| **CRITICAL ALERT**: *"तार कभी न जलाएं! जहरीला धुआं फेफड़े गला देता है। छिला हुआ तार का पूरा भाव रीसाइक्लर देगा।"* |
| 317| "बैटरी गरम हो रही है और धुआं निकल रहा है"| Thermal Runaway | *"तुरंत दूर हटें! पानी न डालें, बालू या सूखी मिट्टी डालें। आग का खतरा है।"* |
| 318| "ट्यूब फूट गई, सफेद पाउडर गिर रहा है" | CRT Phosphor / Lead | *"चेतावनी! पाउडर को हाथ न लगाएं, झाड़ू न लगाएं। गीले कपड़े से ढकें और दस्ताने पहनें।"* |
| 319| "हाथ में तेजाब लग गया बैटरी का" | Acid Spill (H2SO4) | *"तुरंत 15 मिनट तक बहते साफ पानी से हाथ धोएं। साबुन न लगाएं, डॉक्टर के पास जाएं।"* |
| 320| "नाली में बहा दूँ क्या बैटरी का पानी?" | Toxic Acid Dumping | *"नाली में कभी न बहाएं! यह कानूनी अपराध है। रीसाइक्लर सीलबंद बैटरी खरीदेगा।"* |
| 321| "कांच का टीवी हथौड़े से तोड़ दूँ?" | Implosion Hazard | *"हथौड़ा न मारें! कांच फूटने से आंखें और चेहरा कट सकता है। पूरा टीवी साबुत बेचें।"* |
| 322| "सर्किट बोर्ड को गैस चूल्हे पर गर्म करूँ?"| Acid / Solder Fumes | *"चूल्हे पर बोर्ड न सेकें! सीसा और पारा हवा में घुलकर जहर बन जाता है।"* |
| 323| "पंखे की मोटर जल गई है क्या बिकेगी?" | Burnt Motor Hazard | Confirms purchase as scrap; warns against bare skin contact. |
| 324| "हाथ कट गया तांबे के तार से" | Physical Injury | Advises first aid / tetanus toxoid injection urgency. |
| 325| "धुआं सूंघने से चक्कर आ रहा है" | Toxic Inhalation | *"तुरंत खुली ताजी हवा में जाएं और गहरा सांस लें।"* |
| 326| "मास्क पहनना जरूरी है क्या?" | Personal Protection | Recommends N95 / cloth mask when sorting PCBs. |
| 327| "बच्चे भी साथ में कबाड़ बीन रहे हैं" | Child Labor Alert | Flags formalization advisory; e-waste sorting restricted to adults. |
| 328| "बैटरी को खुले में फेंक दूँ?" | Environmental Crime | Cites CPCB EPR buyback rules; offers free pickup. |
| 329| "सीएफएल बल्ब फूट गया कमरे में" | Mercury Vapor | *"खिड़कियां खोलें और 20 मिनट कमरे से बाहर रहें।"* |
| 330| "केमिकल से सोना निकाल सकते हैं क्या?" | Informal Cyanide Leach | Warns against illegal cyanide / aqua regia informal extraction. |
| 331| "प्लास्टिक को आग लगा दूँ क्या कचरे में?"| Toxic Fumes | Prohibits open burning; maps to `abs_plastic` scrap tender. |
| 332| "मैग्नेट चिपक गया उंगली दब गई" | Neodymium Pinch | Advises safe sliding separation for rare-earth magnets. |
| 333| "कंप्यूटर की बैटरी चबा ली बच्चे ने" | Medical Emergency | Urgent poison control center recommendation. |
| 334| "दस्ताने नहीं हैं मेरे पास" | Safety Compliance | Advises handling with thick cloth or requesting safety kit. |
| 335| "लीथियम सेल पर हथौड़ा मारूँ?" | Lithium Explosion Risk| Cites severe fire hazard; prohibits piercing or crushing. |

---

## 10. Frustration, Cancellation, Confusion & Navigation (Cases 336–355)
*Edge cases where the user is confused, angry, wants to cancel, or needs help navigating the interface.*

| # | Spoken Utterance (Vernacular) | Emotional State | System Resolution / Action |
|---|---|---|---|
| 336| "अरे मुझे कुछ समझ नहीं आ रहा!" | Confused / Overwhelmed| Simplifies UI: *"चिंता मत कीजिए। बस कैमरे के सामने माल रखिए।"* |
| 337| "बंद करो ये सब झंझट" | Frustrated / Exit | Disarms active flow: *"ठीक है, सब बंद कर दिया गया है।"* |
| 338| "हटाओ इसको, नहीं बेचना मुझे" | Cancellation | Clears draft lot; navigates back to Home. |
| 339| "वापस जाओ, गलत बटन दब गया" | Mistake Correction | `NAVIGATE_BACK` to previous valid screen. |
| 340| "कैंसिल करो सारा सौदा" | Total Cancellation | Wipes pending transaction intent; releases locked lot. |
| 341| "मदद करो मेरी" | Explicit Help | Plays comprehensive voice onboarding tour. |
| 342| "ये ऐप कैसे काम करता है?" | How-It-Works Query | Explains 3-step voice flow (Scan &rarr; Price &rarr; Cash). |
| 343| "तूने गलत भाव लगा दिया मेरा!" | Accusation / Anger | Explains CPCB benchmark calculation transparently. |
| 344| "वजन 10 बोला था 5 क्यों लिखा?" | Discrepancy Dispute | Re-opens weight editor: *"माफ़ कीजिए, नया वजन बताइए?"* |
| 345| "दिमाग खराब मत करो" | Hostility | Responds with respectful brevity: *"जी, बताइए क्या करना है?"* |
| 346| "मला बाहेर पडायचं आहे" (Want to exit)| Marathi Exit | Navigates to main home dashboard. |
| 347| "सगळं रद्द करा" (Cancel all) | Marathi Cancel | Disarms and wipes active draft. |
| 348| "काय चाललंय मला काही कळत नाही" | Marathi Confusion | Switches to pictorial simple step-by-step mode. |
| 349| "स्क्रीन अडकली आहे" (Screen stuck) | UI Freezing Claim | Resets UI state container; confirms audio feedback. |
| 350| "वापस पहले पेज पर चलो" | Navigation | `NAVIGATE_TO('HOME')` |
| 351| "मेरा पुराना बिल दिखाओ" | Navigation | `NAVIGATE_TO('LOTS_LIST')` |
| 352| "कैमरा खोलो वापस" | Navigation | `NAVIGATE_TO('SCANNER')` |
| 353| "रेट लिस्ट दिखाओ" | Navigation | `NAVIGATE_TO('PRICE_BOARD')` |
| 354| "सुरक्षा नियम बताओ" | Navigation | `NAVIGATE_TO('SAFETY')` |
| 355| "सब ठीक है, अब रहने दो" | Session Conclusion | "बहुत बढ़िया! आपका दिन शुभ रहे।" |

---
*Catalog Complete — 355 Real-World Vernacular Edge Cases Documented for SIH 2026 Problem Statement 2*
