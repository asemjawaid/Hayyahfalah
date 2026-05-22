export type DuaCategory =
  | 'distress'
  | 'forgiveness'
  | 'morning_evening'
  | 'after_prayer'
  | 'protection'
  | 'gratitude'
  | 'travel'
  | 'eating'
  | 'family'
  | 'general';

export const DUA_CATEGORIES: Record<DuaCategory, { label: string; emoji: string }> = {
  distress:        { label: 'Relief & Distress',  emoji: '🤲' },
  forgiveness:     { label: 'Forgiveness',         emoji: '💚' },
  morning_evening: { label: 'Morning & Evening',   emoji: '🌅' },
  after_prayer:    { label: 'After Prayer',        emoji: '📿' },
  protection:      { label: 'Protection',          emoji: '🛡️' },
  gratitude:       { label: 'Gratitude',           emoji: '✨' },
  travel:          { label: 'Travel',              emoji: '🚗' },
  eating:          { label: 'Food & Drink',        emoji: '🍽️' },
  family:          { label: 'Family & Rizq',       emoji: '👨‍👩‍👧' },
  general:         { label: 'General',             emoji: '🌙' },
};

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source: string;
  category: DuaCategory;
  tags: string[];
}

export const DUAS: Dua[] = [

  // ── Relief & Distress ────────────────────────────────────────────────────────

  {
    id: 'dua_yunus',
    title: "Dua of Yunus (Dhun-Nun)",
    arabic: "لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
    transliteration: "Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn",
    translation: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
    source: "Quran 21:87 — recited by Prophet Yunus ﷺ in the belly of the whale. Allah says: We responded to him and saved him from the distress.",
    category: 'distress',
    tags: ['yunus', 'relief', 'distress', 'whale', 'anxiety', 'hardship'],
  },
  {
    id: 'hasbiyallah',
    title: "Hasbiyallāh — Allah is Sufficient",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Ḥasbiyallāhu lā ilāha illā huwa ʿalayhi tawakkaltu wa huwa rabbul-ʿarshil-ʿaẓīm",
    translation: "Allah is sufficient for me; there is no deity except Him. Upon Him I have relied, and He is the Lord of the Great Throne.",
    source: "Quran 9:129 — the Prophet ﷺ said: Whoever recites this 7 times morning and evening, Allah will suffice him. (Abu Dawud)",
    category: 'distress',
    tags: ['tawakkul', 'trust', 'reliance', 'distress', 'morning', 'evening'],
  },
  {
    id: 'la_hawla',
    title: "La Hawla — The Transfer of Power",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ",
    transliteration: "Lā ḥawla wa lā quwwata illā billāhil-ʿaliyyil-ʿaẓīm",
    translation: "There is no power and no strength except with Allah, the Most High, the Most Great.",
    source: "Bukhari & Muslim — a treasure from the treasures of Paradise. Recite when in difficulty.",
    category: 'distress',
    tags: ['distress', 'power', 'strength', 'paradise', 'hardship'],
  },
  {
    id: 'dua_anxiety',
    title: "Dua for Anxiety and Grief",
    arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ",
    transliteration: "Allāhumma innī ʿabduka ibnu ʿabdika ibnu amatika nāṣiyatī biyadika māḍin fiyya ḥukmuka ʿadlun fiyya qaḍāʾuka",
    translation: "O Allah, I am Your servant, son of Your servant, son of Your female servant. My forelock is in Your hand, Your command over me is forever executed, and Your decree over me is just.",
    source: "Ahmad — the Prophet ﷺ said: Whoever is afflicted with grief or anxiety and says this, Allah will replace his distress with joy.",
    category: 'distress',
    tags: ['anxiety', 'grief', 'sorrow', 'depression', 'hardship'],
  },

  // ── Forgiveness ──────────────────────────────────────────────────────────────

  {
    id: 'sayyidul_istighfar',
    title: "Sayyid al-Istighfar — Master of Seeking Forgiveness",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allāhumma anta rabbī lā ilāha illā anta khalaqtanī wa anā ʿabduka wa anā ʿalā ʿahdika wa waʿdika mastaṭaʿtu aʿūdhu bika min sharri mā ṣanaʿtu abūʾu laka biniʿmatika ʿalayya wa abūʾu bidhanbī faghfir lī fa-innahu lā yaghfiru dh-dhunūba illā anta",
    translation: "O Allah, You are my Lord. There is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your grace upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
    source: "Bukhari — The Prophet ﷺ said: Whoever recites this with certainty in the morning and dies before evening, or in the evening and dies before morning, will enter Paradise.",
    category: 'forgiveness',
    tags: ['istighfar', 'forgiveness', 'sins', 'morning', 'evening', 'paradise'],
  },
  {
    id: 'istighfar_simple',
    title: "Seeking Forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullāhal-ʿaẓīm alladhī lā ilāha illā huwal-ḥayyul-qayyūmu wa atūbu ilayh",
    translation: "I seek the forgiveness of Allah, the Most Great, the One other than Whom there is no deity, the Ever-Living, the Sustainer of all, and I repent to Him.",
    source: "Tirmidhi — Whoever says this, their sins are forgiven even if they fled from battle.",
    category: 'forgiveness',
    tags: ['istighfar', 'forgiveness', 'sins', 'repentance', 'tawbah'],
  },
  {
    id: 'dua_parents',
    title: "Dua for Parents",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbir-ḥamhumā kamā rabbayānī ṣaghīrā",
    translation: "My Lord, have mercy on them both as they raised me when I was small.",
    source: "Quran 17:24 — an obligation upon every Muslim with living or deceased parents.",
    category: 'forgiveness',
    tags: ['parents', 'mother', 'father', 'mercy', 'family'],
  },

  // ── Morning & Evening ────────────────────────────────────────────────────────

  {
    id: 'morning_beginning',
    title: "Morning Remembrance — Beginning the Day",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allāhumma bika aṣbaḥnā wa bika amsaynā wa bika naḥyā wa bika namūtu wa ilaykan-nushūr",
    translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the final return.",
    source: "Abu Dawud, Tirmidhi — Recite in the morning. For the evening: replace 'aṣbaḥnā' with 'amsaynā' and 'an-nushūr' with 'al-maṣīr'.",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'beginning', 'day', 'adhkar'],
  },
  {
    id: 'protection_morning',
    title: "Protection from Evil — Morning & Evening",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillāhil-ladhī lā yaḍurru maʿa ismihi shayʾun fil-arḍi wa lā fis-samāʾi wa huwas-samīʿul-ʿalīm",
    translation: "In the name of Allah, with Whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
    source: "Abu Dawud, Tirmidhi — Recite 3 times morning and evening. Nothing will harm him.",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'protection', 'harm', 'bismillah'],
  },
  {
    id: 'aytul_kursi_morning',
    title: "Ayat al-Kursi",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
    transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā taʾkhudhuhū sinatun wa lā nawm, lahū mā fis-samāwāti wa mā fil-arḍ...",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth...",
    source: "Quran 2:255 — Greatest verse in the Quran. Whoever recites it after Fardh prayer will enter Paradise, and protects you until the next prayer. (Bukhari, Nasa'i)",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'after-prayer', 'protection', 'ayat-al-kursi', 'paradise'],
  },
  {
    id: 'qul_morning',
    title: "Morning Tasbih — SubhanAllah, Alhamdulillah, Allahu Akbar",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subḥānallāhi wa biḥamdihī",
    translation: "Glory be to Allah and praise be to Him.",
    source: "Bukhari & Muslim — Recite 100 times in the morning. All sins will be forgiven even if they are as much as the foam of the sea.",
    category: 'morning_evening',
    tags: ['morning', 'tasbih', 'forgiveness', 'adhkar'],
  },

  // ── After Prayer ─────────────────────────────────────────────────────────────

  {
    id: 'after_prayer_salam',
    title: "After Salam — Opening Dhikr",
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Allāhumma antas-salāmu wa minkas-salāmu tabārakta yā dhal-jalāli wal-ikrām",
    translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honor.",
    source: "Muslim — recite immediately after giving the salām at the end of every prayer.",
    category: 'after_prayer',
    tags: ['after-prayer', 'salam', 'dhikr', 'tasbih'],
  },
  {
    id: 'after_prayer_tasbeeh',
    title: "After Prayer Tasbih — 33-33-34",
    arabic: "سُبْحَانَ اللَّهِ (33) • الْحَمْدُ لِلَّهِ (33) • اللَّهُ أَكْبَرُ (33) ثُمَّ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "SubḥānAllāh (33) • Alḥamdulillāh (33) • Allāhu Akbar (33) then: Lā ilāha illAllāhu waḥdahu lā sharīka lahu lahul-mulku wa lahul-ḥamdu wa huwa ʿalā kulli shayʾin qadīr",
    translation: "Glory to Allah (33) • Praise to Allah (33) • Allah is Greatest (33) then: There is no deity except Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things capable.",
    source: "Muslim — The Prophet ﷺ said: whoever recites this after every prayer, his sins will be forgiven even if they are as much as the foam of the sea.",
    category: 'after_prayer',
    tags: ['after-prayer', 'tasbih', 'tasbeeh', '33', 'forgiveness', 'sins'],
  },
  {
    id: 'after_prayer_muawwidhat',
    title: "Al-Muʿawwidhat — Surah Falaq & Nas",
    arabic: "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... • قُلْ أَعُوذُ بِرَبِّ النَّاسِ...",
    transliteration: "Qul aʿūdhu bi-rabbil-falaq... • Qul aʿūdhu bi-rabbin-nās...",
    translation: "Say: I seek refuge in the Lord of the daybreak... • Say: I seek refuge in the Lord of mankind...",
    source: "Abu Dawud — The Prophet ﷺ said: Recite Surah Ikhlas, Falaq and Nas 3 times in the morning and evening — they will suffice you against everything.",
    category: 'after_prayer',
    tags: ['after-prayer', 'morning', 'evening', 'falaq', 'nas', 'protection', 'surah'],
  },

  // ── Protection ───────────────────────────────────────────────────────────────

  {
    id: 'dua_entering_home',
    title: "Entering the Home",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allāhumma innī asʾaluka khayral-mawliji wa khayral-makhraji, bismillāhi walajna wa bismillāhi kharajnā wa ʿalAllāhi rabbanā tawakkalnā",
    translation: "O Allah, I ask You for the best entering and the best exiting. In the name of Allah we enter, in the name of Allah we exit, and upon Allah our Lord we rely.",
    source: "Abu Dawud — Recite when entering your home to greet your family with salām.",
    category: 'protection',
    tags: ['home', 'entering', 'house', 'protection', 'bismillah'],
  },
  {
    id: 'dua_entering_masjid',
    title: "Entering the Masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allāhummaftaḥ lī abwāba raḥmatik",
    translation: "O Allah, open for me the gates of Your mercy.",
    source: "Muslim — Recite when entering the masjid. When leaving say: 'Allāhumma innī asʾaluka min faḍlik' (O Allah, I ask You from Your bounty).",
    category: 'protection',
    tags: ['masjid', 'mosque', 'entering', 'mercy', 'jumuah'],
  },
  {
    id: 'evil_eye_protection',
    title: "Protection from Evil Eye (Ruqyah)",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    source: "Muslim — Whoever says this 3 times in the evening will not be harmed by anything that night.",
    category: 'protection',
    tags: ['evil-eye', 'protection', 'ruqyah', 'jinn', 'harm', 'evening'],
  },
  {
    id: 'dua_sleeping',
    title: "Before Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allāhumma amūtu wa aḥyā",
    translation: "In Your name, O Allah, I die and I live.",
    source: "Bukhari — Recite when going to sleep. Upon waking say: 'Al-ḥamdu lillāhil-ladhī aḥyānā baʿda mā amatanā wa ilayhin-nushūr' (All praise to Allah who revived us after causing us to die).",
    category: 'protection',
    tags: ['sleep', 'night', 'bedtime', 'waking'],
  },

  // ── Gratitude ────────────────────────────────────────────────────────────────

  {
    id: 'dua_gratitude_rizq',
    title: "Gratitude for Blessings — Sulayman's Dua",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ",
    transliteration: "Rabbi awziʿnī an ashkura niʿmatakallātī anʿamta ʿalayya wa ʿalā wālidayya wa an aʿmala ṣāliḥan tarḍāhu",
    translation: "My Lord, inspire me to be grateful for Your favor which You have bestowed upon me and upon my parents, and to do righteousness of which You approve.",
    source: "Quran 27:19 & 46:15 — the dua of Prophets Sulayman and a righteous believer. Recite to count your blessings.",
    category: 'gratitude',
    tags: ['gratitude', 'shukr', 'blessings', 'parents', 'righteous', 'good-deeds'],
  },
  {
    id: 'dua_best_in_world',
    title: "Dua for Good in Both Worlds",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār",
    translation: "Our Lord, give us in this world that which is good and in the Hereafter that which is good and protect us from the punishment of the Fire.",
    source: "Quran 2:201 — the most comprehensive dua. The Prophet ﷺ recited this often. (Bukhari)",
    category: 'gratitude',
    tags: ['dunya', 'akhirah', 'comprehensive', 'world', 'hereafter', 'fire'],
  },

  // ── Travel ───────────────────────────────────────────────────────────────────

  {
    id: 'dua_travel_begin',
    title: "Beginning a Journey",
    arabic: "اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
    transliteration: "Allāhu Akbar (×3), Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahū muqrinīna wa innā ilā rabbinā lamunqalibūn",
    translation: "Allah is Most Great (×3). Glory be to the One Who has subjected this to us, though we were not capable of doing so. And indeed to our Lord we shall return.",
    source: "Quran 43:13-14 & Muslim — recite when mounting a vehicle or beginning any journey.",
    category: 'travel',
    tags: ['travel', 'journey', 'car', 'plane', 'transport', 'beginning'],
  },
  {
    id: 'dua_travel_ease',
    title: "Dua for Easy Travel",
    arabic: "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ",
    transliteration: "Allāhumma hawwin ʿalaynā safaranā hādhā waṭwi ʿannā buʿdah",
    translation: "O Allah, make this journey easy for us and fold up the distance of it for us.",
    source: "Muslim — also say: 'Allāhumma antas-ṣāḥibu fis-safar wal-khalīfatu fil-ahl' (O Allah, You are the Companion in travel and the Protector of the family).",
    category: 'travel',
    tags: ['travel', 'journey', 'ease', 'distance', 'safety'],
  },

  // ── Food & Drink ─────────────────────────────────────────────────────────────

  {
    id: 'before_eating',
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillāh",
    translation: "In the name of Allah.",
    source: "Bukhari & Muslim — The Prophet ﷺ said: Mention Allah's name, eat with your right hand, and eat from what is near you. If you forget to say it at the beginning, say: 'Bismillāhi awwalahu wa ākhirahu'.",
    category: 'eating',
    tags: ['food', 'eating', 'bismillah', 'before-meal'],
  },
  {
    id: 'after_eating',
    title: "After Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ",
    transliteration: "Al-ḥamdu lillāhil-ladhī aṭʿamanā wa saqānā wa jaʿalanā minal-muslimīn",
    translation: "All praise is to Allah who fed us, gave us drink, and made us among the Muslims.",
    source: "Abu Dawud, Tirmidhi — recite after every meal.",
    category: 'eating',
    tags: ['food', 'eating', 'after-meal', 'alhamdulillah', 'gratitude'],
  },

  // ── Family & Rizq ────────────────────────────────────────────────────────────

  {
    id: 'dua_family_good',
    title: "Dua for Righteous Family",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    transliteration: "Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata aʿyunin wajʿalnā lil-muttaqīna imāmā",
    translation: "Our Lord, grant us from our spouses and offspring comfort to our eyes and make us an example for the righteous.",
    source: "Quran 25:74 — dua of the servants of the Most Merciful. Recite for your spouse, children, and family.",
    category: 'family',
    tags: ['family', 'spouse', 'children', 'offspring', 'righteous', 'marriage'],
  },
  {
    id: 'dua_children',
    title: "Dua of Ibrahim for Good Children",
    arabic: "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ",
    transliteration: "Rabbi hab lī minas-ṣāliḥīn",
    translation: "My Lord, grant me a child from among the righteous.",
    source: "Quran 37:100 — Dua of Prophet Ibrahim ﷺ. Recite when desiring righteous children or offspring.",
    category: 'family',
    tags: ['children', 'offspring', 'ibrahim', 'righteous', 'family'],
  },
  {
    id: 'dua_rizq',
    title: "Dua for Provision (Rizq)",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allāhummak-finī biḥalālika ʿan ḥarāmika wa aghnini bifaḍlika ʿamman siwāk",
    translation: "O Allah, suffice me with Your lawful against what is forbidden, and enrich me with Your grace above all others.",
    source: "Tirmidhi — excellent dua for provision, contentment and avoiding the unlawful.",
    category: 'family',
    tags: ['rizq', 'provision', 'halal', 'money', 'wealth', 'contentment'],
  },

  // ── General ──────────────────────────────────────────────────────────────────

  {
    id: 'dua_heart_guidance',
    title: "Dua for a Steadfast Heart",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ",
    transliteration: "Rabbanā lā tuzigh qulūbanā baʿda idh hadaytanā wa hab lanā min ladunka raḥmatan innaka antal-wahhāb",
    translation: "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
    source: "Quran 3:8 — the dua of those firmly grounded in knowledge. Recite to seek steadfastness in faith.",
    category: 'general',
    tags: ['heart', 'guidance', 'steadfast', 'hidayah', 'faith', 'iman'],
  },
  {
    id: 'dua_knowledge',
    title: "Dua for Beneficial Knowledge",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allāhumma innī asʾaluka ʿilman nāfiʿan wa rizqan ṭayyiban wa ʿamalan mutaqabbala",
    translation: "O Allah, I ask You for beneficial knowledge, good provision, and deeds that are accepted.",
    source: "Ibn Majah — recite after Fajr prayer every morning.",
    category: 'general',
    tags: ['knowledge', 'learning', 'ilm', 'rizq', 'deeds', 'morning', 'fajr'],
  },
  {
    id: 'dua_health',
    title: "Dua for Health and Well-being",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    transliteration: "Allāhumma innī asʾalukal-ʿafwa wal-ʿāfiyata fid-dunyā wal-ākhirah",
    translation: "O Allah, I ask You for pardon and well-being in this world and the Hereafter.",
    source: "Abu Dawud, Ibn Majah — The Prophet ﷺ said: No one has been given anything better than well-being.",
    category: 'general',
    tags: ['health', 'afiya', 'well-being', 'pardon', 'forgiveness', 'dunya', 'akhirah'],
  },
  {
    id: 'dua_istikhara',
    title: "Dua al-Istikhara — Seeking Guidance in Decisions",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ",
    transliteration: "Allāhumma innī astakhīruka biʿilmika, wa astaqdaruka biqudratika, wa asʾaluka min faḍlikal-ʿaẓīm",
    translation: "O Allah, I seek Your guidance by Your knowledge, and I seek Your ability by Your power, and I ask You of Your great bounty...",
    source: "Bukhari — Pray 2 rakʿahs, then recite the full istikhara dua for any important decision. Allah will guide you to what is best.",
    category: 'general',
    tags: ['istikhara', 'decision', 'guidance', 'choice', 'marriage', 'job'],
  },
  {
    id: 'dua_laylatul_qadr',
    title: "Dua for Laylat al-Qadr",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allāhumma innaka ʿafuwwun tuḥibbul-ʿafwa faʿfu ʿannī",
    translation: "O Allah, You are the Most Pardoning, You love to pardon, so pardon me.",
    source: "Tirmidhi — Aisha ؓ asked the Prophet ﷺ what to recite on Laylat al-Qadr. He taught her this. Recite abundantly in the last 10 nights of Ramadan.",
    category: 'general',
    tags: ['laylat-qadr', 'ramadan', 'night', 'forgiveness', 'pardon', 'odd-nights'],
  },
  {
    id: 'dua_after_wudu',
    title: "After Wudu (Ablution)",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "Ashhadu an lā ilāha illAllāhu waḥdahu lā sharīka lahu wa ashhadu anna Muḥammadan ʿabduhu wa rasūluh",
    translation: "I bear witness that there is no deity except Allah, alone with no partner, and I bear witness that Muhammad is His servant and messenger.",
    source: "Muslim — whoever says this after wudu, the gates of Paradise are opened for him and he enters from whichever gate he wishes.",
    category: 'general',
    tags: ['wudu', 'ablution', 'shahadah', 'purification', 'paradise'],
  },
];

export function searchDuas(query: string): Dua[] {
  const q = query.toLowerCase().trim();
  if (!q) return DUAS;
  return DUAS.filter(d =>
    d.title.toLowerCase().includes(q) ||
    d.translation.toLowerCase().includes(q) ||
    d.transliteration.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q)) ||
    d.source.toLowerCase().includes(q),
  );
}

export function getDuasByCategory(category: DuaCategory): Dua[] {
  return DUAS.filter(d => d.category === category);
}
