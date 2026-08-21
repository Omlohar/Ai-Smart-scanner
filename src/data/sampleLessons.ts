import { LessonData } from '../types';

export const SAMPLE_LESSONS: LessonData[] = [
  {
    id: 'sample-1',
    title: 'The Thirsty Crow (प्यासा कौआ)',
    extractedText: `Once upon a time, there was a clever crow. On a very hot summer afternoon, he flew all around the village in search of water. He felt extremely thirsty and tired.

Finally, he saw a water pitcher under a mango tree in a garden. He flew down happily and peeked inside. The pitcher had very little water at the bottom, and his beak could not reach it.

The crow thought for a moment. He looked around and noticed small pebbles lying on the ground. He had a brilliant idea!

One by one, the crow picked up the pebbles with his beak and dropped them into the pitcher. Slowly and steadily, the water level rose to the top. The clever crow drank the fresh cool water happily and flew away into the blue sky.

Moral: Where there is a will, there is a way.`,
    translatedText: `एक समय की बात है, एक चतुर कौआ था। एक बहुत गर्म दोपहर में, वह पानी की तलाश में पूरे गाँव में उड़ रहा था। उसे बहुत प्यास और थकान महसूस हो रही थी।

आखिरकार, उसने एक बगीचे में आम के पेड़ के नीचे एक पानी का मटका देखा। वह खुशी से नीचे उड़ा और अंदर झाँका। मटके के तले में बहुत कम पानी था और उसकी चोंच वहाँ तक नहीं पहुँच पा रही थी।

कौए ने एक पल के लिए सोचा। उसने चारों ओर देखा और जमीन पर छोटे-छोटे कंकड़ पड़े देखे। उसे एक बहुत बढ़िया उपाय सूझा!

कौए ने एक-एक करके अपनी चोंच से कंकड़ उठाए और मटके में डालने लगा। धीरे-धीरे पानी ऊपर आ गया। चतुर कौए ने खुशी-खुशी ठंडा पानी पिया और नीले आसमान में उड़ गया।

सीख: जहाँ चाह, वहाँ राह (यदि हम कोशिश करें तो हर मुश्किल का हल मिल जाता है)।`,
    summaryInHindi: 'यह एक चतुर कौए की कहानी है जिसने दिमाग लगाकर कंकड़ मटके में डाले और पानी ऊपर लाकर अपनी प्यास बुझाई।',
    timestamp: Date.now() - 3600000 * 24,
    isFavorite: true,
    vocabList: [
      {
        word: 'Clever',
        phoneticHindi: 'क्लेवर',
        hindiMeaning: 'चतुर / होशियार',
        simpleExample: 'The fox is a clever animal. (लोमड़ी एक चतुर जानवर है।)',
        emoji: '🦊',
      },
      {
        word: 'Thirsty',
        phoneticHindi: 'थर्स्टी',
        hindiMeaning: 'प्यासा',
        simpleExample: 'I am thirsty, please give me water. (मुझे प्यास लगी है, कृपया पानी दें।)',
        emoji: '🥤',
      },
      {
        word: 'Pitcher',
        phoneticHindi: 'पिचर',
        hindiMeaning: 'मटका / घड़ा',
        simpleExample: 'Water is kept cool in the pitcher. (मटके में पानी ठंडा रहता है।)',
        emoji: '🏺',
      },
      {
        word: 'Pebbles',
        phoneticHindi: 'पेबल्स',
        hindiMeaning: 'छोटे कंकड़ / गोल पत्थर',
        simpleExample: 'The river bank had shiny pebbles. (नदी किनारे चमकदार कंकड़ थे।)',
        emoji: '🪨',
      },
      {
        word: 'Steadily',
        phoneticHindi: 'स्टेडिली',
        hindiMeaning: 'लगातार और धीरे-धीरे',
        simpleExample: 'He walked steadily up the hill. (वह धीरे-धीरे लगातार पहाड़ी पर चढ़ा।)',
        emoji: '🚶',
      },
      {
        word: 'Brilliant',
        phoneticHindi: 'ब्रिलियंट',
        hindiMeaning: 'शानदार / बहुत बढ़िया',
        simpleExample: 'She came up with a brilliant idea. (उसे एक शानदार विचार आया।)',
        emoji: '💡',
      },
    ],
    alignedSentences: [
      {
        id: 1,
        original: 'Once upon a time, there was a clever crow.',
        phoneticHindi: 'वन्स अपॉन अ टाइम, देयर वॉज़ अ क्लेवर क्रो।',
        translated: 'एक समय की बात है, एक चतुर कौआ था।',
      },
      {
        id: 2,
        original: 'On a very hot summer afternoon, he flew all around the village in search of water.',
        phoneticHindi: 'ऑन अ वेरी हॉट समर आफ्टरनून, ही फ्लू ऑल अराउंड द विलेज इन सर्च ऑफ वॉटर।',
        translated: 'एक बहुत गर्म दोपहर में, वह पानी की तलाश में पूरे गाँव में उड़ रहा था।',
      },
      {
        id: 3,
        original: 'He felt extremely thirsty and tired.',
        phoneticHindi: 'ही फेल्ट एक्सट्रीमली थर्स्टी एंड टायर्ड।',
        translated: 'उसे बहुत प्यास और थकान महसूस हो रही थी।',
      },
      {
        id: 4,
        original: 'Finally, he saw a water pitcher under a mango tree in a garden.',
        phoneticHindi: 'फाइनली, ही सॉ अ वॉटर पिचर अंडर अ मैंगो ट्री इन अ गार्डन।',
        translated: 'आखिरकार, उसने एक बगीचे में आम के पेड़ के नीचे एक पानी का मटका देखा।',
      },
      {
        id: 5,
        original: 'He flew down happily and peeked inside.',
        phoneticHindi: 'ही फ्लू डाउन हैपिली एंड पीक्ड इनसाइड।',
        translated: 'वह खुशी से नीचे उड़ा और अंदर झाँका।',
      },
      {
        id: 6,
        original: 'The pitcher had very little water at the bottom, and his beak could not reach it.',
        phoneticHindi: 'द पिचर हैड वेरी लिटल वॉटर एट द बॉटम, एंड हिज़ बीक कुड नॉट रीच इट।',
        translated: 'मटके के तले में बहुत कम पानी था और उसकी चोंच वहाँ तक नहीं पहुँच पा रही थी।',
      },
      {
        id: 7,
        original: 'The crow thought for a moment.',
        phoneticHindi: 'द क्रो थॉट फॉर अ मोमेंट।',
        translated: 'कौए ने एक पल के लिए सोचा।',
      },
      {
        id: 8,
        original: 'He looked around and noticed small pebbles lying on the ground.',
        phoneticHindi: 'ही लुक्ड अराउंड एंड नोटिस्ड स्मॉल पेबल्स लाइंग ऑन द ग्राउंड।',
        translated: 'उसने चारों ओर देखा और जमीन पर छोटे-छोटे कंकड़ पड़े देखे।',
      },
      {
        id: 9,
        original: 'He had a brilliant idea!',
        phoneticHindi: 'ही हैड अ ब्रिलियंट आइडिया!',
        translated: 'उसे एक बहुत बढ़िया उपाय सूझा!',
      },
      {
        id: 10,
        original: 'One by one, the crow picked up the pebbles with his beak and dropped them into the pitcher.',
        phoneticHindi: 'वन बाई वन, द क्रो पिक्ड अप द पेबल्स विथ हिज़ बीक एंड ड्रॉप्ड देम इनटु द पिचर।',
        translated: 'कौए ने एक-एक करके अपनी चोंच से कंकड़ उठाए और मटके में डालने लगा।',
      },
      {
        id: 11,
        original: 'Slowly and steadily, the water level rose to the top.',
        phoneticHindi: 'स्लोली एंड स्टेडिली, द वॉटर लेवल रोज़ टू द टॉप।',
        translated: 'धीरे-धीरे पानी ऊपर आ गया।',
      },
      {
        id: 12,
        original: 'The clever crow drank the fresh cool water happily and flew away into the blue sky.',
        phoneticHindi: 'द क्लेवर क्रो ड्रैंक द फ्रेश कूल वॉटर हैपिली एंड फ्लू अवे इनटु द ब्लू स्काई।',
        translated: 'चतुर कौए ने खुशी-खुशी ठंडा पानी पिया और नीले आसमान में उड़ गया।',
      },
      {
        id: 13,
        original: 'Moral: Where there is a will, there is a way.',
        phoneticHindi: 'मोरल: वेयर देयर इज अ विल, देयर इज अ वे।',
        translated: 'सीख: जहाँ चाह, वहाँ राह।',
      },
    ],
  },
  {
    id: 'sample-2',
    title: 'The Solar System (हमारा सौरमंडल)',
    extractedText: `The Sun is a huge, glowing ball of hot gas at the center of our solar system. Eight amazing planets revolve around the Sun in fixed circular paths called orbits.

Mercury is the closest planet to the Sun, while Neptune is the farthest away. Our home planet, Earth, is the third planet from the Sun. Earth is unique because it has liquid water, fresh air, and life.

The Moon is Earth's only natural satellite. It shines brightly at night by reflecting sunlight. Astronauts travel in spaceships to explore outer space.`,
    translatedText: `सूर्य हमारे सौरमंडल के केंद्र में गर्म गैस का एक विशाल, चमकता हुआ गोला है। आठ अद्भुत ग्रह सूर्य के चारों ओर निश्चित गोल रास्तों में घूमते हैं जिन्हें कक्षा (ऑर्बिट) कहते हैं।

बुध (Mercury) सूर्य के सबसे करीब का ग्रह है, जबकि वरुण (Neptune) सबसे दूर है। हमारा अपना ग्रह, पृथ्वी (Earth), सूर्य से तीसरा ग्रह है। पृथ्वी अनोखी है क्योंकि यहाँ तरल पानी, ताजी हवा और जीवन मौजूद है।

चंद्रमा पृथ्वी का एकमात्र प्राकृतिक उपग्रह है। यह रात में सूर्य के प्रकाश को परावर्तित करके चमकता है। अंतरिक्ष यात्री अंतरिक्ष की खोज के लिए अंतरिक्ष यान में यात्रा करते हैं।`,
    summaryInHindi: 'यह पाठ सूर्य, आठ ग्रहों और हमारी प्यारी पृथ्वी के बारे में आसान भाषा में जानकारी देता है।',
    timestamp: Date.now() - 3600000 * 12,
    isFavorite: false,
    vocabList: [
      {
        word: 'Solar System',
        phoneticHindi: 'सोलर सिस्टम',
        hindiMeaning: 'सौरमंडल (सूर्य और ग्रह)',
        simpleExample: 'There are eight planets in the solar system. (सौरमंडल में आठ ग्रह हैं।)',
        emoji: '🪐',
      },
      {
        word: 'Revolve',
        phoneticHindi: 'रिवॉल्व',
        hindiMeaning: 'गोल-गोल चक्कर लगाना',
        simpleExample: 'Planets revolve around the Sun. (ग्रह सूर्य के चारों ओर चक्कर लगाते हैं।)',
        emoji: '🔄',
      },
      {
        word: 'Orbit',
        phoneticHindi: 'ऑर्बिट',
        hindiMeaning: 'परिक्रमा पथ (घूमने का रास्ता)',
        simpleExample: 'Earth stays in its orbit. (पृथ्वी अपनी कक्षा में रहती है।)',
        emoji: '💫',
      },
      {
        word: 'Satellite',
        phoneticHindi: 'सैटेलाइट',
        hindiMeaning: 'उपग्रह',
        simpleExample: 'The Moon is Earth’s natural satellite. (चाँद पृथ्वी का प्राकृतिक उपग्रह है।)',
        emoji: '🌙',
      },
      {
        word: 'Astronaut',
        phoneticHindi: 'एस्ट्रोनॉट',
        hindiMeaning: 'अंतरिक्ष यात्री',
        simpleExample: 'She wants to become an astronaut. (वह अंतरिक्ष यात्री बनना चाहती है।)',
        emoji: '👨‍🚀',
      },
    ],
    alignedSentences: [
      {
        id: 1,
        original: 'The Sun is a huge, glowing ball of hot gas at the center of our solar system.',
        phoneticHindi: 'द सन इज़ अ ह्यूज, ग्लोइंग बॉल ऑफ हॉट गैस एट द सेंटर ऑफ अवर सोलर सिस्टम।',
        translated: 'सूर्य हमारे सौरमंडल के केंद्र में गर्म गैस का एक विशाल, चमकता हुआ गोला है।',
      },
      {
        id: 2,
        original: 'Eight amazing planets revolve around the Sun in fixed circular paths called orbits.',
        phoneticHindi: 'एट अमेजिंग प्लैनेट्स रिवॉल्व अराउंड द सन इन फिक्स्ड सर्कुलर पाथ्स कॉल्ड ऑर्बिट्स।',
        translated: 'आठ अद्भुत ग्रह सूर्य के चारों ओर निश्चित गोल रास्तों में घूमते हैं जिन्हें कक्षा (ऑर्बिट) कहते हैं।',
      },
      {
        id: 3,
        original: 'Mercury is the closest planet to the Sun, while Neptune is the farthest away.',
        phoneticHindi: 'मर्करी इज़ द क्लोसेस्ट प्लैनेट टू द सन, व्हाइल नेपच्यून इज़ द फारदेस्ट अवे।',
        translated: 'बुध (Mercury) सूर्य के सबसे करीब का ग्रह है, जबकि वरुण (Neptune) सबसे दूर है।',
      },
      {
        id: 4,
        original: 'Our home planet, Earth, is the third planet from the Sun.',
        phoneticHindi: 'अवर होम प्लैनेट, अर्थ, इज़ द थर्ड प्लैनेट फ्रॉम द सन।',
        translated: 'हमारा अपना ग्रह, पृथ्वी (Earth), सूर्य से तीसरा ग्रह है।',
      },
      {
        id: 5,
        original: 'Earth is unique because it has liquid water, fresh air, and life.',
        phoneticHindi: 'अर्थ इज़ यूनिक बिकॉज़ इट हैज़ लिक्विड वॉटर, फ्रेश एयर, एंड लाइफ।',
        translated: 'पृथ्वी अनोखी है क्योंकि यहाँ तरल पानी, ताजी हवा और जीवन मौजूद है।',
      },
      {
        id: 6,
        original: "The Moon is Earth's only natural satellite.",
        phoneticHindi: 'द मून इज़ अर्थ्स ओनली नेचुरल सैटेलाइट।',
        translated: 'चंद्रमा पृथ्वी का एकमात्र प्राकृतिक उपग्रह है।',
      },
      {
        id: 7,
        original: 'It shines brightly at night by reflecting sunlight.',
        phoneticHindi: 'इट शाइन्स ब्राइटली एट नाइट बाई रिफ्लेक्टिंग सनलाइट।',
        translated: 'यह रात में सूर्य के प्रकाश को परावर्तित करके चमकता है।',
      },
      {
        id: 8,
        original: 'Astronauts travel in spaceships to explore outer space.',
        phoneticHindi: 'एस्ट्रोनॉट्स ट्रैवल इन स्पेसशिप्स टू एक्सप्लोर आउटर स्पेस।',
        translated: 'अंतरिक्ष यात्री अंतरिक्ष की खोज के लिए अंतरिक्ष यान में यात्रा करते हैं।',
      },
    ],
  },
  {
    id: 'sample-3',
    title: 'My Daily Routine & School (मेरा दैनिक जीवन)',
    extractedText: `Every morning, I wake up early at six o'clock with a happy smile. I brush my teeth, take a refreshing bath, and wear my clean school uniform.

My mother prepares a delicious, healthy breakfast of milk and fresh fruits. After eating, I pack my school bag with books, notebooks, and colorful pencils.

At school, our teacher explains interesting lessons in English and Mathematics. During recess, I share my lunchbox with my best friends and play joyful games in the playground. I love learning new things every day!`,
    translatedText: `हर सुबह, मैं छह बजे खुशी-खुशी मुस्कुराते हुए जल्दी उठती हूँ। मैं अपने दाँत साफ करती हूँ, ताज़ा स्नान करती हूँ और अपनी साफ स्कूल ड्रेस पहनती हूँ।

मेरी माँ दूध और ताज़े फलों का स्वादिष्ट और पौष्टिक नाश्ता बनाती हैं। खाने के बाद, मैं अपने स्कूल बैग में किताबें, कॉपियाँ और रंग-बिरंगी पेंसिलें रखती हूँ।

स्कूल में, हमारी अध्यापिका अंग्रेजी और गणित के रोचक पाठ समझाती हैं। आधी छुट्टी (Recess) के दौरान, मैं अपनी सबसे अच्छी सहेलियों के साथ अपना टिफिन बाँटती हूँ और मैदान में मज़ेदार खेल खेलती हूँ। मुझे हर दिन नई बातें सीखना बहुत पसंद है!`,
    summaryInHindi: 'इस पाठ में एक स्कूली बच्ची की अच्छी दैनिक आदतों, सुबह की तैयारी और स्कूल में पढ़ाई व दोस्तों के साथ खेल के बारे में बताया गया है।',
    timestamp: Date.now() - 3600000 * 6,
    isFavorite: true,
    vocabList: [
      {
        word: 'Refreshing',
        phoneticHindi: 'रिफ्रेशिंग',
        hindiMeaning: 'ताज़गी देने वाला',
        simpleExample: 'A cool bath is very refreshing. (ठंडे पानी से नहाना बहुत ताज़गी भरा होता है।)',
        emoji: '🚿',
      },
      {
        word: 'Delicious',
        phoneticHindi: 'डेलिशियस',
        hindiMeaning: 'स्वादिष्ट / बहुत टेस्टी',
        simpleExample: 'The mango is sweet and delicious. (आम मीठा और स्वादिष्ट है।)',
        emoji: '🍎',
      },
      {
        word: 'Interesting',
        phoneticHindi: 'इंटरेस्टिंग',
        hindiMeaning: 'रोचक / मज़ेदार',
        simpleExample: 'This story book is very interesting. (यह कहानी की किताब बहुत रोचक है।)',
        emoji: '📚',
      },
      {
        word: 'Recess',
        phoneticHindi: 'रिसेस',
        hindiMeaning: 'आधी छुट्टी / लंच ब्रेक',
        simpleExample: 'Children play during recess. (बच्चे आधी छुट्टी में खेलते हैं।)',
        emoji: '🥪',
      },
      {
        word: 'Uniform',
        phoneticHindi: 'यूनिफॉर्म',
        hindiMeaning: 'स्कूल की पोशाक / गणवेश',
        simpleExample: 'She ironed her school uniform. (उसने अपनी स्कूल यूनिफॉर्म प्रेस की।)',
        emoji: '👔',
      },
    ],
    alignedSentences: [
      {
        id: 1,
        original: "Every morning, I wake up early at six o'clock with a happy smile.",
        phoneticHindi: 'एवरी मॉर्निंग, आई वेक अप अर्ली एट सिक्स ओ क्लॉक विथ अ हैप्पी स्माइल।',
        translated: 'हर सुबह, मैं छह बजे खुशी-खुशी मुस्कुराते हुए जल्दी उठती हूँ।',
      },
      {
        id: 2,
        original: 'I brush my teeth, take a refreshing bath, and wear my clean school uniform.',
        phoneticHindi: 'आई ब्रश माई टीथ, टेक अ रिफ्रेशिंग बाथ, एंड वेयर माई क्लीन स्कूल यूनिफॉर्म।',
        translated: 'मैं अपने दाँत साफ करती हूँ, ताज़ा स्नान करती हूँ और अपनी साफ स्कूल ड्रेस पहनती हूँ।',
      },
      {
        id: 3,
        original: 'My mother prepares a delicious, healthy breakfast of milk and fresh fruits.',
        phoneticHindi: 'माई मदर प्रिपेयर्स अ डेलिशियस, हेल्दी ब्रेकफास्ट ऑफ मिल्क एंड फ्रेश फ्रूट्स।',
        translated: 'मेरी माँ दूध और ताज़े फलों का स्वादिष्ट और पौष्टिक नाश्ता बनाती हैं।',
      },
      {
        id: 4,
        original: 'After eating, I pack my school bag with books, notebooks, and colorful pencils.',
        phoneticHindi: 'आफ्टर ईटिंग, आई पैक माई स्कूल बैग विथ बुक्स, नोटबुक, एंड कलरफुल पेंसिल्स।',
        translated: 'खाने के बाद, मैं अपने स्कूल बैग में किताबें, कॉपियाँ और रंग-बिरंगी पेंसिलें रखती हूँ।',
      },
      {
        id: 5,
        original: 'At school, our teacher explains interesting lessons in English and Mathematics.',
        phoneticHindi: 'एट स्कूल, अवर टीचर एक्सप्लेन्स इंटरेस्टिंग लेसन्स इन इंग्लिश एंड मैथमेटिक्स।',
        translated: 'स्कूल में, हमारी अध्यापिका अंग्रेजी और गणित के रोचक पाठ समझाती हैं।',
      },
      {
        id: 6,
        original: 'During recess, I share my lunchbox with my best friends and play joyful games in the playground.',
        phoneticHindi: 'ड्यूरिंग रिसेस, आई शेयर माई लंचबॉक्स विथ माई बेस्ट फ्रेंड्स एंड प्ले जॉयफुल गेम्स इन द प्लेग्राउंड।',
        translated: 'आधी छुट्टी (Recess) के दौरान, मैं अपनी सबसे अच्छी सहेलियों के साथ अपना टिफिन बाँटती हूँ और मैदान में मज़ेदार खेल खेलती हूँ।',
      },
      {
        id: 7,
        original: 'I love learning new things every day!',
        phoneticHindi: 'आई लव लर्निंग न्यू थिंग्स एवरी डे!',
        translated: 'मुझे हर दिन नई बातें सीखना बहुत पसंद है!',
      },
    ],
  },
];
