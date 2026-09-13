/* CENTER:1 — 朝凪祭2026 エンジン（状態・データ・進行）
   謎解きUI・ヒント・自由入力AIは置かない。UIは学校ポータルとして自然に。 */
(function () {
  "use strict";
  var M = window.CX_MEDIA;

  /* ===================== 安全なストレージ ===================== */
  var mem = {};
  function lsGet(k){ try{ var v=localStorage.getItem(k); return v===null?(k in mem?mem[k]:null):v; }catch(e){ return k in mem?mem[k]:null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} mem[k]=v; }
  function lsDel(k){ try{ localStorage.removeItem(k); }catch(e){} delete mem[k]; }

  /* ===================== 状態 ===================== */
  var HKEY="cx_history", SKEY="cx_state";
  function loadJSON(k,def){ try{ return Object.assign({},def,JSON.parse(lsGet(k)||"{}")); }catch(e){ return Object.assign({},def); } }
  var H = loadJSON(HKEY,{ ranEver:false, firstPick:null, everVanished:false, visits:0 });
  var S = lsGet(SKEY) ? loadJSON(SKEY,{}) : null;
  H.visits=(H.visits||0)+1; saveH();
  if(!S){ S = freshState(); saveS(); }
  function freshState(){ return { run: H.ranEver?2:1, voted:false, pick:null, traits:[], opt:0, vanished:false, seenHall:false, maps:false, undone:false, end1:false, restored:false, trueend:false, bothViewed:false, viewed:{} }; }
  function saveS(){ lsSet(SKEY, JSON.stringify(S)); }
  function saveH(){ lsSet(HKEY, JSON.stringify(H)); }
  function opp(p){ return p==="t"?"r":"t"; }
  function chosen(){ return S.pick; }
  function remaining(){ return S.undone?opp(S.pick):S.pick; }   // 世界に残る側
  function gone(){ return S.undone?S.pick:opp(S.pick); }        // 消えた側
  function isPresent(id){ // 部員一覧などに存在するか
    if(!S.vanished) return true;         // 消失前は二人とも
    return id===remaining();
  }
  var VANISH_AT=3;

  /* ===================== データ ===================== */
  var G = {
    t:{ id:"t", name:"相沢 紬", kana:"あいざわ つむぎ", grade:"2年 B組 ・ ダンス部",
      tagline:"努力で、ここまで来た。",
      base:"幼い頃からダンスを続けてきました。誰よりも練習した自信があります。正直、勝ちたい。センターに立ちたい。その気持ちを、隠すつもりはありません。",
      quote:"「わたしの長所は、努力です。……って言い切るの、ちょっとだけ、こわいけどね。」",
      neg:"協調性に、やや課題。自己主張が強い傾向。", // 非選択時の再構成
      achieve:"地区ダンスコンテスト 2年連続入賞／週6の自主練習を欠かさない",
      comment:"莉央には、華がある。わたしにはそれがない。だからせめて、努力だけは。" },
    r:{ id:"r", name:"白石 莉央", kana:"しらいし りお", grade:"2年 A組 ・ ダンス部",
      tagline:"楽しくなきゃ、踊る意味がない。",
      base:"むずかしいことは、あんまり考えてないかも。ただ、みんなと踊るのが好き。見てくれる人が笑ってくれたら、それがいちばんうれしい。紬みたいに努力できる子を、本当はすごいと思ってる。",
      quote:"「センター？ うーん、紬のほうが上手だよ。わたしは、楽しいだけ。」",
      neg:"実力より雰囲気先行。努力の跡が見えにくい。",
      achieve:"文化祭ステージ来場アンケート人気1位（昨年）／SNS紹介動画が話題に",
      comment:"紬の努力、ずっとそばで見てきた。だからわたし、紬には勝てないなって、いつも思ってる。" }
  };
  // 評価項目（投票時に選ぶ）→ 選択者の“公式断定”に流用される
  var TRAITS = [
    { id:"doryoku", label:"努力が伝わる" },
    { id:"shitashimi", label:"親しみやすい" },
    { id:"center", label:"センターらしい" },
    { id:"sunao", label:"素直" },
    { id:"inshou", label:"印象に残る" }
  ];
  function traitLabel(id){ for(var i=0;i<TRAITS.length;i++) if(TRAITS[i].id===id) return TRAITS[i].label; return id; }

  var NEWS = [
    { d:"2026-09-12", t:"朝凪祭2026 特設サイトを公開しました。" },
    { d:"2026-09-13", t:"ダンス部ステージ「センターメンバー投票」受付中！あなたの一票でセンターが決まります。" },
    { d:"2026-09-14", t:"当日タイムテーブルを掲載しました。" },
    { d:"2026-09-15", t:"フォトギャラリーを更新。昨年度の様子を掲載しています。" }
  ];
  var TT = [
    ["10:00","開会式","中庭ステージ"],
    ["10:30","吹奏楽部 演奏","中庭ステージ"],
    ["11:30","有志バンド","中庭ステージ"],
    ["13:00","ダンス部 ステージ","体育館"],
    ["14:30","演劇部 公演","第一体育館"],
    ["15:30","閉会式・結果発表","中庭ステージ"]
  ];

  /* ===================== ルーター／描画 ===================== */
  var app;
  function bodyPhase(){
    var b=document.body; b.className="";
    if(S.trueend){ b.classList.add("phase-solo"); return; }
    if(S.end1){ b.classList.add("phase-solo"); return; }
    if(S.vanished){ b.classList.add("phase-solo"); }
    else if(S.opt>=1){ b.classList.add("phase-late"); }
    if(S.run>=2) b.classList.add("run2");
  }
  function setTitle(t){ document.title = t?(t+" | 朝凪祭2026"):"朝凪祭2026 特設サイト"; }
  function render(html){ app.innerHTML = shell(html); bodyPhase(); window.scrollTo(0,0); }
  function toast(msg){
    var el=document.getElementById("cx-toast"); if(!el){ el=document.createElement("div"); el.id="cx-toast"; el.className="toast"; document.body.appendChild(el); }
    el.textContent=msg; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(function(){ el.classList.remove("show"); },2600);
  }

  function header(){
    var items=[["#/","ホーム"],["#/news","お知らせ"],["#/timetable","タイムテーブル"],["#/map","校内マップ"],["#/stage","ステージ企画"],["#/gallery","フォトギャラリー"]];
    return '<a class="skip" href="#main">本文へ</a><header class="hd"><div class="hd-in">'+
      '<a class="logo" href="#/"><span class="mk"></span><span>朝凪祭<small>ASANAGI FES 2026</small></span></a>'+
      '<button class="navtoggle" onclick="CX.nav(this)">MENU</button>'+
      '<nav class="gnav" id="gnav"><ul>'+items.map(function(n){return '<li><a href="'+n[0]+'">'+n[1]+'</a></li>';}).join("")+'</ul></nav>'+
      '</div></header>';
  }
  function footer(){
    var visitors = 1284 + (H.ranEver?1:0); // 二周目：自分の一票が含まれる
    return '<footer class="ft">'+
      '<div><a href="#/pr">文化祭広報について</a> ・ <a href="#/mira">掲載情報の最適化について</a> ・ <a href="#/confirm">投票内容の確認</a></div>'+
      '<p class="mira-note">来場予定 '+visitors.toLocaleString()+' 名 ・ 本サイトは MIRA（学校広報最適化クラウド／ルミナ・エデュケーション株式会社）により最適化されています。'+(S.run>=2?'　最適化履歴：1件':'')+'</p>'+
      '<p class="fic">※本サイトは青葉坂46公式および関係各社とは関係のない、非公式のフィクション作品です。登場する人物・学校・団体・システムはすべて架空であり、実在のものとは一切関係ありません。</p>'+
      '<p style="font-size:.72rem;margin-top:8px"><a href="#" onclick="return CX.hardReset()">サイトデータを削除する</a></p>'+
      '</footer>';
  }
  function shell(main){ return header()+'<main id="main">'+main+'</main>'+footer(); }

  /* ---------- 動画プレイヤー ---------- */
  var players={}, pidc=0;
  function vp(kind, side, cap){
    var id="vp"+(pidc++);
    players[id]={kind:kind, side:side, frame:0, playing:false};
    var scr = kind==="wide"?M.danceWide(0):M.danceHalf(side,0);
    return '<div class="vp" id="'+id+'">'+
      '<div class="screen" data-id="'+id+'">'+scr+'<div class="play-ov" onclick="CX.play(\''+id+'\')"><span class="tri"></span></div></div>'+
      '<div class="bar"><span class="t">0:00</span><div class="track"><div class="fill"></div></div><span class="t">0:24</span></div>'+
      '<div class="cap">'+(cap||"")+'</div></div>';
  }
  function playToggle(id){
    var p=players[id]; if(!p) return; var root=document.getElementById(id); if(!root) return;
    var scr=root.querySelector(".screen"), ov=root.querySelector(".play-ov"), fill=root.querySelector(".fill"), tl=root.querySelector(".bar .t");
    if(p.playing){ clearInterval(p._i); p.playing=false; if(ov) ov.style.display="flex"; return; }
    p.playing=true; if(ov) ov.style.display="none";
    var frames=24, step=0;
    p._i=setInterval(function(){
      step=(step+1)%frames; p.frame=(p.frame+1)%3;
      var mk = p.kind==="wide"?M.danceWide(p.frame):M.danceHalf(p.side,p.frame);
      // 差し替え（play-ov は隠したまま）
      var holder=scr; var old=holder.querySelector("svg"); if(old){ var tmp=document.createElement("div"); tmp.innerHTML=mk; holder.replaceChild(tmp.firstChild, old); }
      if(fill) fill.style.width=Math.round(step/frames*100)+"%";
      if(tl) tl.textContent="0:"+String(Math.round(step/frames*24)).padStart(2,"0");
    },260);
  }

  /* ---------- プロフィール表示（投票後の書き換え） ---------- */
  function displayTagline(g){
    if(!S.voted) return G[g].tagline;
    if(g===chosen() && (!S.vanished || g===remaining())){
      var ts=S.traits.length?S.traits.map(traitLabel):["印象に残る"];
      return "学校公式推薦：" + ts.slice(0,3).join("、") + " センター候補。";
    }
    if(g===opp(chosen())) return G[g].neg;
    return G[g].tagline;
  }
  function displayIntro(g){
    if(S.voted && g===chosen()){
      return "本校ダンス部を代表するにふさわしい生徒です。閲覧者の評価にもとづき、"+ (S.traits.length?S.traits.map(traitLabel).join("・"):"総合的") +"な魅力を高く評価しています。学校公式として、"+G[g].name+"さんをセンターに推薦します。";
    }
    if(S.voted && g===opp(chosen())) return G[g].base+"（※本コメントは一部の閲覧者から否定的な反応が報告されています。）";
    return G[g].base;
  }

  /* ===================== 各ページ ===================== */
  function vHome(){
    setTitle("");
    var order = S.run>=2 ? ["r","t"] : ["t","r"]; // 二周目は立ち位置が逆
    var candCards = order.map(function(g){ if(!isPresent(g)) return ""; return miniCand(g); }).join("");
    var soloNote = (S.vanished||S.end1||S.trueend) ? '' : '';
    var html =
      '<section class="hero"><div class="hero-card">'+
        '<div class="kv">'+M.key()+'</div>'+
        '<div class="hero-ov"><h1>朝凪祭 2026</h1><p>私立 朝凪学園高等学校　文化祭</p><div class="hero-date">2026.10.4 SUN 開催</div></div>'+
      '</div></section>'+
      '<div class="wrap">'+
      // 見どころ
      '<section class="sec"><div class="sec-h"><span class="en">Highlights</span><h2>今年の見どころ</h2></div>'+
        '<div class="grid g3">'+
          card(M.school(),"模擬店エリア","中庭と旧校舎前に、クラス自慢の模擬店がずらり。","模擬店")+
          card(M.map(),"校内マップ","当日の会場をチェック。","#/map","マップ")+
          card(M.group(3),"ダンス部ステージ","今年の目玉。センターは誰の手に？","#/dance","ステージ")+
        '</div></section>'+
      // ダンス部＋投票導線
      '<section class="sec"><div class="sec-h"><span class="en">Vote</span><h2>ダンス部ステージ センターメンバー投票</h2><a class="more" href="#/dance">詳しく →</a></div>'+
        '<div class="mira" style="margin-bottom:14px">'+
          '<div class="mh"><span class="dot"></span>MIRA によるおすすめ</div>'+
          '<p style="margin:.2em 0;color:#dfeaea">今年のダンス部ステージでは、センターに立つ一人を、みなさんの投票で決定します。二人の候補のダンス動画と自己紹介を見て、応援したい方に投票してください。</p>'+
        '</div>'+
        '<div class="cands">'+candCards+'</div>'+
        (isPresent("t")&&isPresent("r") ? '<p style="text-align:center;margin-top:18px"><a class="btn" href="#/vote">投票する</a></p>'
          : '<p style="text-align:center;margin-top:18px;color:var(--sub)">今年のセンターは <strong>'+G[remaining()].name+'</strong> さんです。たくさんの応援をありがとうございました。</p>')+
      '</section>'+
      // お知らせ抜粋
      '<section class="sec"><div class="sec-h"><span class="en">News</span><h2>お知らせ</h2><a class="more" href="#/news">一覧 →</a></div>'+
        newsList(NEWS.slice(0,3))+'</section>'+
      '</div>';
    render(html);
  }
  function miniCand(g){
    var G0=G[g];
    return '<div class="cand"><div class="pimg">'+M.portrait(g, Math.min(1,S.opt/5))+'</div>'+
      '<div class="pbody"><h3>'+G0.name+'</h3><div class="grade">'+G0.grade+'</div>'+
      '<div class="tagline'+(S.voted&&g===opp(chosen())?' neg':'')+'">'+displayTagline(g)+'</div>'+
      '<a class="btn ghost sm" href="#/cand/'+g+'">プロフィールを見る</a></div></div>';
  }
  function card(svg,title,desc,href,pill){
    var link = href&&href.charAt(0)==="#";
    return '<a class="card" href="'+(link?href:"#/stage")+'"><div class="cimg">'+svg+'</div>'+
      '<div class="cbody">'+(pill?'<span class="pill">'+pill+'</span> ':'')+'<h3>'+title+'</h3><p>'+desc+'</p></div></a>';
  }
  function newsList(items){ return '<ul class="news">'+items.map(function(n){return '<li><span class="d">'+n.d+'</span><span class="t">'+n.t+'</span></li>';}).join("")+'</ul>'; }

  function vNews(){ setTitle("お知らせ"); render('<div class="wrap"><div class="page"><h1>お知らせ</h1>'+newsList(NEWS)+'<p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }
  function vTimetable(){
    setTitle("タイムテーブル");
    var rows=TT.slice(); if(S.vanished){ /* 後半：列が一つ減る演出＝ダンス部の“二人”表記が消える程度 */ }
    render('<div class="wrap"><div class="page" style="max-width:640px"><h1>タイムテーブル</h1>'+
      '<table class="tt"><tr><th>時間</th><th>企画</th><th>会場</th></tr>'+
      rows.map(function(r){return '<tr><td class="time">'+r[0]+'</td><td>'+r[1]+(r[1].indexOf("ダンス")>=0?'（センター：'+(isPresent("t")&&isPresent("r")?"投票受付中":G[remaining()].name)+'）':'')+'</td><td>'+r[2]+'</td></tr>';}).join("")+
      '</table><p class="backlink"><a href="#/">← ホーム</a></p></div></div>');
  }
  function vMap(){ setTitle("校内マップ"); render('<div class="wrap"><div class="page"><h1>校内マップ</h1><div style="border-radius:12px;overflow:hidden;border:1px solid var(--line)">'+M.map()+'</div><p class="lead" style="margin-top:12px">ダンス部ステージは体育館です。中庭ステージ・模擬店エリアもあわせてお楽しみください。</p><p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }
  function vStage(){
    setTitle("ステージ企画");
    var duoAffordance = stageRegistration();
    render('<div class="wrap"><div class="page"><h1>ステージ企画</h1>'+
      '<p class="lead">中庭ステージ・体育館の各企画をご紹介します。</p>'+
      '<h2>ダンス部ステージ「'+演目名()+'」</h2>'+
      '<p>ダンス部が贈る、今年いちばんのステージ。センターに立つ一人を、来場者投票で選びます。<a href="#/dance">ダンス部紹介・投票へ →</a></p>'+
      duoAffordance+
      '<h2>吹奏楽部／演劇部／有志バンド</h2><p>中庭ステージを中心に、各団体が日頃の成果を披露します。詳しくは<a href="#/timetable">タイムテーブル</a>をご覧ください。</p>'+
      '<p class="backlink"><a href="#/">← ホーム</a></p></div></div>');
  }
  function 演目名(){ return S.restored ? "CENTER" : "CENTER：1"; }
  // ステージ登録形式（ソロ/デュオ）＝最後の大謎の操作
  function stageRegistration(){
    var canRestore = (S.run>=2 && S.maps && S.bothViewed);
    return '<div class="mira" style="margin:14px 0">'+
      '<div class="mh"><span class="dot"></span>ステージ登録情報（MIRA）</div>'+
      '<div class="row"><span class="k">演目</span><span>'+演目名()+'</span></div>'+
      '<div class="row"><span class="k">登録形式</span><span id="regfmt">'+(S.restored?"デュオ（2名）":"ソロ（センター1名）")+'</span></div>'+
      '<div class="row"><span class="k">登録映像</span><span>'+(S.restored?"元の1本（横長）":"個別映像 ×2")+'</span></div>'+
      (S.restored ? '<p style="margin:.6em 0 0;color:#9fe0dd">この演目は「デュオ」として登録されています。</p>'
        : '<p style="margin:.8em 0 .4em;color:#9fb0b8;font-size:.82rem">登録形式は変更できます。</p>'+
          '<button class="btn sm" onclick="CX.toggleDuo()">登録形式を「デュオ（2名）」に戻す</button>')+
      '</div>';
  }

  function vDance(){
    setTitle("ダンス部紹介");
    if(!(isPresent("t")&&isPresent("r"))) return vDanceSolo();
    var order = S.run>=2?["r","t"]:["t","r"];
    render('<div class="wrap"><div class="page" style="max-width:920px"><h1>ダンス部 紹介</h1>'+
      '<p class="lead">今年のダンス部ステージは、二人のセンター候補による特別企画。二人のダンス動画と自己紹介を見て、応援したい方に投票してください。</p>'+
      '<div class="cands" style="margin:18px 0">'+order.map(candBlock).join("")+'</div>'+
      '<div class="votebox"><h3 style="margin:.1em 0 .3em">センターメンバー投票</h3>'+
        '<p style="color:var(--sub);margin:.2em 0 .6em">受付中。<a href="#/vote">投票ページへ →</a></p></div>'+
      '<p class="backlink"><a href="#/">← ホーム</a></p></div></div>');
  }
  function candBlock(g){
    var G0=G[g];
    return '<div class="cand"><div class="pimg">'+M.portrait(g,Math.min(1,S.opt/5))+'</div><div class="pbody">'+
      '<h3>'+G0.name+'</h3><div class="grade">'+G0.grade+'</div>'+
      '<div class="tagline'+(S.voted&&g===opp(chosen())?' neg':'')+'">'+displayTagline(g)+'</div>'+
      '<div class="vp" style="margin:10px 0">'+ /* サムネ的に */ '</div>'+
      vp("half", g==="t"?"l":"r", G0.name+" 自己PR映像（ダンス部紹介映像）")+
      '<div class="quote">'+(S.voted&&g===opp(chosen())?G0.neg:G0.quote)+'</div>'+
      '<div class="evalrow"><a class="btn ghost sm" href="#/cand/'+g+'">プロフィール</a> <a class="btn ghost sm" href="#/video/'+g+'">映像を詳しく見る</a></div>'+
      '</div></div>';
  }
  function vDanceSolo(){
    var g=remaining(), G0=G[g];
    render('<div class="wrap"><div class="page" style="max-width:720px"><h1>ダンス部 紹介</h1>'+
      '<div class="cand" style="max-width:420px;margin:0 auto"><div class="pimg">'+M.portrait(g,1)+'</div><div class="pbody">'+
      '<h3>'+G0.name+'</h3><div class="grade">'+G0.grade+'</div>'+
      '<div class="tagline">'+displayTagline(g)+'</div>'+
      vp("half", g==="t"?"l":"r", G0.name+" 自己PR映像")+
      '<div class="quote">'+(S.end1?"「ずっと一人で、センターを目指してきました。」":G0.quote)+'</div>'+
      '</div></div>'+
      '<p class="backlink" style="margin-top:16px"><a href="#/">← ホーム</a></p></div></div>');
  }

  function vCand(g){
    if(!G[g]) return v404();
    if(!isPresent(g)){ // 消えた候補のプロフィールは“存在しない”
      setTitle("ページが見つかりません");
      return render('<div class="wrap"><div class="page"><h1>ページが見つかりません</h1><p>指定された生徒のプロフィールは見つかりませんでした。ダンス部の在籍記録に該当者がいません。</p><p class="backlink"><a href="#/dance">← ダンス部紹介</a> ・ <a href="#/confirm">投票内容の確認</a></p></div></div>');
    }
    var G0=G[g]; setTitle(G0.name);
    render('<div class="wrap"><div class="page" style="max-width:760px"><h1>'+G0.name+' <span style="font-size:.6em;color:var(--sub)">'+G0.kana+'</span></h1>'+
      '<div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">'+
        '<div style="flex:0 0 220px;border-radius:12px;overflow:hidden;border:1px solid var(--line)">'+M.portrait(g,Math.min(1,S.opt/5))+'</div>'+
        '<div style="flex:1;min-width:240px"><div class="grade">'+G0.grade+'</div>'+
        '<p class="tagline'+(S.voted&&g===opp(chosen())?' neg':'')+'" style="font-size:1.1rem">'+displayTagline(g)+'</p>'+
        '<p>'+displayIntro(g)+'</p>'+
        '<p style="color:var(--sub);font-size:.86rem"><strong>おもな実績：</strong>'+achieveFor(g)+'</p>'+
        '</div></div>'+
      '<h2>自己PR映像</h2>'+vp("half", g==="t"?"l":"r", G0.name+" 自己PR映像（ダンス部紹介映像）")+
      '<p style="color:var(--sub);font-size:.82rem;margin-top:6px">撮影地：本校 体育館。<a href="#/video/'+g+'">この映像を詳しく見る →</a></p>'+
      '<h2>評価する</h2>'+
      '<p style="color:var(--sub);font-size:.86rem">この生徒の魅力だと思う点を選んで送信すると、広報内容に反映されます。</p>'+
      evalPanel(g)+
      '<h2>閲覧者コメント</h2>'+commentBlock(g)+
      '<p class="backlink"><a href="#/dance">← ダンス部紹介</a></p></div></div>');
  }
  function achieveFor(g){
    if(S.voted && g===chosen() && S.vanished){
      // 統合：消えた側の実績が移る
      return G[chosen()].achieve+"／"+G[opp(chosen())].achieve;
    }
    return G[g].achieve;
  }
  function evalPanel(g){
    return '<div class="evalrow" id="ev-'+g+'">'+TRAITS.map(function(t){return '<button class="chip" aria-pressed="false" onclick="CX.evChip(this)">'+t.label+'</button>';}).join("")+'</div>'+
      '<button class="btn sm" style="margin-top:8px" onclick="CX.evaluate(\''+g+'\')">評価を送信</button>';
  }
  function commentBlock(g){
    var G0=G[g];
    var youReason = (S.voted && g===chosen() && S.traits.length) ? '<li style="padding:8px 0;border-top:1px solid var(--line)"><strong>閲覧者の総意：</strong>'+S.traits.map(traitLabel).join("・")+'</li>' : '';
    var base = g===chosen()&&S.voted
      ? '<li style="padding:8px 0">「やっぱりこの子がセンターだよね」「学校公式もおすすめしてる」</li>'
      : (g===opp(chosen())&&S.voted&&S.vanished
        ? '<li style="padding:8px 0;color:var(--sub)">（この生徒に関するコメントは見つかりませんでした）</li>'
        : '<li style="padding:8px 0">「'+(g==="t"?"努力してるの伝わる…！":"見てて元気もらえる！")+'」<button class="btn ghost sm" style="margin-left:8px" onclick="CX.helpful(\''+g+'\')">参考になった</button></li>');
    return '<ul style="list-style:none;margin:0;padding:0">'+youReason+base+'</ul>';
  }

  function vVote(){
    if(S.voted){ location.hash="#/confirm"; return; }
    if(!(isPresent("t")&&isPresent("r"))){ location.hash="#/dance"; return; }
    setTitle("センターメンバー投票");
    var order=S.run>=2?["r","t"]:["t","r"];
    var voteWord = S.run>=2 ? '<span id="voteword">選ぶ</span>' : '選ぶ';
    render('<div class="wrap"><div class="page" style="max-width:680px"><h1>センターメンバー投票</h1>'+
      '<p class="lead">応援したい候補を一人選び、その理由（魅力だと思う点）を選んでください。あなたの評価は、文化祭の広報内容に反映されます。</p>'+
      '<div class="votebox">'+
        '<div style="font-weight:700;margin-bottom:6px">1. 応援する候補を'+voteWord+'（1名）</div>'+
        '<div class="votepick">'+order.map(function(g){return '<button class="pickbtn" data-g="'+g+'" aria-pressed="false" onclick="CX.pick(this)">'+G[g].name+'<small>'+G[g].tagline+'</small></button>';}).join("")+'</div>'+
        '<div style="font-weight:700;margin:14px 0 6px">2. 魅力だと思う点（1つ以上）</div>'+
        '<div class="traits" id="votetraits">'+TRAITS.map(function(t){return '<button class="chip" data-tid="'+t.id+'" aria-pressed="false" onclick="CX.evChip(this)">'+t.label+'</button>';}).join("")+'</div>'+
        '<button class="btn block" style="margin-top:8px" onclick="CX.submitVote()">この内容で投票する</button>'+
        '<p class="msg" id="votemsg"></p>'+
      '</div>'+
      '<p class="backlink"><a href="#/dance">← ダンス部紹介にもどる</a></p></div></div>');
    if(S.run>=2){ setTimeout(function(){ var w=document.getElementById("voteword"); if(w){ w.textContent="残す"; setTimeout(function(){ if(w) w.textContent="選ぶ"; },900);} },700); }
  }
  function vVoted(){
    setTitle("投票ありがとうございます");
    render('<div class="wrap"><div class="page" style="max-width:620px;text-align:center">'+
      '<h1>投票ありがとうございます</h1>'+
      '<p>あなたの一票を受け付けました。<br>皆さまの評価を、広報内容へ反映します。</p>'+
      '<p style="color:var(--sub);font-size:.88rem">投票内容は<a href="#/confirm">投票内容の確認</a>からいつでも見られます。</p>'+
      '<p style="margin-top:20px"><a class="btn" href="#/">トップページへ戻る</a></p>'+
      '</div></div>');
  }

  function vConfirm(){
    setTitle("投票内容の確認");
    if(!S.voted){ return render('<div class="wrap"><div class="page"><h1>投票内容の確認</h1><p>まだ投票していません。<a href="#/vote">投票ページへ</a></p><p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }
    var comparedHtml =
      '<div class="compare" style="margin:14px 0">'+
        '<div class="col"><h4>'+G["t"].name+'</h4><div style="border-radius:8px;overflow:hidden">'+M.portrait("t",0)+'</div></div>'+
        '<div class="mid">VS</div>'+
        '<div class="col"><h4>'+G["r"].name+'</h4><div style="border-radius:8px;overflow:hidden">'+M.portrait("r",0)+'</div></div>'+
      '</div>';
    render('<div class="wrap"><div class="page" style="max-width:720px"><h1>投票内容の確認</h1>'+
      '<div class="mira"><div class="mh"><span class="dot"></span>あなたのブラウザに保存された投票データ</div>'+
        '<div class="row"><span class="k">投票（'+(S.run>=2?"2回目":"1回目")+'）</span><span>'+G[S.pick].name+'</span></div>'+
        '<div class="row"><span class="k">選んだ評価項目</span><span>'+(S.traits.length?S.traits.map(traitLabel).join("、"):"（なし）")+'</span></div>'+
        '<div class="row"><span class="k">比較した候補</span><span>'+G["t"].name+' ／ '+G["r"].name+'</span></div>'+
      '</div>'+
      '<p style="color:var(--sub);font-size:.86rem;margin-top:12px">あなたが投票時に比較した二人の候補：</p>'+comparedHtml+
      (S.vanished?'<p style="color:var(--warm-d);font-size:.85rem">※現在、'+G[gone()].name+'さんは部員一覧に表示されていません。上記はあなたのブラウザに残った投票時の記録です。</p>':'')+
      '<hr style="border:none;border-top:1px solid var(--line);margin:18px 0">'+
      '<h2 style="font-size:1.05rem">投票の取り消し</h2>'+
      '<p style="color:var(--sub);font-size:.86rem">投票は取り消せます。取り消すと、この投票に基づく掲載内容の最適化も取り消されます。</p>'+
      '<button class="btn ghost sm" onclick="CX.askUndo()">投票を取り消す</button>'+
      '<p class="msg" id="undomsg"></p>'+
      '<p class="backlink"><a href="#/">← ホーム</a></p></div></div>');
  }

  function vVideo(g){
    // 個別映像の詳細（撮影地の違和感＋外に写り込んだ特徴）
    setTitle((g?G[g].name:"")+" 自己PR映像");
    S.viewed[g]=true; if(S.viewed.t&&S.viewed.r){ S.bothViewed=true; } saveS();
    var G0=G[g]||G["t"];
    render('<div class="wrap"><div class="page" style="max-width:820px"><h1>'+G0.name+' 自己PR映像</h1>'+
      vp("half", g==="t"?"l":"r", G0.name+" 自己PR映像（ダンス部紹介映像）／撮影地：本校 体育館")+
      '<p style="color:var(--sub);font-size:.86rem;margin-top:8px">サイトの説明では「本校 体育館」で撮影されたことになっています。</p>'+
      '<h2>映像に写り込んでいるもの</h2>'+
      '<p class="lead">MIRAが自動抽出したフレームです。体育館にしては、見慣れないものが写っています。</p>'+
      '<div class="gallery">'+
        '<figure>'+M.eno.station()+'<figcaption>反り屋根の、竜宮城のような駅舎</figcaption></figure>'+
        '<figure>'+M.eno.island()+'<figcaption>海に架かる長い橋の先、丘の上に展望灯台のある島</figcaption></figure>'+
        '<figure>'+M.eno.bridge()+'<figcaption>橋のたもとの道標</figcaption></figure>'+
      '</div>'+
      '<p style="margin-top:10px">映像の冒頭には、二人がどこかの駅から海沿いを歩くカットがあり、「駅から歩いて、けっこうあるね」という会話も入っています。<br>——この場所は、本当に体育館なのでしょうか。<a href="#/loc">撮影地を確認する →</a></p>'+
      '<p class="backlink"><a href="#/dance">← ダンス部紹介</a> ・ '+(g==="t"?'<a href="#/video/r">白石さんの映像</a>':'<a href="#/video/t">相沢さんの映像</a>')+'</p>'+
      '</div></div>');
  }

  function vLoc(){
    setTitle("撮影地を確認する");
    render('<div class="wrap"><div class="page" style="max-width:760px"><h1>撮影地を確認する</h1>'+
      '<p class="lead">映像に写り込んだ特徴（竜宮造りの駅舎・海に架かる長い橋・丘の上の展望灯台）から、撮影地を確かめます。地図で調べ、映像と一致する場所を選んでください。</p>'+
      '<p style="font-size:.86rem"><a href="https://www.google.com/maps" target="_blank" rel="noopener">Googleマップを開く ↗</a></p>'+
      '<div class="loc" style="margin-top:12px">'+
        locBtn("gym","本校 体育館","校内。屋内。海も駅もない。","#/map",null)+
        locBtn("minato","みなと総合文化ホール","内陸の複合施設。海には面していない。",null,"https://www.google.com/maps?q=文化ホール")+
        locBtn("eno","江の島 周辺（潮風ホール跡）","竜宮造りの駅・海に架かる長い橋・展望灯台のある島。","enomap","https://www.google.com/maps?q=片瀬江ノ島駅")+
      '</div>'+
      '<p class="msg" id="locmsg"></p>'+
      '<p class="backlink"><a href="#/dance">← ダンス部紹介</a></p></div></div>');
  }
  function locBtn(id,name,memo,thumb,maps){
    var img = id==="gym"?M.map(): id==="minato"?M.school(): M.eno.station();
    return '<button onclick="CX.pickLoc(\''+id+'\')"><div class="cimg" style="line-height:0">'+img+'</div><div class="ln">'+name+'</div><div class="lm">'+memo+(maps?' <a href="'+maps+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">地図↗</a>':'')+'</div></button>';
  }

  function vHall(){
    setTitle("旧・潮風ホール 活動記録");
    S.seenHall=true; S.maps=true; saveS();
    render('<div class="wrap"><div class="page" style="max-width:800px"><h1>旧・潮風ホール 活動記録</h1>'+
      '<p class="lead">江の島にほど近い、いまは閉鎖された地域ホール「潮風ホール」。本校ダンス部（前身の地域ダンス教室を含む）の、古い発表会の記録が残っています。</p>'+
      '<div style="border-radius:12px;overflow:hidden;border:1px solid var(--line);margin:12px 0">'+M.recital()+'</div>'+
      '<p>2016年、しおかぜダンス発表会。まだ幼い <strong>相沢紬</strong> と <strong>白石莉央</strong> が、同じステージで並んで踊っています。二人は確かに、別々の人物として、ここにいました。二人の“はじまりの舞台”です。</p>'+
      '<div class="mira" style="margin:14px 0"><div class="mh"><span class="dot"></span>MIRA 自動照合メモ</div>'+
        '<p style="margin:.2em 0;color:#dfeaea">現在サイトに掲載中の「自己PR映像」は、この潮風ホールで撮影されたものと一致します。撮影日は今年の9月。学校行事の記録には該当がありません。</p>'+
        '<p style="margin:.2em 0;color:#dfeaea">映像内の会話・服装・撮影内容は、学校の文化祭用ではなく、外部オーディションの応募用自己PRと一致します。二人は学校に無断で、この場所で撮影したとみられます。</p></div>'+
      '<h2>この映像は、何のために？</h2>'+
      '<p>二人の会話には「締切」「1人1回」「加工なしの本人の写真」「保護者の同意」といった言葉が出てきます。これらは、いま二人が応募しようとしているオーディションの募集要項と一致します。'+
      '一度だけ、公式サイトで確かめてみてください。<br><a href="https://aobazaka46.com/" target="_blank" rel="noopener" onclick="CX.mark(\'aoba\')">青葉坂46 オーディション公式サイトで確認する ↗</a></p>'+
      '<div class="mira" style="margin-top:12px"><div class="mh"><span class="dot"></span>引用メモ（公式サイトより／変更される場合あり）</div>'+
      '<p style="margin:.2em 0;color:#cfe0e0;font-size:.86rem">・応募締切 2026年10月8日 23:59 ／ 応募は1人1回 ／ 20歳未満は保護者の同意が必要 ／ 応募写真はAI生成・加工なしの本人写真 ／ 通過者のみSpotUで連絡 ／ キャッチコピー「ここから変われ、君の世界。」</p></div>'+
      '<p style="margin-top:12px">日付も、撮影内容も、二人の会話も——これは、二人がそれぞれ青葉坂46へ応募するために撮った映像でした。<br>そして二人は、こう約束していたはずです。「どちらが選ばれても、もう一人の夢を否定しない」と。</p>'+
      '<p class="backlink"><a href="#/dance">← ダンス部紹介</a> ・ <a href="#/stage">ステージ企画</a></p></div></div>');
  }

  function vPr(){ setTitle("文化祭広報について"); render('<div class="wrap"><div class="page"><h1>文化祭広報について</h1>'+
    '<p>朝凪祭2026 特設サイトは、朝凪学園 文化祭実行委員会 広報班が運営しています。写真・映像・紹介文は、生徒本人および関係者の許可を得て掲載しています。</p>'+
    '<p>本サイトの掲載情報は、外部の広報支援サービス <strong>MIRA</strong> によって、より魅力的になるよう自動的に最適化されています。詳しくは<a href="#/mira">掲載情報の最適化について</a>をご覧ください。</p>'+
    '<p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }
  function vMira(){ setTitle("掲載情報の最適化について"); render('<div class="wrap"><div class="page"><h1>掲載情報の最適化について</h1>'+
    '<div class="mira"><div class="mh"><span class="dot"></span>MIRA ／ 学校広報最適化クラウド</div>'+
    '<p style="color:#dfeaea;margin:.2em 0">MIRA は、ルミナ・エデュケーション株式会社が提供する学校広報支援サービスです。「学校広報を、いちばん魅力的に。」</p></div>'+
    '<h2>主な機能</h2><ul><li>生徒の紹介文を、読みやすく整えます</li><li>写真の明るさや構図を自動で調整します</li><li>不適切なコメントを自動で非表示にします</li><li>閲覧者の反応を分析します</li><li>人気のコンテンツをトップに表示します</li><li>サイトの魅力を、継続的に自動改善します</li></ul>'+
    '<p style="color:var(--sub);font-size:.86rem">最適化の目的は、学校の魅力を最大化し、より多くの方に良い印象を持っていただくことです。'+(S.run>=2?'<br><strong>最適化履歴：1件</strong>（前回の評価データを保持しています）':'')+'</p>'+
    '<p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }

  function vGallery(){ setTitle("フォトギャラリー");
    var items=[[M.school(),"朝凪学園 校舎"],[M.key(),"朝凪祭 キービジュアル"],[M.group(isPresent("t")&&isPresent("r")?4:3),"ダンス部 集合写真"],[M.hall(S.run>=2?{shadow:true}:{}),"旧・潮風ホール（在りし日）"],[M.map(),"校内マップ"],[M.recital(),"過去の発表会"]];
    render('<div class="wrap"><div class="page"><h1>フォトギャラリー</h1><div class="gallery">'+
      items.map(function(it){return '<figure><div style="line-height:0">'+it[0]+'</div><figcaption>'+it[1]+'</figcaption></figure>';}).join("")+
      '</div><p class="backlink"><a href="#/">← ホーム</a></p></div></div>'); }

  /* ---------- エンディング ---------- */
  function vEnd1(){
    setTitle("");
    var r=remaining();
    render('<div class="wrap"><div class="ending">'+
      '<h1>朝凪祭2026 ダンス部ステージ</h1>'+
      '<p>投票の取り消しが完了しました。サイトは、いつもの明るい文化祭サイトに戻りました。</p>'+
      '<p>ダンス部の部員一覧には、<strong>'+G[r].name+'</strong> さんの名前があります。集合写真にも、タイムテーブルにも、自己PR映像にも。すべてが、最初からそうだったように、きれいに整っています。</p>'+
      '<p>ただ、'+G[gone()].name+' さんの名前は、どこにもありません。部員一覧にも、集合写真にも、あの発表会の記録にも。'+G[r].name+' さんに聞いても、きっとこう答えるでしょう。</p>'+
      '<p style="text-align:center;font-size:1.1rem;color:#fff">「ずっと一人で、センターを目指してきました。」</p>'+
      '<p class="small">——親友のことは、もう、誰も覚えていません。</p>'+
      '<div class="official"><p class="small">参考リンク</p><p><a href="https://aobazaka46.com/" target="_blank" rel="noopener">青葉坂46 オーディション公式サイト ↗</a></p>'+
      '<p class="catch">ここから変われ、君の世界。</p>'+
      '<p class="small">——変わったのは、少女の世界ではなく、投票した「君」によって書き換えられた、世界の側でした。</p></div>'+
      '<p style="text-align:center;margin-top:20px"><a class="btn ghost" href="#" onclick="return CX.softReset()">最初から見る</a></p>'+
      '</div></div>');
  }
  function vTrueEnd(){
    setTitle("");
    render('<div class="wrap"><div class="ending">'+
      '<h1>元の映像</h1>'+
      '<p>二つに分かれていた映像を、元の一本に戻しました。潮風ホールの舞台で、二人が同じ一曲を、並んで踊っています。左右に切り分けられ、別々の「候補者」に見せられていた、たった一本の映像。</p>'+
      '<div style="border-radius:12px;overflow:hidden;margin:14px 0">'+vp("wide",null,"潮風ホール ／ 2026.09 ・ 二人のデュオ（原本）")+'</div>'+
      '<p>二人は、一人のセンターを競っていたのではありませんでした。二人とも青葉坂46に応募し、「どちらが選ばれても、もう一人の夢を否定しない」と約束して、この一本を撮ったのです。<br>比べる必要など、最初から、どこにもなかった。</p>'+
      '<p>復元の瞬間、'+G["t"].name+' さんと '+G["r"].name+' さんの記録が、一度だけ、同時に戻りました。救えた——そう思ったとき、MIRA が静かに表示しました。</p>'+
      '<div class="mira" style="margin:14px 0"><div class="mh"><span class="dot"></span>MIRA</div>'+
        '<p class="mono" style="color:#cfe0e0;margin:.2em 0">&gt; 比較不能な対象を検出しました。</p>'+
        '<p class="mono" style="color:#cfe0e0;margin:.2em 0">&gt; 最適化に必要な評価が不足しています。</p>'+
        '<p class="mono" style="color:#cfe0e0;margin:.2em 0">&gt; 新しい評価者を待機しています…</p>'+
        '<div class="row"><span class="k">このサイトの公開状態</span><span>外部公開中（共有URL 発行済み）</span></div>'+
        '<div class="row"><span class="k">比較中の候補データ</span><span>閲覧者を含む 3 件</span></div>'+
      '</div>'+
      '<p>あなたが二人を救った操作は、MIRA を止めたのではありませんでした。二人を比較できなかったため、判断を「次の閲覧者」へ委ねる状態に戻しただけ。<br>あなたがこのサイトを偶然見つけたことも——MIRA が、次の評価者を集めるために、外部へ公開した結果でした。あなたの操作も、新しい評価データとして、保存されています。</p>'+
      '<div class="official"><p><a href="https://aobazaka46.com/" target="_blank" rel="noopener">青葉坂46 オーディション公式サイト ↗</a></p>'+
      '<p class="catch">ここから変われ、君の世界。</p></div>'+
      '<p style="text-align:center;margin-top:18px"><a class="btn ghost" href="#" onclick="return CX.softReset()">最初から見る</a></p>'+
      '</div></div>');
  }

  function v404(){
    setTitle("ページが見つかりません");
    var ghost = (S.run>=2) ? '<p class="lead" style="margin-top:16px">…このページには、なぜか短いメモが残っています。</p><p style="font-style:italic;color:var(--sub)">「わたしのこと、おぼえていますか。——'+G[H.firstPick?opp(H.firstPick):"r"].name+'」</p>' : '';
    render('<div class="wrap"><div class="page"><h1>404 — ページが見つかりません</h1><p>お探しのページは見つかりませんでした。アドレスが変わったか、削除された可能性があります。</p>'+ghost+'<p class="backlink"><a href="#/">← ホームへ</a></p></div></div>');
  }

  /* ===================== 進行ロジック ===================== */
  function afterVoteRewrite(){ /* 表示は displayTagline/Intro が担う */ }
  function doVanish(){
    if(S.vanished) return; S.vanished=true; H.everVanished=true; saveH(); saveS();
    toast("MIRA：掲載情報を最適化しました。");
  }
  function bumpOpt(n){
    S.opt=(S.opt||0)+(n||1); saveS();
    if(S.voted && !S.vanished && S.opt>=VANISH_AT){ doVanish(); }
  }

  /* ===================== 公開API ===================== */
  window.CX = {
    nav:function(btn){ var n=document.getElementById("gnav"); n.classList.toggle("open"); },
    play:function(id){ playToggle(id); },
    pick:function(btn){ var box=btn.parentNode; Array.prototype.forEach.call(box.children,function(b){ b.setAttribute("aria-pressed","false"); }); btn.setAttribute("aria-pressed","true"); box._g=btn.getAttribute("data-g"); },
    evChip:function(btn){ var on=btn.getAttribute("aria-pressed")==="true"; btn.setAttribute("aria-pressed", on?"false":"true"); },
    submitVote:function(){
      var box=document.querySelector(".votepick"); var g=box&&box._g; var msg=document.getElementById("votemsg");
      if(!g){ if(msg) msg.textContent="応援する候補を1名選んでください。"; return; }
      var chips=document.querySelectorAll("#votetraits .chip[aria-pressed='true']");
      if(!chips.length){ if(msg) msg.textContent="魅力だと思う点を1つ以上選んでください。"; return; }
      var traits=Array.prototype.map.call(chips,function(c){return c.getAttribute("data-tid");});
      S.pick=g; S.traits=traits; S.voted=true; S.opt=1; S.undone=false; saveS();
      if(!H.firstPick){ H.firstPick=g; } H.ranEver=true; saveH();
      location.hash="#/voted";
    },
    evaluate:function(g){
      var chips=document.querySelectorAll("#ev-"+g+" .chip[aria-pressed='true']");
      bumpOpt(1);
      toast("評価を送信しました。広報内容に反映します。");
      setTimeout(function(){ route(); },300);
    },
    helpful:function(g){ bumpOpt(1); toast("「参考になった」を記録しました。"); setTimeout(route,250); },
    askUndo:function(){
      var msg=document.getElementById("undomsg"); if(!msg) return;
      msg.innerHTML='<div class="mira" style="margin-top:10px"><div class="mh"><span class="dot"></span>確認</div>'+
        '<p style="color:#dfeaea;margin:.2em 0">投票を取り消しますか？この投票に基づく掲載内容の最適化も取り消されます。</p>'+
        '<button class="btn sm" onclick="CX.doUndo()">取り消す</button> <button class="btn ghost sm" onclick="document.getElementById(\'undomsg\').innerHTML=\'\'">やめる</button></div>';
    },
    doUndo:function(){
      S.undone=true;
      // 収束先が入れ替わる：これまで残っていた側が消え、消えていた側が戻る
      if(!S.vanished) S.vanished=true;   // 取り消し後は一人へ収束
      S.end1=true; saveS();
      location.hash="#/end1";
    },
    pickLoc:function(id){
      var msg=document.getElementById("locmsg"); if(!msg) return;
      if(id==="eno"){ msg.style.color="var(--teal)"; msg.textContent="映像の特徴と一致しました。潮風ホールの活動記録を表示します…"; setTimeout(function(){ location.hash="#/hall"; },800); }
      else { msg.style.color="var(--sub)"; msg.textContent="その場所の特徴（海・長い橋・竜宮造りの駅・展望灯台）とは一致しないようです。"; }
    },
    toggleDuo:function(){
      if(S.restored){ return; }
      var canRestore = (S.run>=2 && S.maps && S.bothViewed);
      if(!canRestore){
        toast("MIRA：比較を継続します（対象データが不足しています）。");
        return;
      }
      S.restored=true; S.trueend=true; saveS();
      location.hash="#/trueend";
    },
    mark:function(k){ /* 公式サイト確認などのフラグ（拡張用） */ },
    softReset:function(){
      // 二周目のための記録(H)は残す。現在の進行(S)だけ初期化。
      lsDel(SKEY); S=freshState(); saveS();
      location.hash="#/"; route(); toast(H.ranEver?"最初から見ています（前回の記録は残っています）":"最初から見ています"); return false;
    },
    hardReset:function(){
      lsDel(SKEY); lsDel(HKEY);
      try{ localStorage.removeItem(SKEY); localStorage.removeItem(HKEY); }catch(e){}
      H={ ranEver:false, firstPick:null, everVanished:false, visits:1 }; S=freshState(); saveH(); saveS();
      location.hash="#/"; route(); toast("サイトデータを削除しました。"); return false;
    }
  };

  /* ===================== ルーター ===================== */
  function route(){
    // 実行中プレイヤー停止
    Object.keys(players).forEach(function(id){ var p=players[id]; if(p&&p._i) clearInterval(p._i); }); players={};
    var h=location.hash.replace(/^#/,""); var m;
    if(!h||h==="/") return vHome();
    if(h==="/news") return vNews();
    if(h==="/timetable") return vTimetable();
    if(h==="/map") return vMap();
    if(h==="/stage") return vStage();
    if(h==="/dance") return vDance();
    if(h==="/vote") return vVote();
    if(h==="/voted") return vVoted();
    if(h==="/confirm") return vConfirm();
    if((m=h.match(/^\/cand\/(t|r)$/))) return vCand(m[1]);
    if((m=h.match(/^\/video\/(t|r)$/))) return vVideo(m[1]);
    if(h==="/video") return vVideo(null);
    if(h==="/loc") return vLoc();
    if(h==="/hall") return vHall();
    if(h==="/gallery") return vGallery();
    if(h==="/pr") return vPr();
    if(h==="/mira") return vMira();
    if(h==="/end1") return vEnd1();
    if(h==="/trueend") return vTrueEnd();
    return v404();
  }

  function boot(){
    app=document.getElementById("app")||document.body;
    // 二周目：初回選択の名前を一瞬フラッシュ
    if(S.run>=2 && H.firstPick){
      var gn=document.createElement("div"); gn.className="ghostname"; gn.textContent=G[H.firstPick].name+" さんに投票しました（前回）"; document.body.appendChild(gn);
      setTimeout(function(){ gn.classList.add("flash"); },1200);
    }
    window.addEventListener("hashchange",route);
    route();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();
