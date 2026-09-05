import os
import asyncio
import edge_tts

OUTPUT_DIR = os.path.join("public", "audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Studio Voice Map using Indian Neural Voices
# hi: hi-IN-SwaraNeural (Warm, clear, natural Hindi)
# mr: mr-IN-AarohiNeural (Warm, authentic Marathi)
# en: en-IN-NeerjaNeural (Natural Indian English)

CLIPS = [
    # 1. 10 kg Laptops / Best Offers Found
    {
        "filename": "buyers_found_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "10 किलो लैपटॉप के लिए 3 verified buyers मिले हैं। सबसे अच्छा दाम 2,960 रुपये है।"
    },
    {
        "filename": "buyers_found_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "१० किलो लॅपटॉपसाठी 3 verified खरेदीदार मिळाले आहेत. सर्वोत्तम भाव 2,960 रुपये आहे."
    },
    {
        "filename": "buyers_found_en.mp3",
        "voice": "en-IN-NeerjaNeural",
        "text": "Found 3 verified buyers for 10 kg laptops. Top payout is 2,960 rupees with free pickup."
    },

    # 2. 25 kg Batteries
    {
        "filename": "battery_found_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "25 किलो बैटरी के लिए EcoGreen Recyclers का ₹2,375 का ऑफर उपलब्ध है।"
    },
    {
        "filename": "battery_found_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "२५ किलो बॅटरीसाठी ₹२,३७५ ची सर्वोत्तम ऑफर उपलब्ध आहे."
    },
    {
        "filename": "battery_found_en.mp3",
        "voice": "en-IN-NeerjaNeural",
        "text": "Found verified offer of 2,375 rupees for 25 kg battery scrap."
    },

    # 3. 15 kg Copper Wire
    {
        "filename": "wire_found_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "15 किलो तांबे तार के लिए Apex E-Recovery का ₹6,750 का ऑफर तैयार है।"
    },
    {
        "filename": "wire_found_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "१५ किलो तांब्याच्या तारेसाठी ₹६,७५० ची ऑफर तयार आहे."
    },
    {
        "filename": "wire_found_en.mp3",
        "voice": "en-IN-NeerjaNeural",
        "text": "15 kg copper wire valuation ready. Top offer is 6,750 rupees."
    },

    # 4. Show Receipts
    {
        "filename": "receipts_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "आपकी पिछली 3 CPCB अधिकृत रसीदें स्क्रीन पर दिखा दी गई हैं।"
    },
    {
        "filename": "receipts_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "तुमच्या मागील ३ अधिकृत CPCB पावत्या स्क्रीनवर दाखवल्या आहेत."
    },
    {
        "filename": "receipts_en.mp3",
        "voice": "en-IN-NeerjaNeural",
        "text": "Displaying your verified CPCB receipts and handover history."
    },

    # 5. Weight Updated
    {
        "filename": "weight_updated_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "वजन बदलकर 7 किलो कर दिया है। नया दाम लगभग 2,072 रुपये है।"
    },
    {
        "filename": "weight_updated_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "वजन बदलून ७ किलो केले आहे. नवीन भाव सुमारे २,०७२ रुपये आहे."
    },

    # 6. Offer Selected & High Value Hold
    {
        "filename": "offer_selected_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "Apex E-Recovery का 2,960 रुपये वाला ऑफर चुन लिया गया है।"
    },
    {
        "filename": "offer_selected_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "Apex E-Recovery ची २,९६० रुपयांची ऑफर निवडली आहे."
    },
    {
        "filename": "high_value_hold_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "1,24,600 रुपये का बड़ा सौदा है। पक्का करने के लिए 5 सेकंड दबा कर रखें।"
    },
    {
        "filename": "high_value_hold_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "१,२४,६०० रुपयांचा मोठा व्यवहार आहे. पक्का करण्यासाठी ५ सेकंद दाबून ठेवा."
    },

    # 7. Commit Success
    {
        "filename": "committed_success_hi.mp3",
        "voice": "hi-IN-SwaraNeural",
        "text": "सौदा पक्का हो गया। CPCB रसीद और पिकअप कोड तैयार है।"
    },
    {
        "filename": "committed_success_mr.mp3",
        "voice": "mr-IN-AarohiNeural",
        "text": "सौदा पक्का झाला. CPCB पावती आणि पिकअप कोड तयार आहे."
    },
    {
        "filename": "committed_success_en.mp3",
        "voice": "en-IN-NeerjaNeural",
        "text": "Transaction committed. Your CPCB receipt and pickup code are generated."
    }
]

async def generate_all():
    print(f"Generating {len(CLIPS)} neural voice clips...")
    for item in CLIPS:
        dest = os.path.join(OUTPUT_DIR, item["filename"])
        tts = edge_tts.Communicate(item["text"], item["voice"])
        await tts.save(dest)
        print(f"Generated: {item['filename']}")
    print("All neural audio clips generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())
