"use client";

import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string };
type LocationInfo = { latitude:number; longitude:number; city:string; district?:string; state?:string; country?:string; displayName:string };
type DailyScan = { id:string; dayNumber:number; dateKey:string; timezone?:string; farmStartDate?:string; capturedAt:string; imageFile:string; crop?:string; notes?:string; location?:LocationInfo; analysis:any };
type Message = { role:"user"|"assistant"; content:string };

type LanguageCode = "en"|"hi"|"te"|"ta"|"kn"|"ml"|"mr"|"bn";
type SpeechRecognitionLike = {
  lang:string;
  interimResults:boolean;
  continuous:boolean;
  onresult: ((event:any)=>void) | null;
  onerror: ((event:any)=>void) | null;
  onend: (()=>void) | null;
  start: ()=>void;
  stop: ()=>void;
};

const LANGUAGES: {code:LanguageCode; label:string; native:string; speech:string}[] = [
  {code:"en",label:"English",native:"English",speech:"en-IN"},
  {code:"hi",label:"Hindi",native:"हिन्दी",speech:"hi-IN"},
  {code:"te",label:"Telugu",native:"తెలుగు",speech:"te-IN"},
  {code:"ta",label:"Tamil",native:"தமிழ்",speech:"ta-IN"},
  {code:"kn",label:"Kannada",native:"ಕನ್ನಡ",speech:"kn-IN"},
  {code:"ml",label:"Malayalam",native:"മലയാളം",speech:"ml-IN"},
  {code:"mr",label:"Marathi",native:"मराठी",speech:"mr-IN"},
  {code:"bn",label:"Bengali",native:"বাংলা",speech:"bn-IN"}
];

const UI_TEXT: Record<LanguageCode, Record<string,string>> = {
  en: {
    welcome:"WELCOME TO YOUR FARM DESK", choose:"What would you like to do today?", chooseSub:"Choose one path. AgriAI will guide you step-by-step without technical jargon.",
    daily:"Start Daily Farming", dailyDesc:"Set up your location, weather, growing space and get crops that fit your conditions. Then begin your day-by-day farm journal.",
    ask:"Ask About My Crop", askDesc:"Ask about disease, pests, leaves, watering, nutrition, growth or upload a photograph.",
    startFarm:"Start my farm →", askAI:"Ask AgriAI →", language:"Language", voice:"Voice assistant", listen:"🔊 Read aloud", speak:"🎙️ Speak", stop:"Stop",
    farmPlan:"Let's build your farm plan.", location:"Where is your farm?", measure:"Measure the space you can actually grow in",
    crops:"Crops that fit your conditions", calculate:"Calculate suitable crops →", select:"Select",
    foundation:"FARM FOUNDATION · BEFORE DAY 1", prepare:"Prepare the bed, water path and planting points",
    planted:"I have prepared the bed & planted → Start Day 1", dailyPlan:"TODAY'S FARM PLAN", actions:"Day actions",
    weather:"Check the weather", root:"Check the root zone", scout:"Scout the crop", photo:"Post today's photo",
    askHappening:"Tell AgriAI what is happening.", crop:"Crop", photoCheck:"PHOTO CHECK", showPlant:"Show me the plant",
    askPlaceholder:"Ask in your own words — for example: My tomato leaves have brown spots after three days of rain.",
    back:"← Back", home:"Home", changeCrop:"Change crop", signOut:"Sign out", evidence:"Evidence-first mode"
  },
  hi: {
    welcome:"आपके खेत डेस्क में आपका स्वागत है", choose:"आज आप क्या करना चाहते हैं?", chooseSub:"एक विकल्प चुनें। AgriAI आपको आसान भाषा में कदम-दर-कदम मार्गदर्शन देगा।",
    daily:"दैनिक खेती शुरू करें", dailyDesc:"स्थान, मौसम और खेत की जगह सेट करें और अपनी परिस्थितियों के अनुसार फसल चुनें। फिर रोज़ की खेती डायरी शुरू करें।",
    ask:"अपनी फसल के बारे में पूछें", askDesc:"रोग, कीट, पत्तियां, पानी, पोषण या वृद्धि के बारे में पूछें या फोटो भेजें।",
    startFarm:"अपना खेत शुरू करें →", askAI:"AgriAI से पूछें →", language:"भाषा", voice:"आवाज़ सहायक", listen:"🔊 सुनें", speak:"🎙️ बोलें", stop:"रोकें",
    farmPlan:"आइए आपका खेत प्लान बनाएं।", location:"आपका खेत कहाँ है?", measure:"जहाँ आप वास्तव में खेती करेंगे उस जगह को मापें",
    crops:"आपकी परिस्थितियों के लिए उपयुक्त फसलें", calculate:"उपयुक्त फसलें निकालें →", select:"चुनें",
    foundation:"खेत की तैयारी · दिन 1 से पहले", prepare:"क्यारी, पानी का रास्ता और रोपण स्थान तैयार करें",
    planted:"मैंने क्यारी तैयार करके पौधा/बीज लगा दिया → दिन 1 शुरू करें", dailyPlan:"आज का खेत प्लान", actions:"आज के काम",
    weather:"मौसम देखें", root:"जड़ क्षेत्र की नमी देखें", scout:"फसल की जांच करें", photo:"आज की फोटो डालें",
    askHappening:"AgriAI को बताएं क्या हो रहा है।", crop:"फसल", photoCheck:"फोटो जांच", showPlant:"पौधे की फोटो दिखाएं",
    askPlaceholder:"अपनी भाषा में पूछें — जैसे: तीन दिन बारिश के बाद मेरे टमाटर के पत्तों पर भूरे धब्बे हैं।",
    back:"← वापस", home:"होम", changeCrop:"फसल बदलें", signOut:"बाहर निकलें", evidence:"सबूत-आधारित मोड"
  },
  te: {
    welcome:"మీ వ్యవసాయ డెస్క్‌కు స్వాగతం", choose:"ఈ రోజు మీరు ఏమి చేయాలనుకుంటున్నారు?", chooseSub:"ఒక మార్గాన్ని ఎంచుకోండి. AgriAI సులభమైన భాషలో దశలవారీగా మార్గనిర్దేశం చేస్తుంది.",
    daily:"రోజువారీ సాగు ప్రారంభించండి", dailyDesc:"స్థానం, వాతావరణం, స్థలాన్ని నమోదు చేసి మీ పరిస్థితులకు సరిపోయే పంటను ఎంచుకోండి. తర్వాత రోజువారీ వ్యవసాయ డైరీ ప్రారంభమవుతుంది.",
    ask:"నా పంట గురించి అడగండి", askDesc:"వ్యాధులు, పురుగులు, ఆకులు, నీరు, పోషకాలు లేదా పెరుగుదల గురించి అడగండి లేదా ఫోటో పంపండి.",
    startFarm:"నా పొలాన్ని ప్రారంభించండి →", askAI:"AgriAIని అడగండి →", language:"భాష", voice:"వాయిస్ సహాయకుడు", listen:"🔊 వినండి", speak:"🎙️ మాట్లాడండి", stop:"ఆపండి",
    farmPlan:"మీ పొలం ప్రణాళికను తయారు చేద్దాం.", location:"మీ పొలం ఎక్కడ ఉంది?", measure:"మీరు నిజంగా సాగు చేయగల స్థలాన్ని కొలవండి",
    crops:"మీ పరిస్థితులకు సరిపోయే పంటలు", calculate:"సరిపోయే పంటలను లెక్కించండి →", select:"ఎంచుకోండి",
    foundation:"పొలం సిద్ధం · 1వ రోజుకు ముందు", prepare:"మట్టి, నీటి మార్గం మరియు విత్తే ప్రదేశాలను సిద్ధం చేయండి",
    planted:"మట్టి సిద్ధం చేసి విత్తనం/మొక్క నాటాను → 1వ రోజు ప్రారంభించండి", dailyPlan:"ఈరోజు పొలం ప్రణాళిక", actions:"ఈరోజు పనులు",
    weather:"వాతావరణాన్ని చూడండి", root:"వేర్ల ప్రాంత తేమను చూడండి", scout:"పంటను పరిశీలించండి", photo:"ఈరోజు ఫోటో పంపండి",
    askHappening:"ఏం జరుగుతుందో AgriAIకి చెప్పండి.", crop:"పంట", photoCheck:"ఫోటో తనిఖీ", showPlant:"మొక్క ఫోటో చూపండి",
    askPlaceholder:"మీ భాషలో అడగండి — ఉదా: మూడు రోజుల వర్షం తర్వాత నా టమాటా ఆకులపై గోధుమ మచ్చలు ఉన్నాయి.",
    back:"← వెనక్కి", home:"హోమ్", changeCrop:"పంట మార్చండి", signOut:"సైన్ అవుట్", evidence:"సాక్ష్య ఆధారిత మోడ్"
  },
  ta: {
    welcome:"உங்கள் விவசாய மேசைக்கு வரவேற்கிறோம்", choose:"இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?", chooseSub:"ஒரு வழியைத் தேர்ந்தெடுக்கவும். AgriAI எளிய மொழியில் படிப்படியாக வழிகாட்டும்.",
    daily:"தினசரி விவசாயத்தை தொடங்குங்கள்", dailyDesc:"இடம், வானிலை, நில அளவை அமைத்து பொருத்தமான பயிரைத் தேர்ந்தெடுக்கவும். பின்னர் தினசரி பண்ணை பதிவேடு தொடங்கும்.",
    ask:"என் பயிரைப் பற்றி கேளுங்கள்", askDesc:"நோய், பூச்சி, இலை, நீர், ஊட்டச்சத்து அல்லது வளர்ச்சி பற்றி கேளுங்கள் அல்லது புகைப்படம் அனுப்புங்கள்.",
    startFarm:"என் பண்ணையை தொடங்கு →", askAI:"AgriAIயிடம் கேளுங்கள் →", language:"மொழி", voice:"குரல் உதவி", listen:"🔊 கேளுங்கள்", speak:"🎙️ பேசுங்கள்", stop:"நிறுத்து",
    farmPlan:"உங்கள் பண்ணை திட்டத்தை உருவாக்கலாம்.", location:"உங்கள் பண்ணை எங்கே உள்ளது?", measure:"நீங்கள் உண்மையில் பயிரிடும் இடத்தை அளவிடுங்கள்",
    crops:"உங்கள் நிலைக்கு பொருத்தமான பயிர்கள்", calculate:"பொருத்தமான பயிர்களை கணக்கிடு →", select:"தேர்வு",
    foundation:"பண்ணை தயாரிப்பு · நாள் 1க்கு முன்", prepare:"படுக்கை, நீர் பாதை மற்றும் நடவு இடங்களை தயார் செய்யுங்கள்",
    planted:"படுக்கையை தயார் செய்து விதை/நாற்று நட்டுவிட்டேன் → நாள் 1 தொடங்கு", dailyPlan:"இன்றைய பண்ணை திட்டம்", actions:"இன்றைய பணிகள்",
    weather:"வானிலையை சரிபார்க்கவும்", root:"வேர் பகுதி ஈரப்பதத்தை சரிபார்க்கவும்", scout:"பயிரை ஆய்வு செய்யவும்", photo:"இன்றைய புகைப்படத்தை அனுப்பவும்",
    askHappening:"என்ன நடக்கிறது என்று AgriAIக்கு சொல்லுங்கள்.", crop:"பயிர்", photoCheck:"புகைப்பட சோதனை", showPlant:"தாவர புகைப்படத்தை காட்டுங்கள்",
    askPlaceholder:"உங்கள் மொழியில் கேளுங்கள் — உதா: மூன்று நாட்கள் மழைக்குப் பிறகு என் தக்காளி இலைகளில் பழுப்பு புள்ளிகள் உள்ளன.",
    back:"← பின்செல்", home:"முகப்பு", changeCrop:"பயிரை மாற்று", signOut:"வெளியேறு", evidence:"ஆதார அடிப்படையிலான முறை"
  },
  kn: {
    welcome:"ನಿಮ್ಮ ಕೃಷಿ ಡೆಸ್ಕ್‌ಗೆ ಸ್ವಾಗತ", choose:"ಇಂದು ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?", chooseSub:"ಒಂದು ಆಯ್ಕೆಮಾಡಿ. AgriAI ಸರಳ ಭಾಷೆಯಲ್ಲಿ ಹಂತ ಹಂತವಾಗಿ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ.",
    daily:"ದೈನಂದಿನ ಕೃಷಿ ಪ್ರಾರಂಭಿಸಿ", dailyDesc:"ಸ್ಥಳ, ಹವಾಮಾನ ಮತ್ತು ಜಾಗವನ್ನು ನಮೂದಿಸಿ ಸೂಕ್ತ ಬೆಳೆ ಆಯ್ಕೆಮಾಡಿ. ನಂತರ ದಿನನಿತ್ಯದ ಕೃಷಿ ಡೈರಿ ಆರಂಭವಾಗುತ್ತದೆ.",
    ask:"ನನ್ನ ಬೆಳೆಯ ಬಗ್ಗೆ ಕೇಳಿ", askDesc:"ರೋಗ, ಕೀಟ, ಎಲೆ, ನೀರು, ಪೋಷಕಾಂಶ ಅಥವಾ ಬೆಳವಣಿಗೆ ಬಗ್ಗೆ ಕೇಳಿ ಅಥವಾ ಫೋಟೋ ಕಳುಹಿಸಿ.",
    startFarm:"ನನ್ನ ಹೊಲ ಪ್ರಾರಂಭಿಸಿ →", askAI:"AgriAIಯನ್ನು ಕೇಳಿ →", language:"ಭಾಷೆ", voice:"ಧ್ವನಿ ಸಹಾಯಕ", listen:"🔊 ಕೇಳಿ", speak:"🎙️ ಮಾತನಾಡಿ", stop:"ನಿಲ್ಲಿಸಿ",
    farmPlan:"ನಿಮ್ಮ ಹೊಲದ ಯೋಜನೆ ಮಾಡೋಣ.", location:"ನಿಮ್ಮ ಹೊಲ ಎಲ್ಲಿದೆ?", measure:"ನೀವು ನಿಜವಾಗಿ ಬೆಳೆಸುವ ಜಾಗವನ್ನು ಅಳೆಯಿರಿ",
    crops:"ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಗೆ ಹೊಂದುವ ಬೆಳೆಗಳು", calculate:"ಸೂಕ್ತ ಬೆಳೆಗಳನ್ನು ಲೆಕ್ಕಿಸಿ →", select:"ಆಯ್ಕೆ",
    foundation:"ಹೊಲದ ಸಿದ್ಧತೆ · ದಿನ 1ಕ್ಕೂ ಮೊದಲು", prepare:"ಬೆಡ್, ನೀರಿನ ದಾರಿ ಮತ್ತು ನೆಡುವ ಸ್ಥಳಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ",
    planted:"ಬೆಡ್ ಸಿದ್ಧ ಮಾಡಿ ಬೀಜ/ಸಸಿ ನೆಟ್ಟಿದ್ದೇನೆ → ದಿನ 1 ಪ್ರಾರಂಭಿಸಿ", dailyPlan:"ಇಂದಿನ ಹೊಲ ಯೋಜನೆ", actions:"ಇಂದಿನ ಕೆಲಸಗಳು",
    weather:"ಹವಾಮಾನ ಪರಿಶೀಲಿಸಿ", root:"ಬೇರು ಪ್ರದೇಶದ ತೇವಾಂಶ ಪರಿಶೀಲಿಸಿ", scout:"ಬೆಳೆ ಪರಿಶೀಲಿಸಿ", photo:"ಇಂದಿನ ಫೋಟೋ ಕಳುಹಿಸಿ",
    askHappening:"ಏನು ನಡೆಯುತ್ತಿದೆ ಎಂದು AgriAIಗೆ ಹೇಳಿ.", crop:"ಬೆಳೆ", photoCheck:"ಫೋಟೋ ಪರಿಶೀಲನೆ", showPlant:"ಸಸ್ಯದ ಫೋಟೋ ತೋರಿಸಿ",
    askPlaceholder:"ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಿ — ಉದಾ: ಮೂರು ದಿನ ಮಳೆಯಾದ ನಂತರ ನನ್ನ ಟೊಮ್ಯಾಟೊ ಎಲೆಗಳಲ್ಲಿ ಕಂದು ಕಲೆಗಳಿವೆ.",
    back:"← ಹಿಂದೆ", home:"ಮುಖಪುಟ", changeCrop:"ಬೆಳೆ ಬದಲಿಸಿ", signOut:"ಸೈನ್ ಔಟ್", evidence:"ಸಾಕ್ಷ್ಯ ಆಧಾರಿತ ಮೋಡ್"
  },
  ml: {
    welcome:"നിങ്ങളുടെ കൃഷി ഡെസ്കിലേക്ക് സ്വാഗതം", choose:"ഇന്ന് നിങ്ങൾ എന്ത് ചെയ്യാൻ ആഗ്രഹിക്കുന്നു?", chooseSub:"ഒരു വഴി തിരഞ്ഞെടുക്കൂ. AgriAI ലളിതമായ ഭാഷയിൽ ഘട്ടംഘട്ടമായി സഹായിക്കും.",
    daily:"ദൈനംദിന കൃഷി ആരംഭിക്കുക", dailyDesc:"സ്ഥലം, കാലാവസ്ഥ, കൃഷിസ്ഥലം സജ്ജമാക്കി അനുയോജ്യമായ വിള തിരഞ്ഞെടുക്കുക. തുടർന്ന് ദിവസേനയുള്ള കൃഷി ഡയറി ആരംഭിക്കും.",
    ask:"എന്റെ വിളയെക്കുറിച്ച് ചോദിക്കുക", askDesc:"രോഗം, കീടങ്ങൾ, ഇലകൾ, വെള്ളം, പോഷണം, വളർച്ച എന്നിവയെക്കുറിച്ച് ചോദിക്കാം അല്ലെങ്കിൽ ഫോട്ടോ അയക്കാം.",
    startFarm:"എന്റെ കൃഷി ആരംഭിക്കുക →", askAI:"AgriAIയോട് ചോദിക്കുക →", language:"ഭാഷ", voice:"വോയ്സ് സഹായി", listen:"🔊 കേൾക്കുക", speak:"🎙️ സംസാരിക്കുക", stop:"നിർത്തുക",
    farmPlan:"നിങ്ങളുടെ കൃഷി പദ്ധതി തയ്യാറാക്കാം.", location:"നിങ്ങളുടെ കൃഷിയിടം എവിടെയാണ്?", measure:"യഥാർത്ഥത്തിൽ കൃഷി ചെയ്യാവുന്ന സ്ഥലം അളക്കുക",
    crops:"നിങ്ങളുടെ സാഹചര്യത്തിന് അനുയോജ്യമായ വിളകൾ", calculate:"അനുയോജ്യമായ വിളകൾ കണക്കാക്കുക →", select:"തിരഞ്ഞെടുക്കുക",
    foundation:"കൃഷി തയ്യാറാക്കൽ · ദിവസം 1 ന് മുമ്പ്", prepare:"കിടക്ക, ജലപാത, നടീൽ സ്ഥലങ്ങൾ തയ്യാറാക്കുക",
    planted:"കിടക്ക തയ്യാറാക്കി വിത്ത്/തൈ നട്ടു → ദിവസം 1 ആരംഭിക്കുക", dailyPlan:"ഇന്നത്തെ കൃഷി പദ്ധതി", actions:"ഇന്നത്തെ ജോലികൾ",
    weather:"കാലാവസ്ഥ പരിശോധിക്കുക", root:"വേരിടത്തിലെ ഈർപ്പം പരിശോധിക്കുക", scout:"വിള പരിശോധിക്കുക", photo:"ഇന്നത്തെ ഫോട്ടോ അയക്കുക",
    askHappening:"എന്താണ് സംഭവിക്കുന്നതെന്ന് AgriAIയോട് പറയൂ.", crop:"വിള", photoCheck:"ഫോട്ടോ പരിശോധന", showPlant:"ചെടിയുടെ ഫോട്ടോ കാണിക്കുക",
    askPlaceholder:"നിങ്ങളുടെ ഭാഷയിൽ ചോദിക്കൂ — ഉദാ: മൂന്ന് ദിവസത്തെ മഴയ്ക്ക് ശേഷം എന്റെ തക്കാളി ഇലകളിൽ തവിട്ട് പാടുകൾ ഉണ്ട്.",
    back:"← പിന്നിലേക്ക്", home:"ഹോം", changeCrop:"വിള മാറ്റുക", signOut:"പുറത്ത് പോകുക", evidence:"തെളിവ് അടിസ്ഥാന മോഡ്"
  },
  mr: {
    welcome:"तुमच्या शेती डेस्कमध्ये स्वागत", choose:"आज तुम्हाला काय करायचे आहे?", chooseSub:"एक पर्याय निवडा. AgriAI सोप्या भाषेत टप्प्याटप्प्याने मार्गदर्शन करेल.",
    daily:"दैनंदिन शेती सुरू करा", dailyDesc:"स्थान, हवामान आणि जागा सेट करून योग्य पीक निवडा. त्यानंतर रोजची शेती डायरी सुरू होईल.",
    ask:"माझ्या पिकाबद्दल विचारा", askDesc:"रोग, किडी, पाने, पाणी, पोषण किंवा वाढ याबद्दल विचारा किंवा फोटो पाठवा.",
    startFarm:"माझे शेत सुरू करा →", askAI:"AgriAI ला विचारा →", language:"भाषा", voice:"आवाज सहाय्यक", listen:"🔊 ऐका", speak:"🎙️ बोला", stop:"थांबा",
    farmPlan:"तुमच्या शेताचा आराखडा बनवूया.", location:"तुमचे शेत कुठे आहे?", measure:"जिथे प्रत्यक्ष लागवड करणार आहात ती जागा मोजा",
    crops:"तुमच्या परिस्थितीसाठी योग्य पिके", calculate:"योग्य पिके मोजा →", select:"निवडा",
    foundation:"शेताची तयारी · दिवस 1 पूर्वी", prepare:"वाफा, पाण्याचा मार्ग आणि लागवडीची ठिकाणे तयार करा",
    planted:"वाफा तयार करून बियाणे/रोप लावले → दिवस 1 सुरू करा", dailyPlan:"आजचा शेती आराखडा", actions:"आजची कामे",
    weather:"हवामान तपासा", root:"मुळाजवळील ओलावा तपासा", scout:"पीक तपासा", photo:"आजचा फोटो पाठवा",
    askHappening:"काय होत आहे ते AgriAI ला सांगा.", crop:"पीक", photoCheck:"फोटो तपासणी", showPlant:"झाडाचा फोटो दाखवा",
    askPlaceholder:"तुमच्या भाषेत विचारा — उदा: तीन दिवस पावसानंतर माझ्या टोमॅटोच्या पानांवर तपकिरी डाग आहेत.",
    back:"← मागे", home:"मुख्यपृष्ठ", changeCrop:"पीक बदला", signOut:"साइन आउट", evidence:"पुराव्यावर आधारित मोड"
  },
  bn: {
    welcome:"আপনার কৃষি ডেস্কে স্বাগতম", choose:"আজ আপনি কী করতে চান?", chooseSub:"একটি পথ বেছে নিন। AgriAI সহজ ভাষায় ধাপে ধাপে সাহায্য করবে।",
    daily:"দৈনিক চাষ শুরু করুন", dailyDesc:"অবস্থান, আবহাওয়া ও জমির মাপ সেট করে উপযুক্ত ফসল বেছে নিন। তারপর দৈনিক খামার ডায়েরি শুরু হবে।",
    ask:"আমার ফসল সম্পর্কে জিজ্ঞাসা করুন", askDesc:"রোগ, পোকা, পাতা, জল, পুষ্টি বা বৃদ্ধি সম্পর্কে জিজ্ঞাসা করুন অথবা ছবি পাঠান।",
    startFarm:"আমার খামার শুরু করুন →", askAI:"AgriAI-কে জিজ্ঞাসা করুন →", language:"ভাষা", voice:"ভয়েস সহকারী", listen:"🔊 শুনুন", speak:"🎙️ বলুন", stop:"থামুন",
    farmPlan:"চলুন আপনার খামারের পরিকল্পনা করি।", location:"আপনার খামার কোথায়?", measure:"যেখানে সত্যিই চাষ করবেন সেই জায়গা মাপুন",
    crops:"আপনার পরিস্থিতির উপযোগী ফসল", calculate:"উপযুক্ত ফসল হিসাব করুন →", select:"নির্বাচন",
    foundation:"খামার প্রস্তুতি · দিন 1-এর আগে", prepare:"বেড, জলের পথ ও রোপণের স্থান প্রস্তুত করুন",
    planted:"বেড প্রস্তুত করে বীজ/চারা লাগিয়েছি → দিন 1 শুরু করুন", dailyPlan:"আজকের খামার পরিকল্পনা", actions:"আজকের কাজ",
    weather:"আবহাওয়া দেখুন", root:"মূল অঞ্চলের আর্দ্রতা দেখুন", scout:"ফসল পরীক্ষা করুন", photo:"আজকের ছবি পাঠান",
    askHappening:"কী হচ্ছে AgriAI-কে বলুন।", crop:"ফসল", photoCheck:"ছবি পরীক্ষা", showPlant:"গাছের ছবি দেখান",
    askPlaceholder:"আপনার ভাষায় জিজ্ঞাসা করুন — যেমন: তিন দিনের বৃষ্টির পর আমার টমেটো পাতায় বাদামী দাগ হয়েছে।",
    back:"← ফিরে যান", home:"হোম", changeCrop:"ফসল বদলান", signOut:"সাইন আউট", evidence:"প্রমাণ-ভিত্তিক মোড"
  }
};

const ASSISTANT_TEXT: Record<LanguageCode, {recommended:string; unsure:string; evidenceDescription:string; active:string; loading:string; prompts:string[]}> = {
  en: {recommended:"recommended for accurate screening",unsure:"I am not sure",evidenceDescription:"Crop identity is never silently replaced with another crop.",active:"ACTIVE",loading:"Checking agricultural evidence…",prompts:["My leaves are turning yellow. What should I check first?","Is my crop likely to need water today?","What are the possible causes of spots on my leaves?","How can I monitor pests without spraying blindly?","What information do you still need before recommending treatment?"]},
  hi: {recommended:"सटीक जांच के लिए अनुशंसित",unsure:"मुझे पक्का नहीं है",evidenceDescription:"फसल की पहचान को कभी चुपचाप किसी दूसरी फसल से नहीं बदला जाता।",active:"सक्रिय",loading:"कृषि प्रमाण की जांच हो रही है…",prompts:["मेरी पत्तियां पीली हो रही हैं। मुझे पहले क्या जांचना चाहिए?","क्या मेरी फसल को आज पानी की जरूरत हो सकती है?","मेरी पत्तियों पर धब्बों के संभावित कारण क्या हैं?","बिना अंधाधुंध छिड़काव के कीटों की निगरानी कैसे करूं?","उपचार सुझाने से पहले आपको और कौन-सी जानकारी चाहिए?"]},
  te: {recommended:"కచ్చితమైన తనిఖీకి సిఫార్సు చేయబడింది",unsure:"నాకు ఖచ్చితంగా తెలియదు",evidenceDescription:"పంట గుర్తింపును మరో పంటతో నిశ్శబ్దంగా ఎప్పుడూ మార్చము.",active:"సక్రియం",loading:"వ్యవసాయ ఆధారాలను పరిశీలిస్తున్నాం…",prompts:["నా ఆకులు పసుపు రంగులోకి మారుతున్నాయి. ముందుగా ఏమి తనిఖీ చేయాలి?","నా పంటకు ఈ రోజు నీరు అవసరం ఉండే అవకాశం ఉందా?","నా ఆకులపై మచ్చలకు సాధ్యమైన కారణాలు ఏమిటి?","గుడ్డిగా పిచికారీ చేయకుండా పురుగులను ఎలా గమనించాలి?","చికిత్స సూచించే ముందు మీకు ఇంకా ఏ సమాచారం కావాలి?"]},
  ta: {recommended:"துல்லியமான பரிசோதனைக்கு பரிந்துரைக்கப்படுகிறது",unsure:"எனக்குத் தெரியவில்லை",evidenceDescription:"பயிரின் அடையாளம் வேறு பயிராக ஒருபோதும் அமைதியாக மாற்றப்படாது.",active:"செயலில்",loading:"வேளாண் ஆதாரங்களைச் சரிபார்க்கிறோம்…",prompts:["என் இலைகள் மஞ்சளாகின்றன. முதலில் எதைச் சரிபார்க்க வேண்டும்?","என் பயிருக்கு இன்று தண்ணீர் தேவைப்படுமா?","என் இலைகளில் உள்ள புள்ளிகளுக்கான காரணங்கள் என்ன?","கண்மூடித்தனமாக தெளிக்காமல் பூச்சிகளைக் கண்காணிப்பது எப்படி?","சிகிச்சையை பரிந்துரைக்கும் முன் உங்களுக்கு வேறு என்ன தகவல் தேவை?"]},
  kn: {recommended:"ನಿಖರ ಪರಿಶೀಲನೆಗೆ ಶಿಫಾರಸು",unsure:"ನನಗೆ ಖಚಿತವಿಲ್ಲ",evidenceDescription:"ಬೆಳೆಯ ಗುರುತನ್ನು ಬೇರೆ ಬೆಳೆಗೆ ಮೌನವಾಗಿ ಬದಲಾಯಿಸುವುದಿಲ್ಲ.",active:"ಸಕ್ರಿಯ",loading:"ಕೃಷಿ ಸಾಕ್ಷ್ಯವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…",prompts:["ನನ್ನ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ. ಮೊದಲು ಏನು ಪರಿಶೀಲಿಸಬೇಕು?","ನನ್ನ ಬೆಳೆಗೆ ಇಂದು ನೀರು ಬೇಕಾಗುವ ಸಾಧ್ಯತೆ ಇದೆಯೇ?","ನನ್ನ ಎಲೆಗಳ ಮೇಲಿನ ಕಲೆಗಳಿಗೆ ಕಾರಣಗಳೇನು?","ಕುರುಡಾಗಿ ಸಿಂಪಡಿಸದೆ ಕೀಟಗಳನ್ನು ಹೇಗೆ ಗಮನಿಸಬೇಕು?","ಚಿಕಿತ್ಸೆ ಸೂಚಿಸುವ ಮೊದಲು ನಿಮಗೆ ಇನ್ನೇನು ಮಾಹಿತಿ ಬೇಕು?"]},
  ml: {recommended:"കൃത്യമായ പരിശോധനയ്ക്കായി ശുപാർശ ചെയ്യുന്നത്",unsure:"എനിക്ക് ഉറപ്പില്ല",evidenceDescription:"വിളയുടെ തിരിച്ചറിയൽ മറ്റൊരു വിളയായി ഒരിക്കലും നിശ്ശബ്ദമായി മാറ്റില്ല.",active:"സജീവം",loading:"കാർഷിക തെളിവുകൾ പരിശോധിക്കുന്നു…",prompts:["എന്റെ ഇലകൾ മഞ്ഞനിറമാകുന്നു. ആദ്യം എന്ത് പരിശോധിക്കണം?","എന്റെ വിളയ്ക്ക് ഇന്ന് വെള്ളം ആവശ്യമുണ്ടാകുമോ?","എന്റെ ഇലകളിലെ പാടുകൾക്കുള്ള സാധ്യതയുള്ള കാരണങ്ങൾ എന്തൊക്കെയാണ്?","അന്ധമായി തളിക്കാതെ കീടങ്ങളെ എങ്ങനെ നിരീക്ഷിക്കാം?","ചികിത്സ നിർദേശിക്കുന്നതിന് മുമ്പ് നിങ്ങൾക്ക് എന്ത് വിവരമാണ് വേണ്ടത്?"]},
  mr: {recommended:"अचूक तपासणीसाठी शिफारस",unsure:"मला खात्री नाही",evidenceDescription:"पिकाची ओळख दुसऱ्या पिकाने कधीही शांतपणे बदलली जात नाही.",active:"सक्रिय",loading:"कृषी पुरावे तपासत आहोत…",prompts:["माझी पाने पिवळी पडत आहेत. मी आधी काय तपासावे?","माझ्या पिकाला आज पाण्याची गरज असण्याची शक्यता आहे का?","माझ्या पानांवरील डागांची संभाव्य कारणे कोणती?","आंधळेपणाने फवारणी न करता किडींचे निरीक्षण कसे करावे?","उपचार सुचवण्यापूर्वी तुम्हाला आणखी कोणती माहिती हवी आहे?"]},
  bn: {recommended:"সঠিক পরীক্ষার জন্য প্রস্তাবিত",unsure:"আমি নিশ্চিত নই",evidenceDescription:"ফসলের পরিচয় কখনও নীরবে অন্য ফসল দিয়ে বদলে দেওয়া হয় না।",active:"সক্রিয়",loading:"কৃষি-সংক্রান্ত প্রমাণ পরীক্ষা করা হচ্ছে…",prompts:["আমার পাতাগুলো হলুদ হয়ে যাচ্ছে। প্রথমে কী পরীক্ষা করা উচিত?","আমার ফসলে কি আজ জল লাগতে পারে?","আমার পাতার দাগের সম্ভাব্য কারণ কী?","অন্ধভাবে স্প্রে না করে পোকামাকড় কীভাবে পর্যবেক্ষণ করব?","চিকিৎসা পরামর্শ দেওয়ার আগে আপনার আর কী তথ্য দরকার?"]}
};

function ui(code:LanguageCode,key:string) { return UI_TEXT[code]?.[key] || UI_TEXT.en[key] || key; }
function languageInfo(code:LanguageCode) { return LANGUAGES.find(l=>l.code===code) || LANGUAGES[0]; }

function speakText(text:string, code:LanguageCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageInfo(code).speech;
  utterance.rate = .9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

type CropCategory = "vegetable"|"fruit"|"flower"|"cereal"|"pulse"|"oilseed"|"spice"|"herb";
type CropProfile = {
  name:string; category:CropCategory; icon:string; minTemp:number; maxTemp:number; minArea:number;
  row:number; plant:number; water:"low"|"medium"|"high"; note:string;
};

const CROPS: CropProfile[] = [
  {name:"Tomato",category:"vegetable",icon:"🍅",minTemp:18,maxTemp:30,minArea:8,row:0.75,plant:0.45,water:"medium",note:"Good all-round option when warmth, light and drainage are available."},
  {name:"Chilli",category:"vegetable",icon:"🌶️",minTemp:18,maxTemp:32,minArea:6,row:0.6,plant:0.45,water:"medium",note:"Compact crop that fits smaller beds well."},
  {name:"Cucumber",category:"vegetable",icon:"🥒",minTemp:20,maxTemp:32,minArea:10,row:1.2,plant:0.6,water:"high",note:"Needs more room and a trellis/support plan."},
  {name:"Spinach",category:"vegetable",icon:"🥬",minTemp:10,maxTemp:25,minArea:2,row:0.3,plant:0.15,water:"medium",note:"Fast, compact and useful when bed area is limited."},
  {name:"Okra",category:"vegetable",icon:"🌿",minTemp:22,maxTemp:35,minArea:6,row:0.75,plant:0.45,water:"medium",note:"Warm-season crop with practical spacing."},
  {name:"Beans",category:"vegetable",icon:"🫘",minTemp:16,maxTemp:28,minArea:5,row:0.6,plant:0.2,water:"medium",note:"Can be space-efficient with suitable support."},
  {name:"Carrot",category:"vegetable",icon:"🥕",minTemp:12,maxTemp:24,minArea:2,row:0.25,plant:0.08,water:"medium",note:"Works well in loose, stone-free soil with shallow spacing."},
  {name:"Radish",category:"vegetable",icon:"🌱",minTemp:10,maxTemp:24,minArea:1.5,row:0.2,plant:0.08,water:"medium",note:"Very space-efficient and quick to establish."},
  {name:"Banana",category:"fruit",icon:"🍌",minTemp:20,maxTemp:35,minArea:12,row:2.4,plant:2.0,water:"high",note:"Warm-climate fruit crop; needs steady water, nutrition and wind protection."},
  {name:"Papaya",category:"fruit",icon:"🍈",minTemp:20,maxTemp:35,minArea:9,row:2.1,plant:1.8,water:"medium",note:"Fast-growing fruit crop that needs warmth and well-drained soil."},
  {name:"Guava",category:"fruit",icon:"🍐",minTemp:18,maxTemp:35,minArea:16,row:3.5,plant:3.0,water:"medium",note:"Hardy fruit tree; allow room for a long-lived canopy."},
  {name:"Mango",category:"fruit",icon:"🥭",minTemp:24,maxTemp:35,minArea:36,row:6,plant:6,water:"medium",note:"Long-term fruit tree; suitable only where generous space is available."},
  {name:"Strawberry",category:"fruit",icon:"🍓",minTemp:12,maxTemp:25,minArea:3,row:0.4,plant:0.3,water:"medium",note:"Cooler-season fruit crop that benefits from clean, well-drained beds."},
  {name:"Marigold",category:"flower",icon:"🌼",minTemp:18,maxTemp:32,minArea:2,row:0.45,plant:0.3,water:"medium",note:"Reliable flower crop for warm beds and regular harvesting."},
  {name:"Rose",category:"flower",icon:"🌹",minTemp:15,maxTemp:30,minArea:4,row:0.75,plant:0.5,water:"medium",note:"Needs sun, airflow, careful pruning and disease monitoring."},
  {name:"Jasmine",category:"flower",icon:"🌸",minTemp:20,maxTemp:32,minArea:4,row:1.5,plant:1.2,water:"medium",note:"Warm-climate flowering plant that benefits from support and pruning."},
  {name:"Sunflower",category:"flower",icon:"🌻",minTemp:18,maxTemp:32,minArea:4,row:0.6,plant:0.3,water:"medium",note:"Sun-loving flower crop that needs open space and good light."}
  ,{name:"Brinjal",category:"vegetable",icon:"🍆",minTemp:20,maxTemp:32,minArea:6,row:0.75,plant:0.6,water:"medium",note:"Warm-season vegetable that needs regular scouting for pests."}
  ,{name:"Onion",category:"vegetable",icon:"🧅",minTemp:13,maxTemp:28,minArea:3,row:0.3,plant:0.1,water:"medium",note:"Needs a fine, well-drained bed and steady early moisture."}
  ,{name:"Potato",category:"vegetable",icon:"🥔",minTemp:12,maxTemp:25,minArea:5,row:0.6,plant:0.25,water:"medium",note:"Cooler-season crop that benefits from loose soil and earthing up."}
  ,{name:"Cabbage",category:"vegetable",icon:"🥬",minTemp:12,maxTemp:25,minArea:4,row:0.6,plant:0.45,water:"medium",note:"Cooler-season leafy vegetable requiring regular pest checks."}
  ,{name:"Cauliflower",category:"vegetable",icon:"🥦",minTemp:12,maxTemp:25,minArea:4,row:0.6,plant:0.45,water:"medium",note:"Needs a cool growing period and consistent soil moisture."}
  ,{name:"Bitter Gourd",category:"vegetable",icon:"🥒",minTemp:20,maxTemp:32,minArea:8,row:1.5,plant:0.75,water:"high",note:"Climbing vegetable that needs a strong support system."}
  ,{name:"Pumpkin",category:"vegetable",icon:"🎃",minTemp:20,maxTemp:32,minArea:12,row:2.0,plant:1.2,water:"medium",note:"Spreading crop that requires generous space and sunlight."}
  ,{name:"Watermelon",category:"fruit",icon:"🍉",minTemp:22,maxTemp:35,minArea:12,row:2.0,plant:1.0,water:"medium",note:"Warm-season fruit crop that needs sun and well-drained soil."}
  ,{name:"Pomegranate",category:"fruit",icon:"🔴",minTemp:20,maxTemp:35,minArea:16,row:4.0,plant:3.0,water:"low",note:"Drought-tolerant fruit tree once established; needs good drainage."}
  ,{name:"Grapes",category:"fruit",icon:"🍇",minTemp:15,maxTemp:32,minArea:12,row:2.4,plant:1.8,water:"medium",note:"Needs a trellis, pruning plan and close disease monitoring."}
  ,{name:"Lemon",category:"fruit",icon:"🍋",minTemp:18,maxTemp:35,minArea:16,row:4.0,plant:3.0,water:"medium",note:"Perennial citrus crop that needs sun and well-drained soil."}
  ,{name:"Chrysanthemum",category:"flower",icon:"🌺",minTemp:15,maxTemp:28,minArea:3,row:0.45,plant:0.3,water:"medium",note:"Flower crop that benefits from sunlight and regular pinching."}
  ,{name:"Tuberose",category:"flower",icon:"🌷",minTemp:20,maxTemp:32,minArea:3,row:0.45,plant:0.3,water:"medium",note:"Warm-climate flower crop valued for fragrant spikes."}
  ,{name:"Rice",category:"cereal",icon:"🌾",minTemp:20,maxTemp:35,minArea:20,row:0.25,plant:0.2,water:"high",note:"Water-demanding staple crop; suitability depends on water access and local season."}
  ,{name:"Maize",category:"cereal",icon:"🌽",minTemp:18,maxTemp:32,minArea:12,row:0.75,plant:0.25,water:"medium",note:"Warm-season staple crop needing full sun and adequate spacing."}
  ,{name:"Pearl Millet",category:"cereal",icon:"🌾",minTemp:22,maxTemp:38,minArea:10,row:0.45,plant:0.15,water:"low",note:"Heat- and drought-tolerant millet suited to lower-rainfall areas."}
  ,{name:"Sorghum",category:"cereal",icon:"🌾",minTemp:20,maxTemp:35,minArea:10,row:0.45,plant:0.15,water:"low",note:"Resilient cereal for warm conditions and moderate water availability."}
  ,{name:"Finger Millet",category:"cereal",icon:"🌾",minTemp:18,maxTemp:30,minArea:10,row:0.3,plant:0.15,water:"medium",note:"Nutritious millet that grows well in many rainfed conditions."}
  ,{name:"Pigeon Pea",category:"pulse",icon:"🫘",minTemp:20,maxTemp:35,minArea:10,row:0.9,plant:0.3,water:"low",note:"Longer-duration pulse crop that tolerates dry spells after establishment."}
  ,{name:"Green Gram",category:"pulse",icon:"🫘",minTemp:20,maxTemp:35,minArea:5,row:0.3,plant:0.1,water:"low",note:"Short-duration pulse crop that fits well between seasonal crops."}
  ,{name:"Black Gram",category:"pulse",icon:"🫘",minTemp:20,maxTemp:35,minArea:5,row:0.3,plant:0.1,water:"low",note:"Warm-season pulse crop with modest water needs."}
  ,{name:"Chickpea",category:"pulse",icon:"🫘",minTemp:15,maxTemp:28,minArea:6,row:0.45,plant:0.15,water:"low",note:"Cooler-season pulse crop that prefers well-drained soil."}
  ,{name:"Groundnut",category:"oilseed",icon:"🥜",minTemp:20,maxTemp:32,minArea:8,row:0.45,plant:0.15,water:"medium",note:"Oilseed crop that needs loose soil for pod development."}
  ,{name:"Mustard",category:"oilseed",icon:"🌼",minTemp:10,maxTemp:25,minArea:6,row:0.45,plant:0.15,water:"low",note:"Cooler-season oilseed suited to well-drained fields."}
  ,{name:"Sesame",category:"oilseed",icon:"🌿",minTemp:22,maxTemp:35,minArea:6,row:0.45,plant:0.15,water:"low",note:"Heat-tolerant oilseed that performs best in well-drained soil."}
  ,{name:"Turmeric",category:"spice",icon:"🟠",minTemp:20,maxTemp:30,minArea:8,row:0.45,plant:0.25,water:"medium",note:"Long-duration spice crop that needs warm, moist growing conditions."}
  ,{name:"Ginger",category:"spice",icon:"🫚",minTemp:20,maxTemp:30,minArea:6,row:0.4,plant:0.2,water:"medium",note:"Needs partial shade or filtered sun and rich, well-drained soil."}
  ,{name:"Coriander",category:"spice",icon:"🌿",minTemp:15,maxTemp:28,minArea:2,row:0.3,plant:0.1,water:"medium",note:"Quick herb and spice crop suitable for cooler growing periods."}
  ,{name:"Basil",category:"herb",icon:"🌿",minTemp:20,maxTemp:32,minArea:2,row:0.45,plant:0.3,water:"medium",note:"Aromatic herb requiring warmth, sun and regular harvesting."}
  ,{name:"Mint",category:"herb",icon:"🌱",minTemp:15,maxTemp:30,minArea:2,row:0.3,plant:0.2,water:"high",note:"Spreading herb that prefers consistently moist soil."}
  ,{name:"Lemongrass",category:"herb",icon:"🌾",minTemp:20,maxTemp:35,minArea:4,row:0.75,plant:0.6,water:"medium",note:"Hardy aromatic grass suited to warm, sunny conditions."}
];

const CROP_NAMES: Record<LanguageCode, Record<string,string>> = {
  en:{}, hi:{Tomato:"टमाटर",Chilli:"मिर्च",Cucumber:"खीरा",Spinach:"पालक",Okra:"भिंडी",Beans:"फलियाँ",Carrot:"गाजर",Radish:"मूली",Banana:"केला",Papaya:"पपीता",Guava:"अमरूद",Mango:"आम",Strawberry:"स्ट्रॉबेरी",Marigold:"गेंदा",Rose:"गुलाब",Jasmine:"चमेली",Sunflower:"सूरजमुखी"},
  te:{Tomato:"టమాటా",Chilli:"మిరప",Cucumber:"దోసకాయ",Spinach:"పాలకూర",Okra:"బెండకాయ",Beans:"బీన్స్",Carrot:"క్యారెట్",Radish:"ముల్లంగి",Banana:"అరటి",Papaya:"బొప్పాయి",Guava:"జామ",Mango:"మామిడి",Strawberry:"స్ట్రాబెర్రీ",Marigold:"బంతి",Rose:"గులాబీ",Jasmine:"మల్లె",Sunflower:"పొద్దుతిరుగుడు"},
  ta:{Tomato:"தக்காளி",Chilli:"மிளகாய்",Cucumber:"வெள்ளரி",Spinach:"கீரை",Okra:"வெண்டைக்காய்",Beans:"பீன்ஸ்",Carrot:"கேரட்",Radish:"முள்ளங்கி",Banana:"வாழைப்பழம்",Papaya:"பப்பாளி",Guava:"கொய்யா",Mango:"மாம்பழம்",Strawberry:"ஸ்ட்ராபெர்ரி",Marigold:"சாமந்தி",Rose:"ரோஜா",Jasmine:"மல்லிகை",Sunflower:"சூரியகாந்தி"},
  kn:{Tomato:"ಟೊಮೆಟೊ",Chilli:"ಮೆಣಸಿನಕಾಯಿ",Cucumber:"ಸೌತೆಕಾಯಿ",Spinach:"ಪಾಲಕ್",Okra:"ಬೆಂಡೆಕಾಯಿ",Beans:"ಹುರಳಿಕಾಯಿ",Carrot:"ಕ್ಯಾರೆಟ್",Radish:"ಮೂಲಂಗಿ"},
  ml:{Tomato:"തക്കാളി",Chilli:"മുളക്",Cucumber:"വെള്ളരി",Spinach:"ചീര",Okra:"വെണ്ടയ്ക്ക",Beans:"പയർ",Carrot:"കാരറ്റ്",Radish:"മുള്ളങ്കി"},
  mr:{Tomato:"टोमॅटो",Chilli:"मिरची",Cucumber:"काकडी",Spinach:"पालक",Okra:"भेंडी",Beans:"शेंगा",Carrot:"गाजर",Radish:"मुळा"},
  bn:{Tomato:"টমেটো",Chilli:"মরিচ",Cucumber:"শসা",Spinach:"পালং শাক",Okra:"ঢেঁড়স",Beans:"শিম",Carrot:"গাজর",Radish:"মূলা"}
};

function cropName(code:LanguageCode, name:string) { return CROP_NAMES[code]?.[name] || name; }
const CROP_CATEGORY_NAMES: Record<LanguageCode, Record<CropCategory,string>> = {
  en:{vegetable:"Vegetables",fruit:"Fruits",flower:"Flowers",cereal:"Cereals & millets",pulse:"Pulses",oilseed:"Oilseeds",spice:"Spices",herb:"Herbs"},
  hi:{vegetable:"सब्जियां",fruit:"फल",flower:"फूल",cereal:"अनाज व मिलेट",pulse:"दालें",oilseed:"तिलहन",spice:"मसाले",herb:"जड़ी-बूटियां"},
  te:{vegetable:"కూరగాయలు",fruit:"పండ్లు",flower:"పూలు",cereal:"ధాన్యాలు & చిరుధాన్యాలు",pulse:"పప్పుధాన్యాలు",oilseed:"నూనె గింజలు",spice:"సుగంధ ద్రవ్యాలు",herb:"మూలికలు"},
  ta:{vegetable:"காய்கறிகள்",fruit:"பழங்கள்",flower:"மலர்கள்",cereal:"தானியங்கள் & சிறுதானியங்கள்",pulse:"பயறு வகைகள்",oilseed:"எண்ணெய் வித்துக்கள்",spice:"மசாலாக்கள்",herb:"மூலிகைகள்"},
  kn:{vegetable:"ತರಕಾರಿಗಳು",fruit:"ಹಣ್ಣುಗಳು",flower:"ಹೂವುಗಳು",cereal:"ಧಾನ್ಯಗಳು & ಸಿರಿಧಾನ್ಯಗಳು",pulse:"ಬೇಳೆಕಾಳುಗಳು",oilseed:"ಎಣ್ಣೆಕಾಳುಗಳು",spice:"ಮಸಾಲೆಗಳು",herb:"ಗಿಡಮೂಲಿಕೆಗಳು"},
  ml:{vegetable:"പച്ചക്കറികൾ",fruit:"പഴങ്ങൾ",flower:"പൂക്കൾ",cereal:"ധാന്യങ്ങളും ചെറുധാന്യങ്ങളും",pulse:"പയർവർഗങ്ങൾ",oilseed:"എണ്ണക്കുരുക്കൾ",spice:"സുഗന്ധവ്യഞ്ജനങ്ങൾ",herb:"ഔഷധസസ്യങ്ങൾ"},
  mr:{vegetable:"भाज्या",fruit:"फळे",flower:"फुले",cereal:"धान्ये व भरडधान्ये",pulse:"कडधान्ये",oilseed:"तेलबिया",spice:"मसाले",herb:"औषधी वनस्पती"},
  bn:{vegetable:"সবজি",fruit:"ফল",flower:"ফুল",cereal:"শস্য ও মিলেট",pulse:"ডাল",oilseed:"তেলবীজ",spice:"মসলা",herb:"ভেষজ"}
};
function cropCategoryName(code:LanguageCode, category:CropCategory) { return CROP_CATEGORY_NAMES[code][category]; }
const VOICE_ERROR: Record<LanguageCode,string> = {
  en:"I could not hear that clearly. Please try again.", hi:"मैं इसे साफ़ नहीं सुन पाया। कृपया फिर से कोशिश करें।", te:"నేను దాన్ని స్పష్టంగా వినలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.", ta:"என்னால் அதைத் தெளிவாகக் கேட்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.", kn:"ನನಗೆ ಅದು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.", ml:"എനിക്ക് അത് വ്യക്തമായി കേൾക്കാനായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.", mr:"मला ते स्पष्ट ऐकू आले नाही. कृपया पुन्हा प्रयत्न करा.", bn:"আমি তা স্পষ্টভাবে শুনতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।"
};
const VOICE_TEXT: Record<LanguageCode, {unsupported:string; captured:string; listening:string; playbackUnsupported:string; reading:string}> = {
  en:{unsupported:"Voice input is not supported in this browser. Try Chrome on Android or desktop.",captured:"Voice captured. Press Ask AgriAI to continue.",listening:"Listening…",playbackUnsupported:"Speech playback is not supported in this browser.",reading:"Reading aloud."},
  hi:{unsupported:"इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। Android या डेस्कटॉप पर Chrome आज़माएं।",captured:"आवाज़ दर्ज हो गई। आगे बढ़ने के लिए AgriAI से पूछें दबाएं।",listening:"सुन रहा है…",playbackUnsupported:"इस ब्राउज़र में बोलकर सुनाने की सुविधा उपलब्ध नहीं है।",reading:"बोलकर सुनाया जा रहा है।"},
  te:{unsupported:"ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్‌కు మద్దతు లేదు. Android లేదా డెస్క్‌టాప్‌లో Chrome ప్రయత్నించండి.",captured:"వాయిస్ నమోదు అయింది. కొనసాగడానికి AgriAIని అడగండి నొక్కండి.",listening:"వింటున్నాం…",playbackUnsupported:"ఈ బ్రౌజర్‌లో వాయిస్ ప్లేబ్యాక్‌కు మద్దతు లేదు.",reading:"చదివి వినిపిస్తున్నాం."},
  ta:{unsupported:"இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Android அல்லது கணினியில் Chrome ஐ முயற்சிக்கவும்.",captured:"குரல் பதிவு செய்யப்பட்டது. தொடர AgriAIயிடம் கேளுங்கள் என்பதை அழுத்தவும்.",listening:"கேட்கிறது…",playbackUnsupported:"இந்த உலாவியில் குரல் வாசிப்பு ஆதரிக்கப்படவில்லை.",reading:"வாசித்துக் காட்டப்படுகிறது."},
  kn:{unsupported:"ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್‌ಗೆ ಬೆಂಬಲವಿಲ್ಲ. Android ಅಥವಾ ಡೆಸ್ಕ್‌ಟಾಪ್‌ನಲ್ಲಿ Chrome ಪ್ರಯತ್ನಿಸಿ.",captured:"ಧ್ವನಿ ದಾಖಲಾಗಿದೆ. ಮುಂದುವರೆಯಲು AgriAIಯನ್ನು ಕೇಳಿ ಒತ್ತಿರಿ.",listening:"ಕೇಳುತ್ತಿದೆ…",playbackUnsupported:"ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಪ್ಲೇಬ್ಯಾಕ್‌ಗೆ ಬೆಂಬಲವಿಲ್ಲ.",reading:"ಓದಿ ಹೇಳಲಾಗುತ್ತಿದೆ."},
  ml:{unsupported:"ഈ ബ്രൗസറിൽ വോയ്സ് ഇൻപുട്ട് പിന്തുണയ്ക്കുന്നില്ല. Android-ലോ ഡെസ്ക്ടോപ്പിലോ Chrome പരീക്ഷിക്കുക.",captured:"ശബ്ദം രേഖപ്പെടുത്തി. തുടരാൻ AgriAIയോട് ചോദിക്കുക അമർത്തുക.",listening:"കേൾക്കുന്നു…",playbackUnsupported:"ഈ ബ്രൗസറിൽ വോയ്സ് പ്ലേബാക്ക് പിന്തുണയ്ക്കുന്നില്ല.",reading:"വായിച്ചു കേൾപ്പിക്കുന്നു."},
  mr:{unsupported:"या ब्राउझरमध्ये आवाज इनपुट समर्थित नाही. Android किंवा डेस्कटॉपवर Chrome वापरून पहा.",captured:"आवाज नोंदवला आहे. पुढे जाण्यासाठी AgriAI ला विचारा दाबा.",listening:"ऐकत आहे…",playbackUnsupported:"या ब्राउझरमध्ये आवाज वाचून दाखवणे समर्थित नाही.",reading:"वाचून दाखवत आहे."},
  bn:{unsupported:"এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। Android বা ডেস্কটপে Chrome ব্যবহার করুন।",captured:"ভয়েস রেকর্ড করা হয়েছে। এগিয়ে যেতে AgriAI-কে জিজ্ঞাসা করুন চাপুন।",listening:"শুনছে…",playbackUnsupported:"এই ব্রাউজারে ভয়েস প্লেব্যাক সমর্থিত নয়।",reading:"পড়ে শোনানো হচ্ছে।"}
};

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {year:"numeric", month:"2-digit", day:"2-digit"}).format(new Date());
}

function fitLabel(score:number) {
  if (score >= 85) return "Strong fit";
  if (score >= 70) return "Good fit";
  if (score >= 55) return "Possible";
  return "Weak fit";
}

export default function Dashboard({ user }: { user: User }) {
  const [mode,setMode] = useState<"choice"|"farm-setup"|"farm"|"assistant">("choice");
  const [step,setStep] = useState(1);
  const [location,setLocation] = useState<LocationInfo|null>(null);
  const [weather,setWeather] = useState<any>(null);
  const [weatherStatus,setWeatherStatus] = useState("Location and weather have not been loaded.");
  const [locationLoading,setLocationLoading] = useState(false);

  const [length,setLength] = useState("20");
  const [width,setWidth] = useState("20");
  const [rowSpacing,setRowSpacing] = useState("0.75");
  const [plantSpacing,setPlantSpacing] = useState("0.45");
  const [crop,setCrop] = useState("");
  // Planting date is the biological Day 1 anchor. Space/weather planning happens before this.
  const [farmStartDate,setFarmStartDate] = useState("");
  const [plantingStarted,setPlantingStarted] = useState(false);
  const [dailyScans,setDailyScans] = useState<DailyScan[]>([]);
  const [analysis,setAnalysis] = useState<any>(null);
  const [scanLoading,setScanLoading] = useState(false);
  const [scanNotes,setScanNotes] = useState("");

  const [assistantCrop,setAssistantCrop] = useState("");
  const [assistantQ,setAssistantQ] = useState("");
  const [assistantLoading,setAssistantLoading] = useState(false);
  const [assistantMessages,setAssistantMessages] = useState<Message[]>([]);
  const [assistantImageLoading,setAssistantImageLoading] = useState(false);
  const [assistantImageResult,setAssistantImageResult] = useState<any>(null);
  const [logoutLoading,setLogoutLoading] = useState(false);

  const [language,setLanguage] = useState<LanguageCode>("en");
  const [voiceListening,setVoiceListening] = useState(false);
  const [voiceNotice,setVoiceNotice] = useState("");
  const [speechRecognition,setSpeechRecognition] = useState<SpeechRecognitionLike|null>(null);

  const area = useMemo(() => {
    const a=Number(length),b=Number(width); return a>0&&b>0?a*b:0;
  },[length,width]);
  const rows = useMemo(() => {
    const b=Number(width),rs=Number(rowSpacing); return b>0&&rs>0?Math.floor(b/rs):0;
  },[width,rowSpacing]);
  const plantsPerRow = useMemo(() => {
    const a=Number(length),ps=Number(plantSpacing); return a>0&&ps>0?Math.floor(a/ps):0;
  },[length,plantSpacing]);
  const plants = rows*plantsPerRow;

  const cropRecommendations = useMemo(() => {
    const temp = Number(weather?.current?.temperature_2m);
    return CROPS.map(c => {
      let score = 45;
      const reasons:string[] = [];
      if (area >= c.minArea) { score += 20; reasons.push("space fits"); }
      else { score -= Math.min(25, Math.round((c.minArea-area)/Math.max(c.minArea,1)*20)); reasons.push("space is tight"); }
      if (Number.isFinite(temp)) {
        if (temp >= c.minTemp && temp <= c.maxTemp) { score += 25; reasons.push("current temperature fits"); }
        else {
          const distance = temp < c.minTemp ? c.minTemp-temp : temp-c.maxTemp;
          score += Math.max(-25, 12-distance*4);
          reasons.push("temperature is outside the preferred range");
        }
      } else score -= 10;
      const rain = Number(weather?.current?.precipitation || 0);
      if (c.water==="high" && rain>5) { score += 5; reasons.push("recent moisture helps"); }
      if (c.water==="low" && rain>8) { score -= 8; reasons.push("drainage risk"); }
      return {...c,score:Math.max(0,Math.min(99,Math.round(score))),reasons};
    }).sort((a,b)=>b.score-a.score);
  },[area,weather]);

  const selectedProfile = CROPS.find(c=>c.name===crop);

  useEffect(() => {
    try {
      const saved=JSON.parse(localStorage.getItem("agriai-farm-profile")||"null");
      if(saved){
        if(saved.length) setLength(saved.length);
        if(saved.width) setWidth(saved.width);
        if(saved.rowSpacing) setRowSpacing(saved.rowSpacing);
        if(saved.plantSpacing) setPlantSpacing(saved.plantSpacing);
        if(saved.crop) { setCrop(saved.crop); setAssistantCrop(saved.crop); }
        if(saved.farmStartDate) {
          setFarmStartDate(saved.farmStartDate);
          setPlantingStarted(true);
        }
      }
      const savedLoc=JSON.parse(localStorage.getItem("agriai-location")||"null");
      if(savedLoc) setLocation(savedLoc);
    } catch {}
    void loadDailyScans();
  },[]);

  useEffect(() => {
    localStorage.setItem("agriai-farm-profile",JSON.stringify({length,width,rowSpacing,plantSpacing,crop,farmStartDate,plantingStarted}));
  },[length,width,rowSpacing,plantSpacing,crop,farmStartDate,plantingStarted]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agriai-language") as LanguageCode | null;
      if (saved && LANGUAGES.some(l=>l.code===saved)) setLanguage(saved);
    } catch {}
    return () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); };
  },[]);

  useEffect(() => {
    try { localStorage.setItem("agriai-language",language); } catch {}
    document.documentElement.lang = languageInfo(language).speech;
  },[language]);

  function changeLanguage(code:LanguageCode) {
    setLanguage(code);
    setVoiceNotice("");
  }

  function stopVoice() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (speechRecognition) { try { speechRecognition.stop(); } catch {} }
    setVoiceListening(false);
  }

  function startVoiceInput() {
    if (typeof window === "undefined") return;
    const w:any = window as any;
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNotice(VOICE_TEXT[language].unsupported);
      return;
    }
    if (voiceListening) { stopVoice(); return; }
    const recognition:SpeechRecognitionLike = new Recognition();
    recognition.lang = languageInfo(language).speech;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event:any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setAssistantQ(q=>q ? `${q} ${transcript}` : transcript);
        setVoiceNotice(VOICE_TEXT[language].captured);
      }
    };
    recognition.onerror = () => { setVoiceNotice(VOICE_ERROR[language]); setVoiceListening(false); };
    recognition.onend = () => setVoiceListening(false);
    setSpeechRecognition(recognition);
    setVoiceListening(true);
    setVoiceNotice(VOICE_TEXT[language].listening);
    recognition.start();
  }

  function readText(text:string) {
    if (!speakText(text,language)) setVoiceNotice(VOICE_TEXT[language].playbackUnsupported);
    else setVoiceNotice(VOICE_TEXT[language].reading);
  }

  function readDailyPlan() {
    const plan = `${ui(language,"dailyPlan")}. ${ui(language,"weather")}. ${ui(language,"root")}. ${ui(language,"scout")}. ${ui(language,"photo")}.`;
    readText(plan);
  }

  async function loadDailyScans() {
    try {
      const res=await fetch("/api/scans",{cache:"no-store"});
      if(!res.ok) return;
      const data=await res.json();
      setDailyScans(Array.isArray(data.scans)?data.scans:[]);
      if(data.scans?.length) setAnalysis(data.scans[data.scans.length-1].analysis);
    } catch {}
  }

  async function detectLocation() {
    setLocationLoading(true);
    setWeatherStatus("Requesting precise browser location…");
    if(!navigator.geolocation){
      setWeatherStatus("Geolocation is not supported by this browser.");
      setLocationLoading(false); return;
    }
    navigator.geolocation.getCurrentPosition(async pos => {
      const lat=pos.coords.latitude,lon=pos.coords.longitude;
      try {
        const [lr,wr]=await Promise.all([
          fetch(`/api/location?lat=${lat}&lon=${lon}`,{cache:"no-store"}),
          fetch(`/api/weather?lat=${lat}&lon=${lon}`,{cache:"no-store"})
        ]);
        const ld=await lr.json(),wd=await wr.json();
        if(!lr.ok) throw new Error(ld.error||"Location lookup failed.");
        if(!wr.ok) throw new Error(wd.error||"Weather lookup failed.");
        const normalized:LocationInfo={
          latitude:Number(ld.latitude??lat),longitude:Number(ld.longitude??lon),
          city:ld.city||"Unknown city",district:ld.district||"",state:ld.state||"",country:ld.country||"",
          displayName:ld.displayName||`${lat.toFixed(5)}, ${lon.toFixed(5)}`
        };
        setLocation(normalized); setWeather(wd);
        setWeatherStatus(`Live field conditions · ${normalized.displayName}`);
        localStorage.setItem("agriai-location",JSON.stringify(normalized));
        setStep(2);
      } catch(e) {
        setWeatherStatus(e instanceof Error?e.message:"Location/weather failed.");
      } finally { setLocationLoading(false); }
    },err=>{
      setWeatherStatus(`Location error: ${err.message}. Allow location access and try again.`);
      setLocationLoading(false);
    },{enableHighAccuracy:true,timeout:15000,maximumAge:300000});
  }

  function startDailyFarming() {
    setMode("farm-setup");
    setStep(location&&weather?2:1);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function startCrop(c:string) {
    // Selecting a crop does NOT start biological Day 1.
    // First show the farmer the foundation/bed-preparation plan.
    setCrop(c);
    setAssistantCrop(c);
    setFarmStartDate("");
    setPlantingStarted(false);
    localStorage.setItem("agriai-farm-profile",JSON.stringify({
      length,width,rowSpacing,plantSpacing,crop:c,farmStartDate:"",plantingStarted:false
    }));
    setMode("farm");
    setStep(4);
    setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),50);
  }

  function startPlantingDay() {
    const start=todayKey();
    setFarmStartDate(start);
    setPlantingStarted(true);
    localStorage.setItem("agriai-farm-profile",JSON.stringify({
      length,width,rowSpacing,plantSpacing,crop,farmStartDate:start,plantingStarted:true
    }));
    setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),50);
  }

  function currentFarmDay() {
    if(!plantingStarted || !farmStartDate) return 0;
    const today=Date.parse(`${todayKey()}T00:00:00Z`);
    const start=Date.parse(`${farmStartDate}T00:00:00Z`);
    return Math.max(1,Math.floor((today-start)/86400000)+1);
  }

  async function scan(file:File, targetCrop=crop, save=true) {
    setScanLoading(true); setAnalysis(null);
    const fd=new FormData();
    fd.append("image",file);
    fd.append("notes",scanNotes);
    fd.append("crop",targetCrop);
    fd.append("language",languageInfo(language).native);
    fd.append("capturedAt",new Date().toISOString());
    fd.append("timezone",Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC");
    if(farmStartDate) fd.append("farmStartDate",farmStartDate);
    if(location) fd.append("location",JSON.stringify(location));
    fd.append("farmContext",JSON.stringify({weather,crop:targetCrop,measurements:{length,width,rowSpacing,plantSpacing,area,rows,plantsPerRow,plants},farmStartDate,latestScan:analysis}));
    try {
      const endpoint=save?"/api/scans":"/api/analyze";
      const res=save?await fetch(endpoint,{method:"POST",body:fd}):await fetch(endpoint,{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Analysis failed.");
      const result=save?data.scan.analysis:data.analysis;
      if(save) {
        setAnalysis(result);
        setDailyScans(current=>[...current,data.scan].sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt)));
        setScanNotes("");
      } else setAssistantImageResult(result);
      return result;
    } catch(e) {
      const result={error:e instanceof Error?e.message:"Analysis failed."};
      if(save) setAnalysis(result); else setAssistantImageResult(result);
      return result;
    } finally { setScanLoading(false); }
  }

  async function analyzeAssistantImage(file:File) {
    setAssistantImageLoading(true); setAssistantImageResult(null);
    const fd=new FormData();
    fd.append("image",file);
    if(assistantCrop) fd.append("crop",assistantCrop);
    fd.append("language",languageInfo(language).native);
    try {
      const res=await fetch("/api/analyze",{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Image analysis failed.");
      setAssistantImageResult(data.analysis);
    } catch(e) {
      setAssistantImageResult({error:e instanceof Error?e.message:"Image analysis failed."});
    } finally { setAssistantImageLoading(false); }
  }

  async function askAssistant(prefilled?:string) {
    const question=(prefilled??assistantQ).trim();
    if(!question||assistantLoading) return;
    const next=[...assistantMessages,{role:"user" as const,content:question}].slice(-12);
    setAssistantLoading(true);
    setAssistantMessages(m=>[...m,{role:"user",content:question}]);
    setAssistantQ("");
    try {
      const res=await fetch("/api/assistant",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          question,history:next,
          context:{
            farmer:{name:user.name},
            location,weather,
            crop:assistantCrop||crop||undefined,
            language: languageInfo(language).native,
            measurements:{length,width,rowSpacing,plantSpacing,area,rows,plantsPerRow,plants},
            farmStartDate,dailyScans:dailyScans.slice(-14).map(s=>({dayNumber:s.dayNumber,dateKey:s.dateKey,capturedAt:s.capturedAt,crop:s.crop,notes:s.notes,analysis:s.analysis}))
          }
        })
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Assistant failed.");
      setAssistantMessages(m=>[...m,{role:"assistant",content:data.answer}]);
      // Voice-first accessibility: read the answer automatically so a farmer who cannot read can still follow the guidance.
      readText(data.answer);
    } catch(e) {
      setAssistantMessages(m=>[...m,{role:"assistant",content:e instanceof Error?e.message:"Assistant failed."}]);
    } finally { setAssistantLoading(false); }
  }

  async function logout() {
    setLogoutLoading(true);
    await fetch("/api/auth/logout",{method:"POST"});
    window.location.href="/login";
  }

  const dayNow = currentFarmDay();

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">🌱</span><div><b>AgriAI</b><small>FARMER-FIRST AGRICULTURE</small></div></div>
        <div className="topbar-actions"><div className="status-dot">● ONLINE</div><label className="language-picker"><span>🌐 {ui(language,"language")}</span><select value={language} onChange={e=>changeLanguage(e.target.value as LanguageCode)}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.native} · {l.label}</option>)}</select></label><button className="voice-top" onClick={()=>readText(mode==="assistant" ? ui(language,"askDesc") : mode==="farm" ? `${ui(language,"dailyPlan")}. ${ui(language,"weather")}. ${ui(language,"root")}. ${ui(language,"scout")}. ${ui(language,"photo")}.` : `${ui(language,"choose")}. ${ui(language,"daily")}. ${ui(language,"ask")}.`)}>🔊 {ui(language,"voice")}</button><span className="welcome">Hi, <strong>{user.name}</strong></span><button className="ghost" onClick={logout} disabled={logoutLoading}>{logoutLoading? "Signing out…":ui(language,"signOut")}</button></div>
      </header>

      {mode==="choice" && (
        <section className="choice-page">
          <div className="hero choice-hero">
            <div><p className="eyebrow">{ui(language,"welcome")}</p><h1>{ui(language,"choose").replace(" today?","")} <span>{language==="en"?"today?":""}</span></h1><p className="muted">{ui(language,"chooseSub")}</p></div>
          </div>
          <div className="choice-grid">
            <button className="choice-card" onClick={startDailyFarming}>
              <span className="choice-icon">🌾</span><span className="choice-number">OPTION 1</span><h2>{ui(language,"daily")}</h2>
              <p>{ui(language,"dailyDesc")}</p><strong>{ui(language,"startFarm")}</strong>
            </button>
            <button className="choice-card" onClick={()=>{setMode("assistant");window.scrollTo({top:0,behavior:"smooth"})}}>
              <span className="choice-icon">🔎</span><span className="choice-number">OPTION 2</span><h2>{ui(language,"ask")}</h2>
              <p>{ui(language,"askDesc")}</p><strong>{ui(language,"askAI")}</strong>
            </button>
          </div>
        </section>
      )}

      {mode==="farm-setup" && (
        <>
          <section className="hero setup-hero">
            <div><p className="eyebrow">OPTION 1 · {ui(language,"daily")}</p><h1>{ui(language,"farmPlan")}</h1><p className="muted">{ui(language,"chooseSub")}</p></div>
            <button className="ghost" onClick={()=>setMode("choice")}>← Back</button>
          </section>

          <div className="steps"><div className={step>=1?"active":""}><b>1</b><span>Location & weather</span></div><div className={step>=2?"active":""}><b>2</b><span>Measure space</span></div><div className={step>=3?"active":""}><b>3</b><span>Choose crop</span></div><div className={step>=4?"active":""}><b>4</b><span>Daily farm</span></div></div>

          <section className="card wide">
            <div className="card-title"><div><p className="eyebrow">STEP 1</p><h2>{ui(language,"location")}</h2></div><span className="pill">{location&&weather?"READY":"NEEDED"}</span></div>
            <p className="muted">{weatherStatus}</p>
            {location&&<div className="location-banner"><div><strong>{location.displayName}</strong><span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span></div><span>LIVE LOCATION</span></div>}
            {weather&&<div className="metrics"><div><b>{weather.current.temperature_2m}°C</b><span>Temperature</span></div><div><b>{weather.current.relative_humidity_2m}%</b><span>Humidity</span></div><div><b>{weather.current.precipitation} mm</b><span>Current rain</span></div><div><b>{weather.current.wind_speed_10m} km/h</b><span>Wind</span></div></div>}
            <button className="primary" onClick={detectLocation} disabled={locationLoading}>{locationLoading?"Finding your field…":location?"Refresh location & weather":"Use my location & calculate weather"}</button>
          </section>

          <section className={`card wide ${step<2?"locked-card":""}`}>
            <div className="card-title"><div><p className="eyebrow">STEP 2</p><h2>{ui(language,"measure")}</h2></div><span className="pill">{step>=2?"READY":"WAITING"}</span></div>
            <div className="two"><label>Length (metres)<input value={length} onChange={e=>setLength(e.target.value)} type="number" min="0.1" step="0.01"/></label><label>Width (metres)<input value={width} onChange={e=>setWidth(e.target.value)} type="number" min="0.1" step="0.01"/></label></div>
            <div className="two"><label>Preferred row spacing (metres)<input value={rowSpacing} onChange={e=>setRowSpacing(e.target.value)} type="number" min="0.05" step="0.01"/></label><label>Preferred plant spacing (metres)<input value={plantSpacing} onChange={e=>setPlantSpacing(e.target.value)} type="number" min="0.03" step="0.01"/></label></div>
            <div className="result"><b>{area.toFixed(2)} m²</b><span>measured area</span><b>{rows||"—"}</b><span>approx. rows</span><b>{plants||"—"}</b><span>approx. plants</span><b>{plantsPerRow||"—"}</b><span>plants / row</span></div>
            {step>=2&&<button className="primary" onClick={()=>setStep(3)} disabled={area<=0}>{ui(language,"calculate")}</button>}
          </section>

          {step>=3 && (
            <section className="card wide">
              <div className="card-title"><div><p className="eyebrow">STEP 3</p><h2>{ui(language,"crops")}</h2></div><span className="pill">CALCULATED</span></div>
              <p className="muted">This is a transparent planning fit based on your current temperature, measured area and crop spacing/water needs. It is not a fabricated guarantee of yield.</p>
              <div className="crop-list">{cropRecommendations.map(c=><article className="crop-reco" key={c.name}>
                <div className="crop-icon">{c.icon}</div><div className="crop-main"><div className="crop-title"><h3>{cropName(language,c.name)}</h3><span>{cropCategoryName(language,c.category)} · {fitLabel(c.score)}</span></div><p>{c.note}</p><div className="chips">{c.reasons.map((r,i)=><small key={i}>{r}</small>)}</div></div><div className="crop-score"><strong>{c.score}</strong><span>fit score</span><button className="primary small" onClick={()=>startCrop(c.name)}>{ui(language,"select")} {cropName(language,c.name)} →</button></div>
              </article>)}</div>
            </section>
          )}
        </>
      )}

      {mode==="farm" && (
        <>
          <section className="hero farm-hero">
            <div>
              <p className="eyebrow">{plantingStarted ? ui(language,"dailyPlan") : ui(language,"foundation")}</p>
              <h1>{selectedProfile?.icon||"🌱"} {crop} {plantingStarted && <span>Day {dayNow}</span>}</h1>
              <p className="muted">
                {location?.displayName||"Location saved"} ·
                {plantingStarted ? ` planting started ${new Date(farmStartDate+"T12:00:00").toLocaleDateString()}` : " crop selected — your plants have not been counted as started yet"}
              </p>
            </div>
            <div className="hero-actions"><button className="ghost" onClick={()=>setMode("choice")}>{ui(language,"home")}</button><button className="ghost" onClick={()=>{setMode("farm-setup");setStep(3)}}>{ui(language,"changeCrop")}</button></div>
          </section>

          {!plantingStarted ? (
            <section className="card wide daily-plan">
              <div className="card-title">
                <div><p className="eyebrow">{ui(language,"foundation")}</p><h2>{ui(language,"prepare")}</h2></div>
                <span className="pill">NOT STARTED</span>
              </div>
              <p className="muted">Good catch: selecting a crop does not mean the crop already exists. Today is preparation until you actually put the seed/seedling in the ground.</p>
              <div className="task-grid">
                <div><b>📏 1. Mark the spacing</b><p>Use the calculated {rowSpacing} m row spacing and {plantSpacing} m plant spacing. Mark the rows without crowding the access path.</p></div>
                <div><b>🪴 2. Prepare the soil</b><p>Loosen the bed, remove stones/weeds and make the planting surface suitable for the selected {crop}.</p></div>
                <div><b>💧 3. Arrange irrigation</b><p>Set the water route before planting so each row can be watered evenly without flooding the bed.</p></div>
                <div><b>🌱 4. Plant the seed/seedling</b><p>Plant according to the crop's recommended depth and spacing. Only after this step does AgriAI start biological Day 1.</p></div>
              </div>
              <div className="result"><b>{area.toFixed(2)} m²</b><span>bed area</span><b>{rows}</b><span>planned rows</span><b>{plants}</b><span>planned planting points</span></div>
              <button className="primary" onClick={startPlantingDay}>{ui(language,"planted")}</button>
            </section>
          ) : (
            <>
              <section className="card wide daily-plan">
                <div className="card-title"><div><p className="eyebrow">{ui(language,"dailyPlan")}</p><h2>{ui(language,"actions")} · Day {dayNow}</h2></div><div className="card-title-actions"><span className="pill">DAY {dayNow}</span><button className="voice-top" onClick={readDailyPlan}>{ui(language,"listen")}</button></div></div>
                <div className="task-grid">
                  <div><b>🌤️ Check the weather</b><p>{weather?.current?.temperature_2m}°C · {weather?.current?.relative_humidity_2m}% humidity · {weather?.current?.precipitation} mm rain now.</p></div>
                  <div><b>💧 Check the root zone</b><p>Check soil moisture before watering. Follow the crop plan rather than watering just because the air feels warm.</p></div>
                  <div><b>🍃 Scout the crop</b><p>Inspect several plants, especially new growth and the underside of leaves. Record anything unusual.</p></div>
                  <div><b>📸 Post today's photo</b><p>Your photo is assigned automatically to the real calendar date and time, so several photos today remain in the same Day {dayNow}.</p></div>
                </div>
              </section>
              <FarmTools
                crop={crop} location={location} weather={weather} length={length} width={width} rowSpacing={rowSpacing} plantSpacing={plantSpacing}
                area={area} rows={rows} plants={plants} plantsPerRow={plantsPerRow} dailyScans={dailyScans} analysis={analysis} language={language}
                scanLoading={scanLoading} scanNotes={scanNotes} setScanNotes={setScanNotes} onScan={(f: File)=>scan(f,crop,true)}
              />
            </>
          )}
        </>
      )}

      {mode==="assistant" && (
        <>
          <section className="hero assistant-hero">
            <div><p className="eyebrow">OPTION 2 · {ui(language,"ask")}</p><h1>{ui(language,"askHappening")}</h1><p className="muted">{ui(language,"askDesc")}</p></div>
            <button className="ghost" onClick={()=>setMode("choice")}>{ui(language,"back")}</button>
          </section>
          <section className="card wide assistant-card">
            <div className="two"><label>{ui(language,"crop")} ({ASSISTANT_TEXT[language].recommended})<select value={assistantCrop} onChange={e=>setAssistantCrop(e.target.value)}><option value="">{ASSISTANT_TEXT[language].unsure}</option>{(["vegetable","fruit","flower","cereal","pulse","oilseed","spice","herb"] as CropCategory[]).map(category=><optgroup key={category} label={cropCategoryName(language,category)}>{CROPS.filter(c=>c.category===category).map(c=><option key={c.name} value={c.name}>{c.icon} {cropName(language,c.name)}</option>)}</optgroup>)}</select></label><div className="location-banner"><div><strong>{ui(language,"evidence")}</strong><span>{ASSISTANT_TEXT[language].evidenceDescription}</span></div><span>{ASSISTANT_TEXT[language].active}</span></div></div>
            <div className="assistant-prompts">{ASSISTANT_TEXT[language].prompts.map(q=><button key={q} type="button" onClick={()=>void askAssistant(q)} disabled={assistantLoading}>{q}</button>)}</div>
            <textarea value={assistantQ} onChange={e=>setAssistantQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void askAssistant();}}} placeholder={ui(language,"askPlaceholder")} rows={4}/>
            <div className="voice-actions"><button className="primary" onClick={()=>void askAssistant()} disabled={assistantLoading||!assistantQ.trim()}>{assistantLoading?ASSISTANT_TEXT[language].loading:ui(language,"askAI")}</button><button type="button" className="voice-top" onClick={startVoiceInput}>{voiceListening?`⏺ ${ui(language,"stop")}`:ui(language,"speak")}</button><button type="button" className="voice-top" onClick={()=>readText(assistantMessages.filter(m=>m.role==="assistant").slice(-1)[0]?.content||ui(language,"askDesc"))}>{ui(language,"listen")}</button></div>

            {voiceNotice&&<p className="voice-notice" aria-live="polite">🎙️ {voiceNotice}</p>}
            <div className="photo-question">
              <div><p className="eyebrow">{ui(language,"photoCheck")}</p><h2>{ui(language,"showPlant")}</h2><p className="muted">{ui(language,"askDesc")}</p></div>
              <label className="file-upload"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={e=>e.target.files?.[0]&&void analyzeAssistantImage(e.target.files[0])}/><span>📷 {ui(language,"showPlant")}</span></label>
            </div>
            {assistantImageLoading&&<p className="muted">Inspecting the crop image…</p>}
            {assistantImageResult&&!assistantImageResult.error&&<AnalysisView analysis={assistantImageResult}/>}
            {assistantImageResult?.error&&<div className="error">{assistantImageResult.error}</div>}
            {assistantMessages.length>0&&<div className="assistant-thread">{assistantMessages.map((m,i)=><div className={`assistant-message ${m.role}`} key={i}><strong>{m.role==="user"?"You":"AgriAI"}</strong>{m.role==="assistant"&&<button className="message-listen" onClick={()=>readText(m.content)}>{ui(language,"listen")}</button>}<p>{m.content}</p></div>)}</div>}
          </section>
        </>
      )}

      <footer>AgriAI provides evidence-based decision support. For high-impact chemical, food-safety or severe disease decisions, confirm with a qualified local agricultural professional.</footer>
    </main>
  );
}

function AnalysisView({analysis}:{analysis:any}) {
  return <div className="analysis">
    <div className="metrics">
      <div><b>{analysis.crop||"Unknown"}</b><span>Crop</span></div>
      <div><b>{analysis.primaryProblem||analysis.issue||"Uncertain"}</b><span>Finding</span></div>
      <div><b>{analysis.confidence ?? 0}%</b><span>Diagnostic confidence</span></div>
      <div><b>{analysis.status||"needs_more_evidence"}</b><span>Evidence status</span></div>
    </div>
    <p><strong>What I can see:</strong> {analysis.visibleFindings?.length?analysis.visibleFindings.join(" · "):"No reliable visible finding was established."}</p>
    <p><strong>Best current conclusion:</strong> {analysis.primaryProblem||analysis.recommendation||"More evidence is needed."}</p>
    {analysis.differential?.length>0&&<div><strong>Possible alternatives:</strong><ul>{analysis.differential.map((d:any,i:number)=><li key={i}>{d.candidate} — {d.likelihood}: {d.why}</li>)}</ul></div>}
    <p><strong>Next action:</strong> {analysis.treatmentGuidance||analysis.recommendation}</p>
    {analysis.evidenceNeeded?.length>0&&<p><strong>Still needed:</strong> {analysis.evidenceNeeded.join(" · ")}</p>}
    <p><strong>Recheck:</strong> {analysis.recheckWindow||"—"}</p>
    <p className="warning"><strong>Safety:</strong> {analysis.disclaimer||"AI screening is not a laboratory-confirmed diagnosis."}</p>
  </div>;
}

function FarmTools(props:any) {
  const {crop,location,weather,length,width,rowSpacing,plantSpacing,area,rows,plants,plantsPerRow,dailyScans,analysis,scanLoading,scanNotes,setScanNotes,onScan,language}=props;
  const groups=Object.values((dailyScans as DailyScan[]).reduce((g:Record<string,DailyScan[]>,s)=>{(g[s.dateKey] ||= []).push(s);return g;},{})).sort((a:any,b:any)=>b[0].dateKey.localeCompare(a[0].dateKey));
  return <div className="grid">
    <section className="card wide"><div className="card-title"><div><p className="eyebrow">{ui(language,"measure")}</p><h2>{ui(language,"crops")}</h2></div><span className="pill">CALCULATED</span></div>
      <div className="metrics"><div><b>{area.toFixed(2)} m²</b><span>area</span></div><div><b>{rows}</b><span>rows</span></div><div><b>{plants}</b><span>approx. plants</span></div><div><b>{plantsPerRow}</b><span>plants / row</span></div></div>
      <p className="muted">For {crop}: row spacing {rowSpacing} m · plant spacing {plantSpacing} m. Keep access/irrigation corridors in the real layout; the diagram is a planning guide, not a claimed compass bearing.</p>
      <div className="layout-diagram"><div className="north">N ↑</div><div className="rows">{Array.from({length:Math.min(Math.max(rows,1),12)}).map((_,i)=><i key={i}/>)}</div></div>
    </section>

    <section className="card wide"><div className="card-title"><div><p className="eyebrow">{ui(language,"photoCheck")}</p><h2>{ui(language,"photo")}</h2></div><span className="pill">{dailyScans.length?`DAY ${dailyScans[dailyScans.length-1].dayNumber}`:"DAY 1"}</span></div>
      <p className="muted">The app records the actual capture date/time. Three photos taken today stay together under today's date; they never become three separate days.</p>
      <label className="notes-label">Observation notes (optional)<textarea value={scanNotes} onChange={e=>setScanNotes(e.target.value)} rows={2} placeholder="What changed? Spots, wilting, insects, rain, irrigation, fertilizer…" /></label>
      <label className="file-upload"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" capture="environment" onChange={e=>e.target.files?.[0]&&void onScan(e.target.files[0])}/><span>📷 {ui(language,"photo")}</span></label>
      {scanLoading&&<p className="muted">Checking crop identity, visible symptoms and evidence before saving the observation…</p>}
      {analysis?.error&&<div className="error">{analysis.error}</div>}
      {analysis&&!analysis.error&&<AnalysisView analysis={analysis}/>}
    </section>

    <section className="card wide"><div className="card-title"><div><p className="eyebrow">{ui(language,"dailyPlan")}</p><h2>{ui(language,"daily")}</h2></div><span className="pill">{dailyScans.length} PHOTOS</span></div>
      {groups.length===0?<p className="muted">No photos yet. Day 1 begins with planting; your first photo will establish the visual baseline.</p>:<div className="daily-timeline">{groups.map(group=><article className="day-card" key={group[0].dateKey}><div className="day-content"><div className="day-heading"><div><p className="eyebrow">DAY {group[0].dayNumber}</p><h3>{new Date(group[0].dateKey+"T12:00:00").toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"})}</h3></div><time>{group.length} photo{group.length===1?"":"s"} · {group[0].timezone||"local time"}</time></div><div className="daily-photo-grid">{group.sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt)).map(s=><div className="daily-photo-item" key={s.id}><img src={`/api/scans/image?file=${encodeURIComponent(s.imageFile)}`} alt={`Day ${s.dayNumber} ${crop} observation`}/><div><strong>{new Date(s.capturedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</strong><span>{s.crop||crop}</span><span>{s.analysis?.primaryProblem||s.analysis?.issue||"No confirmed issue"}</span>{s.notes&&<small>{s.notes}</small>}</div></div>)}</div></div></article>)}</div>}
    </section>
  </div>;
}
