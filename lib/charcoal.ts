import type { Locale } from './i18n';

export const charcoalSections = [
  { key: 'leaves', top: 0, height: 2250, copyTop: 1350 },
  { key: 'warning', top: 2250, height: 2250, copyTop: 1500 },
  { key: 'water', top: 4500, height: 1900, copyTop: 1215 },
  { key: 'removed', top: 6400, height: 2150, copyTop: 1165 },
] as const;
type SectionKey = typeof charcoalSections[number]['key'];
type Copy = Record<SectionKey, { title: string; body: string }>;

/** Supplied narrative; health/product assertions require approval before publication. */
export const charcoalCopy: Record<Locale, Copy> = {
  en: {
    leaves: { title: 'WHAT CHARCOAL\nLEAVES BEHIND.', body: 'Charcoal does more than heat the mixture. As it burns, it releases carbon monoxide, metals and cancer-causing chemicals. These emissions pass through a conventional hookah and become part of what is inhaled.' },
    warning: { title: 'NO COLOR. NO WARNING.', body: 'Carbon monoxide passes from the lungs into the blood, where it binds to hemoglobin and reduces the oxygen delivered to the brain and heart. Headache, dizziness, weakness, nausea and confusion can be warning signs. High exposure can cause unconsciousness or death.' },
    water: { title: 'WATER DOES NOT MAKE IT SAFE.', body: 'Water cools the smoke, but does not remove many harmful chemicals. People nearby can also inhale emissions from both the mixture and the burning charcoal.' },
    removed: { title: 'WHY WE REMOVED FIRE.', body: 'UNO replaces charcoal with controlled electronic heating. This removes burning coal as a direct source of carbon monoxide, ash and combustion by-products. It does not make inhalation risk-free. It removes a preventable source of exposure.' },
  },
  ru: {
    leaves: { title: 'ЧТО ОСТАВЛЯЕТ\nПОСЛЕ СЕБЯ УГОЛЬ.', body: 'Уголь не только нагревает смесь. При горении он выделяет угарный газ, металлы и канцерогенные вещества. Эти выбросы проходят через обычный кальян и становятся частью того, что человек вдыхает.' },
    warning: { title: 'БЕЗ ЦВЕТА. БЕЗ ПРЕДУПРЕЖДЕНИЯ.', body: 'Угарный газ попадает из лёгких в кровь, где связывается с гемоглобином и уменьшает поступление кислорода к мозгу и сердцу. Головная боль, головокружение, слабость, тошнота и спутанность сознания могут быть тревожными признаками. Высокая концентрация может привести к потере сознания или смерти.' },
    water: { title: 'ВОДА НЕ ДЕЛАЕТ ЭТО БЕЗОПАСНЫМ.', body: 'Вода охлаждает дым, но не удаляет многие вредные вещества. Люди рядом также могут вдыхать выбросы как от смеси, так и от горящего угля.' },
    removed: { title: 'ПОЧЕМУ МЫ УБРАЛИ ОГОНЬ.', body: 'UNO заменяет уголь управляемым электронным нагревом. Это устраняет горящий уголь как прямой источник угарного газа, золы и побочных продуктов горения. Вдыхание не становится безрисковым. Устраняется предотвратимый источник воздействия.' },
  },
  de: {
    leaves: { title: 'WAS HOLZKOHLE\nHINTERLÄSST.', body: 'Holzkohle erhitzt nicht nur die Mischung. Beim Verbrennen setzt sie Kohlenmonoxid, Metalle und krebserregende Chemikalien frei. Diese Emissionen gelangen durch eine herkömmliche Wasserpfeife und werden Teil dessen, was eingeatmet wird.' },
    warning: { title: 'KEINE FARBE. KEINE WARNUNG.', body: 'Kohlenmonoxid gelangt von der Lunge ins Blut, bindet dort an Hämoglobin und verringert die Sauerstoffversorgung von Gehirn und Herz. Kopfschmerzen, Schwindel, Schwäche, Übelkeit und Verwirrtheit können Warnzeichen sein. Eine hohe Belastung kann Bewusstlosigkeit oder Tod verursachen.' },
    water: { title: 'WASSER MACHT ES NICHT SICHER.', body: 'Wasser kühlt den Rauch, entfernt aber viele schädliche Chemikalien nicht. Menschen in der Nähe können ebenfalls Emissionen der Mischung und der brennenden Holzkohle einatmen.' },
    removed: { title: 'WARUM WIR FEUER ENTFERNT HABEN.', body: 'UNO ersetzt Holzkohle durch geregelte elektronische Erwärmung. Brennende Kohle entfällt damit als direkte Quelle von Kohlenmonoxid, Asche und Verbrennungsnebenprodukten. Das Einatmen wird dadurch nicht risikofrei. Eine vermeidbare Belastungsquelle entfällt.' },
  },
  fr: {
    leaves: { title: 'CE QUE LE CHARBON\nLAISSE DERRIÈRE LUI.', body: 'Le charbon ne fait pas que chauffer le mélange. En brûlant, il libère du monoxyde de carbone, des métaux et des substances cancérogènes. Ces émissions traversent un narguilé classique et font partie de ce qui est inhalé.' },
    warning: { title: 'SANS COULEUR. SANS AVERTISSEMENT.', body: 'Le monoxyde de carbone passe des poumons dans le sang, où il se lie à l’hémoglobine et réduit l’oxygène apporté au cerveau et au cœur. Maux de tête, vertiges, faiblesse, nausées et confusion peuvent être des signes d’alerte. Une forte exposition peut provoquer une perte de connaissance ou la mort.' },
    water: { title: 'L’EAU NE LE REND PAS SÛR.', body: 'L’eau refroidit la fumée, mais n’élimine pas de nombreuses substances nocives. Les personnes à proximité peuvent aussi inhaler les émissions du mélange et du charbon en combustion.' },
    removed: { title: 'POURQUOI NOUS AVONS RETIRÉ LE FEU.', body: 'UNO remplace le charbon par un chauffage électronique contrôlé. Le charbon en combustion cesse ainsi d’être une source directe de monoxyde de carbone, de cendres et de sous-produits de combustion. L’inhalation ne devient pas sans risque. Une source d’exposition évitable est supprimée.' },
  },
  es: {
    leaves: { title: 'LO QUE EL CARBÓN\nDEJA ATRÁS.', body: 'El carbón no solo calienta la mezcla. Al arder, libera monóxido de carbono, metales y sustancias cancerígenas. Estas emisiones atraviesan una cachimba convencional y forman parte de lo que se inhala.' },
    warning: { title: 'SIN COLOR. SIN AVISO.', body: 'El monóxido de carbono pasa de los pulmones a la sangre, donde se une a la hemoglobina y reduce el oxígeno que llega al cerebro y al corazón. Dolor de cabeza, mareos, debilidad, náuseas y confusión pueden ser señales de alerta. Una exposición elevada puede causar pérdida de conocimiento o muerte.' },
    water: { title: 'EL AGUA NO LO HACE SEGURO.', body: 'El agua enfría el humo, pero no elimina muchas sustancias nocivas. Las personas cercanas también pueden inhalar emisiones tanto de la mezcla como del carbón ardiendo.' },
    removed: { title: 'POR QUÉ ELIMINAMOS EL FUEGO.', body: 'UNO sustituye el carbón por calentamiento electrónico controlado. Así elimina el carbón ardiendo como fuente directa de monóxido de carbono, ceniza y subproductos de combustión. No hace que inhalar carezca de riesgos. Elimina una fuente de exposición evitable.' },
  },
  it: {
    leaves: { title: 'COSA LASCIA\nIL CARBONE.', body: 'Il carbone non si limita a riscaldare la miscela. Bruciando rilascia monossido di carbonio, metalli e sostanze cancerogene. Queste emissioni attraversano un narghilè tradizionale e diventano parte di ciò che viene inalato.' },
    warning: { title: 'NESSUN COLORE. NESSUN AVVISO.', body: 'Il monossido di carbonio passa dai polmoni al sangue, dove si lega all’emoglobina e riduce l’ossigeno che arriva al cervello e al cuore. Mal di testa, vertigini, debolezza, nausea e confusione possono essere segnali d’allarme. Un’esposizione elevata può causare perdita di coscienza o morte.' },
    water: { title: 'L’ACQUA NON LO RENDE SICURO.', body: 'L’acqua raffredda il fumo, ma non elimina molte sostanze nocive. Anche le persone vicine possono inalare emissioni della miscela e del carbone che brucia.' },
    removed: { title: 'PERCHÉ ABBIAMO ELIMINATO IL FUOCO.', body: 'UNO sostituisce il carbone con un riscaldamento elettronico controllato. Elimina così il carbone che brucia come fonte diretta di monossido di carbonio, cenere e sottoprodotti della combustione. Non rende l’inalazione priva di rischi. Elimina una fonte di esposizione evitabile.' },
  },
  tr: {
    leaves: { title: 'KÖMÜRÜN\nGERİDE BIRAKTIKLARI.', body: 'Kömür karışımı ısıtmaktan fazlasını yapar. Yanarken karbonmonoksit, metaller ve kansere neden olan kimyasallar açığa çıkarır. Bu salımlar geleneksel bir nargileden geçerek solunan havanın bir parçası olur.' },
    warning: { title: 'RENK YOK. UYARI YOK.', body: 'Karbonmonoksit akciğerlerden kana geçer, hemoglobine bağlanır ve beyne ve kalbe ulaşan oksijeni azaltır. Baş ağrısı, baş dönmesi, güçsüzlük, bulantı ve bilinç bulanıklığı uyarı işaretleri olabilir. Yüksek düzeyde maruziyet bilinç kaybına veya ölüme neden olabilir.' },
    water: { title: 'SU ONU GÜVENLİ HALE GETİRMEZ.', body: 'Su dumanı soğutur, ancak birçok zararlı kimyasalı gidermez. Yakındaki kişiler de hem karışımdan hem de yanan kömürden kaynaklanan salımları soluyabilir.' },
    removed: { title: 'ATEŞİ NEDEN KALDIRDIK.', body: 'UNO kömürün yerine kontrollü elektronik ısıtma kullanır. Böylece yanan kömürü doğrudan karbonmonoksit, kül ve yanma yan ürünleri kaynağı olmaktan çıkarır. Solumayı risksiz hale getirmez. Önlenebilir bir maruziyet kaynağını ortadan kaldırır.' },
  },
  ar: {
    leaves: { title: 'ما الذي يتركه\nالفحم وراءه.', body: 'الفحم لا يكتفي بتسخين الخليط. فعند احتراقه يطلق أول أكسيد الكربون والمعادن والمواد الكيميائية المسببة للسرطان. تمر هذه الانبعاثات عبر الشيشة التقليدية وتصبح جزءًا مما يُستنشق.' },
    warning: { title: 'بلا لون. بلا تحذير.', body: 'ينتقل أول أكسيد الكربون من الرئتين إلى الدم، حيث يرتبط بالهيموغلوبين ويقلل الأكسجين الواصل إلى الدماغ والقلب. قد يكون الصداع والدوار والضعف والغثيان والتشوش علامات تحذيرية. وقد يؤدي التعرض المرتفع إلى فقدان الوعي أو الوفاة.' },
    water: { title: 'الماء لا يجعله آمنًا.', body: 'يبرّد الماء الدخان، لكنه لا يزيل كثيرًا من المواد الكيميائية الضارة. وقد يستنشق الموجودون بالقرب منه انبعاثات الخليط والفحم المحترق معًا.' },
    removed: { title: 'لماذا استغنينا عن النار.', body: 'يستبدل UNO الفحم بتسخين إلكتروني مضبوط. وبذلك يزيل الفحم المحترق كمصدر مباشر لأول أكسيد الكربون والرماد ونواتج الاحتراق الثانوية. وهذا لا يجعل الاستنشاق خاليًا من المخاطر، بل يزيل مصدرًا للتعرض يمكن تجنبه.' },
  },
  zh: {
    leaves: { title: '木炭燃烧\n留下什么。', body: '木炭不仅仅是加热混合物。燃烧时，它会释放一氧化碳、金属和致癌化学物质。这些排放物通过传统水烟装置，成为吸入物的一部分。' },
    warning: { title: '无色。无预警。', body: '一氧化碳从肺部进入血液，与血红蛋白结合，减少输送到大脑和心脏的氧气。头痛、头晕、虚弱、恶心和意识混乱可能是警示信号。高浓度暴露可能导致昏迷或死亡。' },
    water: { title: '水并不能使其安全。', body: '水可以冷却烟雾，却无法去除许多有害化学物质。附近的人也可能吸入来自混合物和燃烧木炭的排放物。' },
    removed: { title: '我们为什么去掉明火。', body: 'UNO 用受控电子加热取代木炭，从而消除燃烧木炭这一一氧化碳、灰烬和燃烧副产物的直接来源。这并不意味着吸入没有风险，而是消除了一个可以避免的暴露来源。' },
  },
  ja: {
    leaves: { title: '炭が\n残すもの。', body: '炭は混合物を加熱するだけではありません。燃焼すると一酸化炭素、金属、発がん性化学物質を放出します。これらの排出物は従来の水たばこを通り、吸い込むものの一部になります。' },
    warning: { title: '色も、警告もありません。', body: '一酸化炭素は肺から血液に入り、ヘモグロビンと結合して脳や心臓に届く酸素を減らします。頭痛、めまい、脱力、吐き気、混乱は警告の兆候となる場合があります。高濃度への曝露は意識喪失や死亡を引き起こすことがあります。' },
    water: { title: '水は安全にしません。', body: '水は煙を冷やしますが、多くの有害化学物質を取り除きません。周囲の人も、混合物と燃焼する炭の両方からの排出物を吸い込む可能性があります。' },
    removed: { title: '火を取り除いた理由。', body: 'UNO は炭を制御された電子加熱に置き換えます。これにより、一酸化炭素、灰、燃焼副生成物の直接的な発生源である燃焼する炭をなくします。吸入のリスクがなくなるわけではありません。回避可能な曝露源を取り除きます。' },
  },
  ko: {
    leaves: { title: '숯이\n남기는 것.', body: '숯은 혼합물을 가열하기만 하는 것이 아닙니다. 타면서 일산화탄소, 금속, 발암성 화학물질을 방출합니다. 이러한 배출물은 일반적인 물담배를 통과해 흡입하는 물질의 일부가 됩니다.' },
    warning: { title: '색도, 경고도 없습니다.', body: '일산화탄소는 폐에서 혈액으로 들어가 헤모글로빈과 결합하고 뇌와 심장에 전달되는 산소를 줄입니다. 두통, 어지럼증, 쇠약, 메스꺼움, 혼란은 경고 신호일 수 있습니다. 높은 수준의 노출은 의식 상실이나 사망을 유발할 수 있습니다.' },
    water: { title: '물은 안전하게 만들지 않습니다.', body: '물은 연기를 식히지만 많은 유해 화학물질을 제거하지 못합니다. 주변 사람들도 혼합물과 타는 숯 양쪽에서 나오는 배출물을 흡입할 수 있습니다.' },
    removed: { title: '불을 없앤 이유.', body: 'UNO는 숯을 제어된 전자 가열로 대체합니다. 이를 통해 일산화탄소, 재, 연소 부산물의 직접적인 원인인 타는 숯을 없앱니다. 흡입 위험이 사라지는 것은 아닙니다. 예방 가능한 노출원을 제거합니다.' },
  },
};
