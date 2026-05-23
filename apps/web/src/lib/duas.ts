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
    source: "Quran 21:87. The Prophet ﷺ said: 'No Muslim ever supplicates with it for anything except that Allah answers him.' — Sunan al-Tirmidhi 3505, graded Hasan Gharib. Allah responded to Yunus ﷺ and saved him from the darkness of the whale's belly (21:88).",
    category: 'distress',
    tags: ['yunus', 'relief', 'distress', 'whale', 'anxiety', 'hardship'],
  },
  {
    id: 'hasbiyallah',
    title: "Hasbiyallāh — Allah is Sufficient",
    arabic: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration: "Ḥasbiyallāhu lā ilāha illā huwa ʿalayhi tawakkaltu wa huwa rabbul-ʿarshil-ʿaẓīm",
    translation: "Allah is sufficient for me; there is no deity except Him. Upon Him I have relied, and He is the Lord of the Great Throne.",
    source: "Quran 9:129. 'Whoever says this 7 times in the morning and 7 times in the evening, Allah will suffice him in whatever worries him of the matters of this world and the Hereafter.' — Sunan Abi Dawud 5081; Ibn al-Sunni, Amal al-Yawm wa'l-Laylah 71; authenticated by al-Albani (Sahih Abi Dawud).",
    category: 'distress',
    tags: ['tawakkul', 'trust', 'reliance', 'distress', 'morning', 'evening'],
  },
  {
    id: 'la_hawla',
    title: "La Hawla — The Transfer of Power",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ",
    transliteration: "Lā ḥawla wa lā quwwata illā billāhil-ʿaliyyil-ʿaẓīm",
    translation: "There is no power and no strength except with Allah, the Most High, the Most Great.",
    source: "Sahih al-Bukhari 6384; Sahih Muslim 2704, from Abu Musa al-Ashari ؓ. The Prophet ﷺ said: 'Should I not tell you of a word that is one of the treasures of Paradise? It is: Lā ḥawla wa lā quwwata illā billāh.'",
    category: 'distress',
    tags: ['distress', 'power', 'strength', 'paradise', 'hardship'],
  },
  {
    id: 'dua_anxiety',
    title: "Dua for Anxiety and Grief",
    arabic: "اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوِ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجِلَاءَ حُزْنِي، وَذَهَابَ هَمِّي",
    transliteration: "Allāhumma innī ʿabduka ibnu ʿabdika ibnu amatika nāṣiyatī biyadika māḍin fiyya ḥukmuka ʿadlun fiyya qaḍāʾuka asʾaluka bi-kulli ismin huwa laka sammayta bihi nafsaka aw anzaltahu fī kitābika aw ʿallamtahu aḥadan min khalqika aw istaʾtharta bihi fī ʿilmil-ghaybi ʿindaka an tajʿalal-qurʾāna rabīʿa qalbī wa nūra ṣadrī wa jalāʾa ḥuznī wa dhahāba hammī",
    translation: "O Allah, I am Your servant, son of Your servant, son of Your female servant. My forelock is in Your hand, Your command over me is forever executed, and Your decree over me is just. I ask You by every name belonging to You with which You named Yourself, or that You revealed in Your Book, or that You taught to any of Your creation, or that You have kept in the knowledge of the Unseen with You — to make the Quran the spring of my heart, the light of my chest, the departure of my sadness, and the relief of my anxiety.",
    source: "Musnad Ahmad 3704; Sahih Ibn Hibban 972; graded Sahih by al-Albani (Silsilah al-Sahihah 199), from Abdullah ibn Masud ؓ. The Prophet ﷺ said: 'Whenever any person is afflicted with anxiety or grief and says this supplication, Allah will remove their anxiety and replace their sorrow with joy.'",
    category: 'distress',
    tags: ['anxiety', 'grief', 'sorrow', 'depression', 'hardship', 'quran'],
  },

  // ── Forgiveness ──────────────────────────────────────────────────────────────

  {
    id: 'sayyidul_istighfar',
    title: "Sayyid al-Istighfar — Master of Seeking Forgiveness",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "Allāhumma anta rabbī lā ilāha illā anta khalaqtanī wa anā ʿabduka wa anā ʿalā ʿahdika wa waʿdika mastaṭaʿtu aʿūdhu bika min sharri mā ṣanaʿtu abūʾu laka biniʿmatika ʿalayya wa abūʾu bidhanbī faghfir lī fa-innahu lā yaghfiru dh-dhunūba illā anta",
    translation: "O Allah, You are my Lord. There is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your grace upon me and I acknowledge my sin, so forgive me, for none forgives sins except You.",
    source: "Sahih al-Bukhari 6306, from Shaddad ibn Aws ؓ. The Prophet ﷺ said: 'Whoever says it with certainty in the morning and dies before evening enters Paradise; and whoever says it in the evening with certainty and dies before morning enters Paradise.'",
    category: 'forgiveness',
    tags: ['istighfar', 'forgiveness', 'sins', 'morning', 'evening', 'paradise'],
  },
  {
    id: 'istighfar_simple',
    title: "Seeking Forgiveness",
    arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration: "Astaghfirullāhal-ʿaẓīm alladhī lā ilāha illā huwal-ḥayyul-qayyūmu wa atūbu ilayh",
    translation: "I seek the forgiveness of Allah, the Most Great, the One other than Whom there is no deity, the Ever-Living, the Sustainer of all, and I repent to Him.",
    source: "Sunan al-Tirmidhi 3577; Sunan Abi Dawud 1517, from Ibn Masud ؓ. Al-Tirmidhi graded it Hasan. The Prophet ﷺ said: 'Whoever says this, his sins will be forgiven even if he ran away from the battlefield' (a major sin — indicating the dua's great virtue).",
    category: 'forgiveness',
    tags: ['istighfar', 'forgiveness', 'sins', 'repentance', 'tawbah'],
  },
  {
    id: 'dua_parents',
    title: "Dua for Parents",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "Rabbir-ḥamhumā kamā rabbayānī ṣaghīrā",
    translation: "My Lord, have mercy on them both as they raised me when I was small.",
    source: "Quran 17:24 — commanded by Allah as part of the obligation to honour parents. Recite for both living and deceased parents; the reward reaches them after death.",
    category: 'forgiveness',
    tags: ['parents', 'mother', 'father', 'mercy', 'family'],
  },

  // ── Morning & Evening ────────────────────────────────────────────────────────

  {
    id: 'morning_beginning',
    title: "Morning Remembrance — Beginning the Day",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
    transliteration: "Allāhumma bika aṣbaḥnā wa bika amsaynā wa bika naḥyā wa bika namūtu wa ilaykan-nushūr",
    translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the Resurrection.",
    source: "Sunan Abi Dawud 5068; Sunan al-Tirmidhi 3391, from Abi Hurayrah ؓ. For the evening version: replace 'aṣbaḥnā' with 'amsaynā' and 'an-nushūr' with 'al-maṣīr' (the final return).",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'beginning', 'day', 'adhkar'],
  },
  {
    id: 'protection_morning',
    title: "Protection from Harm — Morning & Evening",
    arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration: "Bismillāhil-ladhī lā yaḍurru maʿa ismihi shayʾun fil-arḍi wa lā fis-samāʾi wa huwas-samīʿul-ʿalīm",
    translation: "In the name of Allah, with Whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
    source: "Sunan Abi Dawud 5088; Sunan al-Tirmidhi 3388; Sunan Ibn Majah 3869, from Uthman ibn Affan ؓ. Graded Sahih by al-Albani. 'Whoever says it 3 times in the morning and 3 times in the evening, nothing will harm him.'",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'protection', 'harm', 'bismillah'],
  },
  {
    id: 'aytul_kursi_morning',
    title: "Ayat al-Kursi",
    arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm, lā taʾkhudhuhū sinatun wa lā nawm, lahū mā fis-samāwāti wa mā fil-arḍ, man dhal-ladhī yashfaʿu ʿindahu illā bi-idhnihi, yaʿlamu mā bayna aydīhim wa mā khalfahum, wa lā yuḥīṭūna bishayʾin min ʿilmihi illā bimā shāʾ, wasiʿa kursiyyuhus-samāwāti wal-arḍ, wa lā yaʾūduhū ḥifẓuhumā, wa huwal-ʿaliyyul-ʿaẓīm",
    translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great.",
    source: "Quran 2:255. The greatest verse in the Quran — Sahih al-Bukhari 4723. Whoever recites it after every obligatory prayer, nothing prevents him from entering Paradise except death — Nasa'i, al-Sunan al-Kubra 9928; graded Sahih by al-Albani (Silsilah al-Sahihah 972).",
    category: 'morning_evening',
    tags: ['morning', 'evening', 'after-prayer', 'protection', 'ayat-al-kursi', 'paradise'],
  },
  {
    id: 'qul_morning',
    title: "Morning Tasbih — SubhānAllāh wa Biḥamdih",
    arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration: "Subḥānallāhi wa biḥamdihī",
    translation: "Glory be to Allah and praise be to Him.",
    source: "Sahih al-Bukhari 6405; Sahih Muslim 2691, from Abu Hurayrah ؓ. 'Whoever says SubhānAllāhi wa biḥamdih 100 times in the morning, all his sins are forgiven even if they are as much as the foam of the sea.'",
    category: 'morning_evening',
    tags: ['morning', 'tasbih', 'forgiveness', 'adhkar'],
  },

  // ── After Prayer ─────────────────────────────────────────────────────────────

  {
    id: 'after_prayer_salam',
    title: "After Salām — Opening Dhikr",
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    transliteration: "Allāhumma antas-salāmu wa minkas-salāmu tabārakta yā dhal-jalāli wal-ikrām",
    translation: "O Allah, You are Peace and from You comes peace. Blessed are You, O Possessor of Majesty and Honour.",
    source: "Sahih Muslim 591, from Thawban ؓ. Recite immediately after giving the salām at the end of every prayer, before moving or speaking.",
    category: 'after_prayer',
    tags: ['after-prayer', 'salam', 'dhikr', 'tasbih'],
  },
  {
    id: 'after_prayer_tasbeeh',
    title: "After Prayer Tasbih — 33-33-34",
    arabic: "سُبْحَانَ اللَّهِ (33) • الْحَمْدُ لِلَّهِ (33) • اللَّهُ أَكْبَرُ (33) ثُمَّ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration: "SubḥānAllāh (33) • Alḥamdulillāh (33) • Allāhu Akbar (33) then: Lā ilāha illAllāhu waḥdahu lā sharīka lahu lahul-mulku wa lahul-ḥamdu wa huwa ʿalā kulli shayʾin qadīr",
    translation: "Glory to Allah (×33) • Praise to Allah (×33) • Allah is Greatest (×33) then: There is no deity except Allah alone, with no partner. His is the dominion and His is the praise, and He is over all things capable.",
    source: "Sahih Muslim 597, from Abu Hurayrah ؓ. The Prophet ﷺ said: 'Whoever glorifies Allah 33 times, praises Him 33 times, and declares His greatness 33 times after every prayer, making 99, then completes 100 with Lā ilāha illAllāh… his sins are forgiven even if they are as much as the foam of the sea.'",
    category: 'after_prayer',
    tags: ['after-prayer', 'tasbih', 'tasbeeh', '33', 'forgiveness', 'sins'],
  },
  {
    id: 'after_prayer_muawwidhat',
    title: "Al-Muʿawwidhat — Surah Ikhlas, Falaq & Nas",
    arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ... • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... • قُلْ أَعُوذُ بِرَبِّ النَّاسِ...",
    transliteration: "Qul huwAllāhu aḥad... • Qul aʿūdhu bi-rabbil-falaq... • Qul aʿūdhu bi-rabbin-nās...",
    translation: "Say: He is Allah, the One... • Say: I seek refuge in the Lord of the daybreak... • Say: I seek refuge in the Lord of mankind...",
    source: "Sunan Abi Dawud 5082; Sunan al-Tirmidhi 3575, from Abdullah ibn Khubayb ؓ. 'Recite Surah Ikhlas, Falaq and Nas three times in the morning and three times in the evening — they will suffice you against everything.' Graded Hasan Sahih by al-Tirmidhi.",
    category: 'after_prayer',
    tags: ['after-prayer', 'morning', 'evening', 'falaq', 'nas', 'ikhlas', 'protection', 'surah'],
  },

  // ── Protection ───────────────────────────────────────────────────────────────

  {
    id: 'dua_entering_home',
    title: "Entering the Home",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
    transliteration: "Allāhumma innī asʾaluka khayral-mawliji wa khayral-makhraji, bismillāhi walajna wa bismillāhi kharajnā wa ʿalAllāhi rabbanā tawakkalnā",
    translation: "O Allah, I ask You for the best entering and the best exiting. In the name of Allah we enter, in the name of Allah we exit, and upon Allah our Lord we rely.",
    source: "Sunan Abi Dawud 5096, from Anas ibn Malik ؓ. Recite when entering your home, then greet your family with the salām. The shaytan says 'no lodging, no supper' when bismillah is said upon entering — Sahih Muslim 2018.",
    category: 'protection',
    tags: ['home', 'entering', 'house', 'protection', 'bismillah'],
  },
  {
    id: 'dua_entering_masjid',
    title: "Entering the Masjid",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "Allāhummaftaḥ lī abwāba raḥmatik",
    translation: "O Allah, open for me the gates of Your mercy.",
    source: "Sahih Muslim 713, from Abu Humayd or Abu Usayd ؓ. Recite upon entering the masjid after sending salawat on the Prophet ﷺ. When leaving, say: 'Allāhumma innī asʾaluka min faḍlik' (O Allah, I ask You of Your bounty) — Sahih Muslim 713.",
    category: 'protection',
    tags: ['masjid', 'mosque', 'entering', 'mercy', 'jumuah'],
  },
  {
    id: 'evil_eye_protection',
    title: "Protection from Evil and Harm",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    transliteration: "Aʿūdhu bikalimātillāhit-tāmmāti min sharri mā khalaq",
    translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    source: "Sahih Muslim 2709, from Abu Hurayrah ؓ. 'Whoever says this 3 times in the evening, no venom will harm him that night.' Also reported that the Prophet ﷺ taught it for protection when stopping at a place — Sahih Muslim 2708.",
    category: 'protection',
    tags: ['evil-eye', 'protection', 'ruqyah', 'jinn', 'harm', 'evening'],
  },
  {
    id: 'dua_sleeping',
    title: "Before Sleeping",
    arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
    transliteration: "Bismika Allāhumma amūtu wa aḥyā",
    translation: "In Your name, O Allah, I die and I live.",
    source: "Sahih al-Bukhari 6312, from Hudhayfah ibn al-Yaman ؓ. Upon waking, recite: 'Al-ḥamdu lillāhil-ladhī aḥyānā baʿda mā amatanā wa ilayhin-nushūr' — Sahih al-Bukhari 6312. Sleep is likened to a minor death; the soul is taken and returned by Allah's permission.",
    category: 'protection',
    tags: ['sleep', 'night', 'bedtime', 'waking'],
  },

  // ── Gratitude ────────────────────────────────────────────────────────────────

  {
    id: 'dua_gratitude_rizq',
    title: "Gratitude for Blessings — Dua of Sulayman",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ",
    transliteration: "Rabbi awziʿnī an ashkura niʿmatakallātī anʿamta ʿalayya wa ʿalā wālidayya wa an aʿmala ṣāliḥan tarḍāhu wa adkhilnī biraḥmatika fī ʿibādikaṣ-ṣāliḥīn",
    translation: "My Lord, inspire me to be grateful for Your favour which You have bestowed upon me and upon my parents, and to do righteousness of which You approve, and admit me by Your mercy into the ranks of Your righteous servants.",
    source: "Quran 27:19 (Dua of Prophet Sulayman ﷺ upon hearing the ant) and 46:15 (Dua of every righteous believer at the age of 40). Recite to cultivate gratitude for blessings and to seek a righteous end.",
    category: 'gratitude',
    tags: ['gratitude', 'shukr', 'blessings', 'parents', 'righteous', 'good-deeds', 'sulayman'],
  },
  {
    id: 'dua_best_in_world',
    title: "Dua for Good in Both Worlds",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār",
    translation: "Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.",
    source: "Quran 2:201. The most comprehensive dua — it gathers all good of this world and the Next. The Prophet ﷺ frequently recited this dua and it was his most common supplication — Sahih al-Bukhari 6389, from Anas ibn Malik ؓ.",
    category: 'gratitude',
    tags: ['dunya', 'akhirah', 'comprehensive', 'world', 'hereafter', 'fire'],
  },

  // ── Travel ───────────────────────────────────────────────────────────────────

  {
    id: 'dua_travel_begin',
    title: "Beginning a Journey",
    arabic: "اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ، اللَّهُمَّ إِنَّا نَسْأَلُكَ فِي سَفَرِنَا هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى",
    transliteration: "Allāhu Akbar (×3), Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahū muqrinīna wa innā ilā rabbinā lamunqalibūn, Allāhumma innā nasʾaluka fī safarinā hādhā al-birra wat-taqwā wa minal-ʿamali mā tarḍā",
    translation: "Allah is Most Great (×3). Glory be to the One Who has subjected this to us, though we were not capable of doing so. And indeed, to our Lord we shall return. O Allah, we ask You in this journey of ours for righteousness and piety, and for deeds that please You.",
    source: "Quran 43:13-14; Sahih Muslim 1342, from Ibn Umar ؓ. The Prophet ﷺ recited this when mounting his camel for any journey. He would then add this dua for righteousness in travel.",
    category: 'travel',
    tags: ['travel', 'journey', 'car', 'plane', 'transport', 'beginning'],
  },
  {
    id: 'dua_travel_ease',
    title: "Dua for Easy and Safe Travel",
    arabic: "اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ وَالْخَلِيفَةُ فِي الْأَهْلِ",
    transliteration: "Allāhumma hawwin ʿalaynā safaranā hādhā waṭwi ʿannā buʿdahu, Allāhumma antas-ṣāḥibu fis-safar wal-khalīfatu fil-ahl",
    translation: "O Allah, make this journey easy for us and fold up its distance for us. O Allah, You are the Companion in travel and the Guardian over the family.",
    source: "Sahih Muslim 1342, from Ibn Umar ؓ. The Prophet ﷺ taught this dua when setting out on a journey. When returning: add 'Āyibūna tāʾibūna ʿābidūna li-rabbinā ḥāmidūn' (We return, repenting, worshipping, and praising our Lord).",
    category: 'travel',
    tags: ['travel', 'journey', 'ease', 'distance', 'safety', 'family'],
  },

  // ── Food & Drink ─────────────────────────────────────────────────────────────

  {
    id: 'before_eating',
    title: "Before Eating",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "Bismillāh",
    translation: "In the name of Allah.",
    source: "Sahih al-Bukhari 5376; Sahih Muslim 2017, from Umar ibn Abi Salamah ؓ. The Prophet ﷺ said: 'Mention Allah's name, eat with your right hand, and eat from what is nearest to you.' If you forget at the start, say when you remember: 'Bismillāhi awwalahu wa ākhirahu' (In the name of Allah at its beginning and its end).",
    category: 'eating',
    tags: ['food', 'eating', 'bismillah', 'before-meal'],
  },
  {
    id: 'after_eating',
    title: "After Eating",
    arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ",
    transliteration: "Al-ḥamdu lillāhil-ladhī aṭʿamanā wa saqānā wa jaʿalanā minal-muslimīn",
    translation: "All praise is to Allah Who fed us, gave us drink, and made us among the Muslims.",
    source: "Sunan Abi Dawud 3850; Sunan al-Tirmidhi 3457, from Abu Said al-Khudri ؓ. Graded Hasan by al-Tirmidhi. Recite after every meal to acknowledge that sustenance is a gift from Allah.",
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
    source: "Quran 25:74 — the dua of the ʿIbad al-Rahman (servants of the Most Merciful). This is one of the qualities by which Allah describes the elite believers in Surah al-Furqan. Recite for your spouse, children, and entire family.",
    category: 'family',
    tags: ['family', 'spouse', 'children', 'offspring', 'righteous', 'marriage'],
  },
  {
    id: 'dua_children',
    title: "Dua of Ibrahim for Righteous Children",
    arabic: "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ",
    transliteration: "Rabbi hab lī minas-ṣāliḥīn",
    translation: "My Lord, grant me a child from among the righteous.",
    source: "Quran 37:100 — Dua of Prophet Ibrahim ﷺ. Allah answered this dua with the birth of Ismail ﷺ (37:101). Recite when desiring righteous children, offspring, or students.",
    category: 'family',
    tags: ['children', 'offspring', 'ibrahim', 'righteous', 'family'],
  },
  {
    id: 'dua_rizq',
    title: "Dua for Provision (Rizq)",
    arabic: "اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ",
    transliteration: "Allāhummak-finī biḥalālika ʿan ḥarāmika wa aghnini bifaḍlika ʿamman siwāk",
    translation: "O Allah, suffice me with Your lawful against what is forbidden, and enrich me with Your grace above all others besides You.",
    source: "Sunan al-Tirmidhi 3563, from Ali ibn Abi Talib ؓ. Graded Hasan by al-Tirmidhi. This dua combines two beautiful requests: contentment with the halal and freedom from dependence on anyone besides Allah.",
    category: 'family',
    tags: ['rizq', 'provision', 'halal', 'money', 'wealth', 'contentment'],
  },

  // ── General ──────────────────────────────────────────────────────────────────

  {
    id: 'dua_heart_guidance',
    title: "Dua for a Steadfast Heart",
    arabic: "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ",
    transliteration: "Rabbanā lā tuzigh qulūbanā baʿda idh hadaytanā wa hab lanā min ladunka raḥmatan innaka antal-wahhāb",
    translation: "Our Lord, let not our hearts deviate after You have guided us, and grant us from Yourself mercy. Indeed, You are the Bestower.",
    source: "Quran 3:8 — the dua of those firmly grounded in knowledge (al-rāsikhūn fil-ʿilm, 3:7). The Prophet ﷺ frequently recited: 'Yā muqallibal-qulūb, thabbit qalbī ʿalā dīnik' — Sunan al-Tirmidhi 2140; graded Hasan Sahih.",
    category: 'general',
    tags: ['heart', 'guidance', 'steadfast', 'hidayah', 'faith', 'iman'],
  },
  {
    id: 'dua_knowledge',
    title: "Dua for Beneficial Knowledge",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا طَيِّبًا وَعَمَلًا مُتَقَبَّلًا",
    transliteration: "Allāhumma innī asʾaluka ʿilman nāfiʿan wa rizqan ṭayyiban wa ʿamalan mutaqabbala",
    translation: "O Allah, I ask You for beneficial knowledge, good provision, and deeds that are accepted.",
    source: "Sunan Ibn Majah 925, from Umm Salamah ؓ. Graded Sahih by al-Albani (Sahih Ibn Majah). The Prophet ﷺ recited this every morning after the Fajr prayer. It gathers the three pillars of a blessed life.",
    category: 'general',
    tags: ['knowledge', 'learning', 'ilm', 'rizq', 'deeds', 'morning', 'fajr'],
  },
  {
    id: 'dua_health',
    title: "Dua for Pardon and Well-being",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
    transliteration: "Allāhumma innī asʾalukal-ʿafwa wal-ʿāfiyata fid-dunyā wal-ākhirah",
    translation: "O Allah, I ask You for pardon and well-being in this world and the Hereafter.",
    source: "Sunan Abi Dawud 5074; Sunan Ibn Majah 3851, from Ibn Umar ؓ. Graded Sahih by al-Albani. The Prophet ﷺ said: 'No one has been given anything better, after certainty (yaqīn), than well-being (ʿāfiyah)' — Sunan al-Tirmidhi 3558.",
    category: 'general',
    tags: ['health', 'afiya', 'well-being', 'pardon', 'forgiveness', 'dunya', 'akhirah'],
  },
  {
    id: 'dua_istikhara',
    title: "Dua al-Istikhara — Seeking Guidance in Decisions",
    arabic: "اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ، وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ، وَأَسْأَلُكَ مِنْ فَضْلِكَ الْعَظِيمِ، فَإِنَّكَ تَقْدِرُ وَلَا أَقْدِرُ، وَتَعْلَمُ وَلَا أَعْلَمُ، وَأَنْتَ عَلَّامُ الْغُيُوبِ، اللَّهُمَّ إِنْ كُنْتَ تَعْلَمُ أَنَّ هَذَا الْأَمْرَ خَيْرٌ لِي فِي دِينِي وَمَعَاشِي وَعَاقِبَةِ أَمْرِي فَاقْدُرْهُ لِي وَيَسِّرْهُ لِي ثُمَّ بَارِكْ لِي فِيهِ",
    transliteration: "Allāhumma innī astakhīruka biʿilmika wa astaqdaruka biqudratika wa asʾaluka min faḍlikal-ʿaẓīm, fa-innaka taqdiru wa lā aqdiru wa taʿlamu wa lā aʿlamu wa anta ʿallāmul-ghuyūb. Allāhumma in kunta taʿlamu anna hādhal-amra khayrun lī fī dīnī wa maʿāshī wa ʿāqibati amrī faqdurhu lī wa yassirhu lī thumma bārik lī fīh",
    translation: "O Allah, I seek Your guidance by Your knowledge, and I seek Your ability by Your power, and I ask You of Your great bounty. For You have power and I have none, You know and I know not, and You are the Knower of all unseen things. O Allah, if You know that this matter is good for me in my religion, my livelihood, and the outcome of my affairs — then ordain it for me, make it easy for me, then bless me in it.",
    source: "Sahih al-Bukhari 1162, from Jabir ibn Abdullah ؓ. Pray 2 rakʿahs (not obligatory), recite this dua, and name your specific need where it says 'this matter.' No dream is required — look for ease or difficulty in the matter as a sign.",
    category: 'general',
    tags: ['istikhara', 'decision', 'guidance', 'choice', 'marriage', 'job'],
  },
  {
    id: 'dua_laylatul_qadr',
    title: "Dua for Laylat al-Qadr",
    arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
    transliteration: "Allāhumma innaka ʿafuwwun tuḥibbul-ʿafwa faʿfu ʿannī",
    translation: "O Allah, You are the Most Pardoning, You love to pardon, so pardon me.",
    source: "Sunan al-Tirmidhi 3513, graded Sahih by al-Tirmidhi, from Aisha ؓ. She asked the Prophet ﷺ: 'If I find Laylat al-Qadr, what should I say?' He replied with this dua. Recite abundantly throughout the last 10 nights of Ramadan.",
    category: 'general',
    tags: ['laylat-qadr', 'ramadan', 'night', 'forgiveness', 'pardon', 'odd-nights'],
  },
  {
    id: 'dua_after_wudu',
    title: "After Wudu (Ablution)",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
    transliteration: "Ashhadu an lā ilāha illAllāhu waḥdahu lā sharīka lahu wa ashhadu anna Muḥammadan ʿabduhu wa rasūluh. Allāhummaj-ʿalnī minat-tawwābīna waj-ʿalnī minal-mutaṭahhirīn",
    translation: "I bear witness that there is no deity except Allah, alone with no partner, and I bear witness that Muhammad is His servant and messenger. O Allah, make me among those who repent and make me among those who purify themselves.",
    source: "Sahih Muslim 234, from Umar ibn al-Khattab ؓ. 'Whoever says this after wudu, the eight gates of Paradise are opened for him and he enters from whichever gate he wishes.' The second sentence (Allāhumma...) is from Sunan al-Tirmidhi 55; graded Sahih by al-Albani.",
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
