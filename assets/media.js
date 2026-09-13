/* CENTER:1 — 作品専用オリジナル・ビジュアル（スタイライズSVG）
   実写差し替え用に <img> フォールバックも別途配線（engine側）。
   重要：ダンス動画は「1本の横長シーン(wideScene)」を左右にクロップして
   2つの“個別動画”に見せる。復元＝横長のまま再生（＝真相の論理的裏付け）。 */
(function () {
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(c1, c2, t) { return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))]; }
  function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }
  function svg(vb, inner, extra) { return '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice"' + (extra || '') + '>' + inner + '</svg>'; }

  var SKIN = [244, 218, 197];
  // 人物パラメータ（0..1）
  var PT = { hairL: 0.92, hairCol: [42, 40, 48], bang: 0.12, eye: 0.12, smile: 0.18, outfit: [64, 82, 150], bg: [225, 231, 244] }; // 紬 寒色
  var PR = { hairL: 0.28, hairCol: [122, 88, 54], bang: 0.82, eye: 0.85, smile: 0.86, outfit: [224, 150, 96], bg: [247, 236, 224] }; // 莉央 暖色
  var PM = { hairL: 0.55, hairCol: [96, 78, 64], bang: 0.5, eye: 0.5, smile: 0.6, outfit: [150, 150, 158], bg: [232, 232, 234] }; // 統合後

  function lp(a, b, t) {
    return {
      hairL: lerp(a.hairL, b.hairL, t), hairCol: mix(a.hairCol, b.hairCol, t),
      bang: lerp(a.bang, b.bang, t), eye: lerp(a.eye, b.eye, t),
      smile: lerp(a.smile, b.smile, t), outfit: mix(a.outfit, b.outfit, t), bg: mix(a.bg, b.bg, t)
    };
  }

  // 顔（バストアップ）。k=統合度(0..1)。
  function portrait(who, k) {
    k = Math.max(0, Math.min(1, k || 0));
    var base = who === "t" ? PT : PR;
    var p = lp(base, PM, k);
    var hc = rgb(p.hairCol), oc = rgb(p.outfit), bg = rgb(p.bg), sk = rgb(SKIN);
    var hairLen = 150 + p.hairL * 150;               // 肩下までの長さ
    var eyeH = 6 + p.eye * 5;                          // 目の丸み
    var mouth = "M118," + (196 - p.smile * 2) + " Q150," + (196 + p.smile * 22) + " 182," + (196 - p.smile * 2);
    var bang = p.bang;
    var inner =
      '<rect width="300" height="360" fill="' + bg + '"/>' +
      '<rect y="250" width="300" height="110" fill="' + oc + '"/>' +               // 服（肩）
      '<path d="M60,250 Q150,210 240,250 L240,300 L60,300 Z" fill="' + oc + '"/>' +
      // 後ろ髪
      '<path d="M86,150 Q150,60 214,150 L' + (214 + 6) + ',' + hairLen + ' Q150,' + (hairLen + 20) + ' ' + (86 - 6) + ',' + hairLen + ' Z" fill="' + hc + '"/>' +
      // 首・顔
      '<rect x="135" y="205" width="30" height="40" fill="' + sk + '"/>' +
      '<ellipse cx="150" cy="165" rx="66" ry="74" fill="' + sk + '"/>' +
      // 前髪（bangで分け目/流し）
      '<path d="M86,150 Q150,66 214,150 Q200,120 150,116 Q' + (150 - bang * 60) + ',120 ' + (110 - bang * 20) + ',150 Q100,132 86,150 Z" fill="' + hc + '"/>' +
      // 目
      '<ellipse cx="122" cy="168" rx="10" ry="' + eyeH + '" fill="#2c2a2e"/>' +
      '<ellipse cx="178" cy="168" rx="10" ry="' + eyeH + '" fill="#2c2a2e"/>' +
      '<circle cx="125" cy="166" r="2.4" fill="#fff"/><circle cx="181" cy="166" r="2.4" fill="#fff"/>' +
      // 眉（紬は直線的、莉央は下がり気味）
      '<path d="M108,' + (150 + (1 - p.eye) * 0) + ' Q122,' + (146 + p.eye * 6) + ' 136,150" stroke="#4a4148" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M164,150 Q178,' + (146 + p.eye * 6) + ' 192,' + (150) + '" stroke="#4a4148" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      // 頬・口
      '<ellipse cx="112" cy="188" rx="9" ry="5" fill="rgba(230,150,150,.28)"/>' +
      '<ellipse cx="188" cy="188" rx="9" ry="5" fill="rgba(230,150,150,.28)"/>' +
      '<path d="' + mouth + '" stroke="#b56b67" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    return svg("0 0 300 360", inner);
  }
  // 統合後の“最適な一人”（顔）
  function portraitMerged() { var p = PM; return portrait("t", 1); }

  // ダンサー全身（1体）。pose 0..2。col=服, hc=髪, hairL。
  function dancer(x, pose, col, hc, hairL) {
    var arms, legs, tilt;
    if (pose === 0) { arms = "M0,-40 L-34,-70 M0,-40 L34,-70"; legs = "M0,30 L-16,90 M0,30 L18,86"; tilt = -4; }
    else if (pose === 1) { arms = "M0,-40 L-40,-30 M0,-40 L40,-52"; legs = "M0,30 L-10,92 M0,30 L22,84"; tilt = 3; }
    else { arms = "M0,-40 L-30,-64 M0,-40 L44,-20"; legs = "M0,30 L-22,86 M0,30 L14,92"; tilt = 0; }
    return '<g transform="translate(' + x + ',210) rotate(' + tilt + ')">' +
      '<path d="M0,30 L-4,-40 L4,-40 Z" fill="none"/>' +
      '<line x1="0" y1="-40" x2="0" y2="30" stroke="' + col + '" stroke-width="20" stroke-linecap="round"/>' + // 胴
      '<path d="' + legs + '" stroke="' + col + '" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<path d="' + arms + '" stroke="' + rgb(SKIN) + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-58" r="16" fill="' + rgb(SKIN) + '"/>' +
      '<path d="M-16,-60 Q0,-84 16,-60 L' + (14) + ',' + (-58 + hairL * 46) + ' Q0,' + (-58 + hairL * 56) + ' -14,' + (-58 + hairL * 46) + ' Z" fill="' + hc + '"/>' +
      '</g>';
  }

  // 横長のダンスシーン（内側マークアップのみ）。frame 0..2。
  // 紬 ≒ x210、莉央 ≒ x430。中央付近で手足が相手側にわずかに入る＝分割の痕跡。
  function wideScene(frame, opt) {
    opt = opt || {};
    var floor =
      '<rect width="640" height="360" fill="#141822"/>' +
      '<rect y="250" width="640" height="110" fill="#1e2534"/>' +                     // 床
      '<rect x="0" y="0" width="640" height="60" fill="#0f131c"/>' +
      // スポットライト
      '<path d="M210,0 L150,250 L270,250 Z" fill="rgba(255,244,214,.10)"/>' +
      '<path d="M430,0 L370,250 L490,250 Z" fill="rgba(255,244,214,.10)"/>' +
      // 舞台奥の横断幕（同一舞台の証拠：連続した1枚）
      '<rect x="40" y="70" width="560" height="34" rx="4" fill="#2a3346"/>' +
      '<rect x="60" y="80" width="520" height="4" fill="#3d4a63"/>';
    var t = dancer(210 + (frame === 1 ? 8 : 0), frame, rgb(PT.outfit), rgb(PT.hairCol), PT.hairL);
    var r = dancer(430 - (frame === 2 ? 8 : 0), (frame + 1) % 3, rgb(PR.outfit), rgb(PR.hairCol), PR.hairL);
    // 影（床）
    var shadows = '<ellipse cx="210" cy="300" rx="40" ry="9" fill="rgba(0,0,0,.35)"/><ellipse cx="430" cy="300" rx="40" ry="9" fill="rgba(0,0,0,.35)"/>';
    return floor + shadows + t + r + (opt.mark ? '<circle cx="320" cy="40" r="3" fill="#3d4a63"/>' : '');
  }
  function danceWide(frame, opt) { return svg("0 0 640 360", wideScene(frame, opt)); }
  function danceHalf(side, frame) {
    var vb = side === "l" ? "0 0 320 360" : "320 0 320 360";
    return svg(vb, wideScene(frame));
  }

  // 学校外観
  function school() {
    return svg("0 0 800 360",
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ef"/><stop offset="1" stop-color="#eaf6fb"/></linearGradient></defs>' +
      '<rect width="800" height="360" fill="url(#sky)"/>' +
      '<circle cx="640" cy="70" r="120" fill="#fff4e0" opacity=".5"/>' +
      '<rect y="250" width="800" height="110" fill="#c9d6c0"/>' +                     // 前庭
      '<rect x="120" y="120" width="560" height="150" fill="#eef1f4"/>' +
      '<rect x="120" y="120" width="560" height="18" fill="#5b708a"/>' +
      '<g fill="#aebccb">' + Array.from({ length: 9 }).map(function (_, i) { return '<rect x="' + (150 + i * 58) + '" y="150" width="34" height="40"/><rect x="' + (150 + i * 58) + '" y="205" width="34" height="40"/>'; }).join("") + '</g>' +
      '<rect x="370" y="200" width="60" height="70" fill="#7d8ea0"/>' +               // 玄関
      '<rect x="300" y="70" width="30" height="60" fill="#8a99ab"/><rect x="292" y="60" width="46" height="12" fill="#5b708a"/>' + // 時計塔風
      '<path d="M100,120 L400,60 L700,120 Z" fill="#d9e2ea" opacity=".0"/>');
  }

  // 文化祭キービジュアル（朝凪＝朝の凪いだ海）
  function key() {
    return svg("0 0 800 420",
      '<defs><linearGradient id="mk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe4c4"/><stop offset=".5" stop-color="#ffd0d8"/><stop offset="1" stop-color="#bfe3ea"/></linearGradient></defs>' +
      '<rect width="800" height="420" fill="url(#mk)"/>' +
      '<circle cx="400" cy="180" r="86" fill="#fff3df" opacity=".85"/>' +
      '<rect y="300" width="800" height="120" fill="#9fc7cf"/>' +
      '<g stroke="#eaf6f7" stroke-width="2" opacity=".5"><line x1="0" y1="330" x2="800" y2="330"/><line x1="0" y1="360" x2="800" y2="360"/><line x1="0" y1="392" x2="800" y2="392"/></g>' +
      '<g fill="#fff" opacity=".7"><circle cx="150" cy="90" r="3"/><circle cx="680" cy="70" r="2"/><circle cx="560" cy="120" r="2"/></g>');
  }

  // ダンス部 集合写真（n体、gone=消えた位置は詰める）
  function group(n) {
    var cols = [PT, PR, PM, PT, PR];
    var body = '<rect width="640" height="300" fill="#20283a"/><rect y="210" width="640" height="90" fill="#2a3550"/>';
    var gap = 640 / (n + 1);
    for (var i = 0; i < n; i++) {
      var p = cols[i % cols.length];
      body += dancer(gap * (i + 1), i % 3, rgb(p.outfit), rgb(p.hairCol), p.hairL);
    }
    return svg("0 0 640 300", body);
  }

  // 潮風ホール（閉鎖）舞台
  function hall(opt) {
    opt = opt || {};
    return svg("0 0 640 360",
      '<rect width="640" height="360" fill="#171a1e"/>' +
      '<rect x="60" y="60" width="520" height="210" fill="#20242b"/>' +               // 舞台
      '<rect x="60" y="60" width="520" height="210" fill="none" stroke="#2f353e" stroke-width="4"/>' +
      '<rect x="0" y="270" width="640" height="90" fill="#101318"/>' +                 // 客席側
      '<g fill="#191d23">' + Array.from({ length: 5 }).map(function (_, i) { return '<rect x="30" y="' + (280 + i * 14) + '" width="580" height="8" rx="3"/>'; }).join("") + '</g>' + // 座席列
      '<path d="M60,60 L120,60 L120,270 L60,270 Z" fill="#0d0f13"/>' +                 // 舞台袖
      '<path d="M520,60 L580,60 L580,270 L520,270 Z" fill="#0d0f13"/>' +               // 舞台袖(反対)
      '<rect x="300" y="40" width="40" height="20" fill="#242a32"/>' +                 // 非常口サイン枠
      '<rect x="306" y="45" width="28" height="10" fill="#2f7d4f"/>' +                 // 非常口(緑)
      (opt.shadow ? '<ellipse cx="330" cy="230" rx="34" ry="10" fill="rgba(120,140,160,.22)"/>' : ''));
  }

  // 江の島 特徴（屋外・場所特定用）
  var eno = {
    station: function () {
      return svg("0 0 400 300",
        '<rect width="400" height="300" fill="#cfe3ea"/><rect y="220" width="400" height="80" fill="#c9c2b2"/>' +
        '<rect x="90" y="120" width="220" height="120" fill="#e6d6b8"/>' +               // 竜宮造りの駅舎
        '<path d="M70,120 Q200,40 330,120 Z" fill="#3f6f74"/>' +                          // 反り屋根
        '<path d="M70,120 Q200,72 330,120" fill="none" stroke="#2c5257" stroke-width="6"/>' +
        '<rect x="150" y="170" width="100" height="70" fill="#7d5a3a"/>' +               // 入口
        '<rect x="190" y="180" width="8" height="60" fill="#5a3f28"/>' +
        '<circle cx="200" cy="95" r="10" fill="#e2b24a"/>');                              // 装飾
    },
    island: function () {
      return svg("0 0 400 300",
        '<rect width="400" height="300" fill="#bfe0ea"/><rect y="180" width="400" height="120" fill="#7fb0bc"/>' +
        '<path d="M120,180 Q230,90 360,180 Z" fill="#5f7d5a"/>' +                         // 島（丘）
        '<rect x="300" y="70" width="16" height="70" fill="#dfe6ea"/>' +                  // 展望灯台
        '<rect x="294" y="60" width="28" height="14" fill="#c94f4f"/><rect x="298" y="46" width="20" height="16" fill="#e8e2d6"/>' +
        '<rect x="0" y="196" width="300" height="10" fill="#8a8f97"/>');                  // 海に架かる橋
    },
    bridge: function () {
      return svg("0 0 400 300",
        '<rect width="400" height="300" fill="#cfe6ec"/><rect y="150" width="400" height="150" fill="#8fbcc6"/>' +
        '<rect y="150" width="400" height="22" fill="#9aa2ab"/>' +                        // 長い橋
        '<g fill="#c9ced4">' + Array.from({ length: 8 }).map(function (_, i) { return '<rect x="' + (20 + i * 50) + '" y="150" width="6" height="60"/>'; }).join("") + '</g>' +
        '<rect x="40" y="120" width="120" height="26" rx="4" fill="#2f3a4a"/><text x="50" y="138" font-size="14" fill="#eaf0f4" font-family="sans-serif">江ノ島 ゆき</text>'); // 道標
    }
  };

  // 過去の発表会（幼少の二人が同じ舞台に）
  function recital() {
    return svg("0 0 640 360",
      '<rect width="640" height="360" fill="#efe6d6"/>' +                                 // 古い写真の地
      '<rect x="20" y="20" width="600" height="320" fill="#f6efe0" stroke="#d8cbb2" stroke-width="6"/>' +
      '<rect x="60" y="70" width="520" height="180" fill="#2a2438"/>' +                   // 舞台
      '<path d="M210,0 L180,250 L300,250 Z" transform="translate(0,60)" fill="rgba(255,240,210,.12)"/>' +
      dancerSmall(250, rgb(PT.outfit), rgb(PT.hairCol), PT.hairL) +
      dancerSmall(390, rgb(PR.outfit), rgb(PR.hairCol), PR.hairL) +
      '<text x="70" y="320" font-size="16" fill="#8a7d63" font-family="serif">2016 しおかぜダンス発表会 ・ 潮風ホール</text>');
  }
  function dancerSmall(x, col, hc, hairL) {
    return '<g transform="translate(' + x + ',150) scale(0.7)">' +
      '<line x1="0" y1="-40" x2="0" y2="30" stroke="' + col + '" stroke-width="20" stroke-linecap="round"/>' +
      '<path d="M0,-40 L-30,-64 M0,-40 L30,-64" stroke="' + rgb(SKIN) + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M0,30 L-16,90 M0,30 L16,90" stroke="' + col + '" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<circle cx="0" cy="-58" r="16" fill="' + rgb(SKIN) + '"/>' +
      '<path d="M-16,-60 Q0,-84 16,-60 L14,' + (-58 + hairL * 40) + ' Q0,' + (-58 + hairL * 50) + ' -14,' + (-58 + hairL * 40) + ' Z" fill="' + hc + '"/></g>';
  }

  // 校内マップ（簡易）
  function map() {
    return svg("0 0 640 400",
      '<rect width="640" height="400" fill="#eef3ef"/>' +
      '<rect x="40" y="40" width="240" height="120" rx="6" fill="#d8e4d6" stroke="#9fb6a2" stroke-width="2"/><text x="60" y="105" font-size="16" fill="#4a5b50" font-family="sans-serif">本校舎</text>' +
      '<rect x="320" y="40" width="280" height="90" rx="6" fill="#d8e0ea" stroke="#9fabbe" stroke-width="2"/><text x="340" y="92" font-size="16" fill="#4a556a" font-family="sans-serif">体育館（ダンス部ステージ）</text>' +
      '<rect x="40" y="200" width="180" height="160" rx="6" fill="#eadfce" stroke="#c3b291" stroke-width="2"/><text x="60" y="285" font-size="15" fill="#6a5c3f" font-family="sans-serif">模擬店エリア</text>' +
      '<rect x="260" y="170" width="340" height="190" rx="6" fill="#e5ddef" stroke="#b1a3c7" stroke-width="2"/><text x="280" y="270" font-size="16" fill="#5a4d6e" font-family="sans-serif">中庭ステージ</text>' +
      '<circle cx="410" cy="85" r="8" fill="#d98a3d"/>');
  }

  window.CX_MEDIA = {
    portrait: portrait, portraitMerged: portraitMerged,
    danceWide: danceWide, danceHalf: danceHalf,
    school: school, key: key, group: group, hall: hall, eno: eno, recital: recital, map: map
  };
})();
