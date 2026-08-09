# Seed knowledge base documents.
# In production these would be Admin-curated via the KB Manager (ADD §10.6).
# For MVP we seed them directly so the chatbot has grounded medical content.

KB_DOCUMENTS = [
    {
        "docId": "kb_001",
        "title": "Snake Bite — First Aid",
        "collection": "first_aid",
        "body": (
            "If someone is bitten by a snake, treat it as an emergency. Keep the person calm "
            "and still to slow the spread of venom. Immobilize the bitten limb and keep it below "
            "heart level. Remove tight clothing or jewelry near the bite. Note the time of the bite "
            "and try to remember the snake's appearance without approaching it again. Do not apply a "
            "tourniquet, do not cut the wound, and do not try to suck out the venom. Do not give food "
            "or drink. Call emergency services (108) immediately."
        ),
    },
    {
        "docId": "kb_002",
        "title": "Burns — First Aid",
        "collection": "first_aid",
        "body": (
            "For minor burns, cool the burn under cool running water for 10 to 20 minutes. Do not use "
            "ice, ice water, or greasy creams or toothpaste. Cover the burn with a clean, dry cloth. "
            "Do not pop blisters. For severe burns, or burns on the face, hands, feet, or genitals, "
            "call emergency services (108) immediately. Do not remove clothing that is stuck to the burn."
        ),
    },
    {
        "docId": "kb_003",
        "title": "Choking — First Aid",
        "collection": "first_aid",
        "body": (
            "If someone is choking and cannot breathe, speak, or cough, perform abdominal thrusts, also "
            "called the Heimlich maneuver. Stand behind the person and wrap your arms around their waist. "
            "Make a fist with one hand and place it just above the navel. Grasp the fist with your other "
            "hand and give quick upward thrusts. Repeat until the object is dislodged or the person becomes "
            "unconscious. If the person becomes unconscious, start CPR and call emergency services (108)."
        ),
    },
    {
        "docId": "kb_004",
        "title": "Heart Attack — Warning Signs and Response",
        "collection": "emergency_procedures",
        "body": (
            "Warning signs of a heart attack include chest pain or pressure, pain spreading to the arm, "
            "neck, or jaw, shortness of breath, sweating, and nausea. If you suspect a heart attack, call "
            "emergency services (108) immediately. Have the person sit down and rest. If they are not "
            "allergic to aspirin and have no bleeding disorders, they may chew one aspirin while waiting. "
            "Do not leave the person alone."
        ),
    },
    {
        "docId": "kb_005",
        "title": "Stroke — FAST Recognition",
        "collection": "emergency_procedures",
        "body": (
            "Use the FAST test to recognize a stroke. Face: ask the person to smile and check if one side "
            "droops. Arms: ask them to raise both arms and check if one drifts downward. Speech: ask them to "
            "repeat a simple phrase and check if speech is slurred or strange. Time: if you see any of these "
            "signs, call emergency services (108) immediately. Note the time symptoms began, because treatment "
            "is most effective when given quickly."
        ),
    },
    {
        "docId": "kb_006",
        "title": "Seizure — First Aid",
        "collection": "emergency_procedures",
        "body": (
            "If someone is having a seizure, stay calm and keep them safe. Ease them to the floor and clear "
            "away hard or sharp objects. Place something soft under their head. Do not hold them down or put "
            "anything in their mouth. Time the seizure. After it ends, turn them onto their side to help "
            "breathing. Call emergency services (108) if the seizure lasts more than five minutes, if the "
            "person is injured, or if they have difficulty breathing afterward."
        ),
    },
    {
        "docId": "kb_007",
        "title": "Nurse vs Caretaker — Choosing the Right Professional",
        "collection": "home_care",
        "body": (
            "A nurse is a trained and licensed medical professional who can perform clinical tasks such as "
            "wound dressing, administering medication, monitoring vitals, giving injections, and post-surgical "
            "care. A caretaker provides non-medical support such as help with bathing, feeding, mobility, "
            "companionship, and daily activities. Choose a nurse if the patient needs medical or clinical "
            "attention. Choose a caretaker if the patient mainly needs help with daily living activities and "
            "companionship."
        ),
    },
    {
        "docId": "kb_008",
        "title": "Post-Surgical Home Care",
        "collection": "home_care",
        "body": (
            "After surgery, patients often need home care for recovery. This may include wound care and "
            "dressing changes, monitoring for signs of infection, managing pain medication as prescribed, "
            "helping with mobility, and watching for complications. A trained nurse is usually recommended for "
            "the first one to two weeks after surgery for clinical care, after which a caretaker can help with "
            "daily activities as the patient recovers."
        ),
    },
    {
        "docId": "kb_009",
        "title": "Wound Care and Dressing Basics",
        "collection": "home_care",
        "body": (
            "Proper wound care prevents infection and promotes healing. Wash your hands before touching the "
            "wound. Clean the wound gently as instructed by a doctor. Apply a sterile dressing and change it "
            "as directed. Watch for signs of infection such as increasing redness, swelling, warmth, pus, or "
            "fever. If any signs of infection appear, contact a doctor. A trained nurse can perform regular "
            "wound dressing at home."
        ),
    },
    {
        "docId": "kb_010",
        "title": "Managing Fever at Home",
        "collection": "general_medical",
        "body": (
            "For a mild fever, rest and drink plenty of fluids. You may use over-the-counter fever reducers as "
            "directed on the label or by a doctor. Wear light clothing and keep the room comfortable. Monitor "
            "the temperature regularly. See a doctor if the fever is very high, lasts more than a few days, or "
            "is accompanied by severe headache, rash, difficulty breathing, or confusion. For infants and young "
            "children with fever, consult a doctor promptly."
        ),
    },
    {
        "docId": "kb_011",
        "title": "When to See a Doctor vs Self-Care",
        "collection": "general_medical",
        "body": (
            "Seek medical attention if symptoms are severe, worsening, or persistent. Warning signs that need "
            "urgent care include difficulty breathing, chest pain, sudden weakness or numbness, confusion, "
            "severe or persistent vomiting, high fever that does not improve, or uncontrolled bleeding. For "
            "mild, common symptoms like a minor cold, rest and fluids are often enough. When in doubt, consult "
            "a qualified doctor rather than self-diagnosing."
        ),
    },
    {
        "docId": "kb_012",
        "title": "Diabetes Home Care Basics",
        "collection": "general_medical",
        "body": (
            "Managing diabetes at home involves monitoring blood sugar levels as advised, taking prescribed "
            "medication on time, eating balanced meals, and staying physically active as able. Caregivers can "
            "help with medication reminders, meal preparation, and monitoring for warning signs of very high or "
            "very low blood sugar. Signs of low blood sugar include sweating, shakiness, and confusion. A trained "
            "nurse can help with insulin administration and regular monitoring."
        ),
    },
]