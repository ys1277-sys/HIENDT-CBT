import fs from "node:fs";
import path from "node:path";
const flat = (j) => {
  const out = [];
  (function w(b){ if(Array.isArray(b)){b.forEach(w);return}
    if(!b||typeof b!=="object")return;
    if(b.t==="p"&&b.s)out.push(String(b.s).replace(/\s+/g," ").trim());
    if(b.t==="table"&&b.grid) for(const r of b.grid){ const c=[];
      for(const x of r){ if(!x||x==="covered"){c.push("·");continue}
        const t=[];(function v(y){if(Array.isArray(y)){y.forEach(v);return}
          if(!y||typeof y!=="object")return;
          if(y.t==="p"&&y.s)t.push(String(y.s).replace(/\s+/g," ").trim());
          if(y.blocks)v(y.blocks); if(y.grid)v(y.grid);})(x.blocks);
        c.push(t.join(" ")); }
      out.push("[표] "+c.join(" | ")); }
    if(b.blocks)w(b.blocks); if(b.grid)w(b.grid);
  })(j);
  return out;
};
const pat = new RegExp(process.argv[2], "i");
const dir = "public/data/procedures";
for (const f of fs.readdirSync(dir).filter((x)=>x.endsWith(".json")&&x!=="index.json")) {
  const L = flat(JSON.parse(fs.readFileSync(path.join(dir,f),"utf8")));
  L.forEach((s,i)=>{ if(pat.test(s)) console.log(f.replace(".json","").padEnd(20)+i+"  "+s.slice(0,150)); });
}
