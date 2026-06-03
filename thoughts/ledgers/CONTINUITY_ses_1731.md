---
session: ses_1731
updated: 2026-06-03T11:25:11.188Z
---

En fait il faut brancher `SVG_IDS` dans `ServiceIcon` :

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="edit">
<｜｜DSML｜｜parameter name="filePath" string="true">/home/afreeserv/projects/num_zer0/src/components/spa/my-space-page.tsx</｜｜DSML｜｜parameter>
<｜｜DSML｜｜parameter name="oldString" string="true">// Services without any icon file — skip img, render letter directly (no 404s)
const NO_ICON_IDS = new Set([
  "ac","af","an","aq","ar","at","av","aw","ax","ba","bb","bc","be","bf","bn",
  "bo","bp","br","bu","bw","cc","cm","cn","cr","cy","da","de","dg","dj","dr",
  "du","dv","eh","em","eq","es","eu","ev","fc","fd","ff","fh","fi","fj","ft",
  "full","fv","fx","gc","gg","gk","gt","gy","hh","hj","hs","ib","ih","ij","ik",
  "io","ir","iu","jc","je","ji","jr","js","kb","kd","ke","kh","kk","ko","kp",
  "kq","ks","kv","ky","lb","lj","lm","lo","ma","mg","ml","mn","mp","mt","mv",
  "mw","my","nb","nh","ni","nt","nu","nw","ob","ok","ov","pc","pl","pp","ps",
  "py","pz","qi","qj","qn","qr","qt","qy","rd","rj","rm","ro","rs","rw","rz",
  "sa","sb","sc","sd","se","sg","sh","sl","ss","st","sv","sy","th","tk","ui",
  "un","uu","uv","vd","vg","vj","vk","vr","we","wf","wg","wj","wn","wq","ws",
  "wt","xh","xj","xm","xn","xp","xr","xu","ya","yg","yh","yj","yk","ym","yo",
  "yp","yx","yz","zb","zi","zj","zo","zr","zs",
])

function ServiceIcon({ serviceId, name }: { serviceId: string; name: string }) {
  if (NO_ICON_IDS.has(serviceId)) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
        {name.charAt(0)}
      </span>
    )
  }
  const [useSvg, setUseSvg] = useState(false)
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
        {name.charAt(0)}
      </span>
    )
  }
  return (
    <img
      src={`/assets/services/${serviceId}${useSvg ? '.svg' : '.webp'}`}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-[var(--sea-ink)]/5"
      loading="lazy"
      onError={() => {
        if (!useSvg) setUseSvg(true)
        else setErrored(true)
      }}
    />
  )
}</｜｜DSML｜｜parameter>
<｜｜DSML｜｜parameter name="newString" string="true">// Services whose icon uses .svg extension (not .webp) — serve correct ext directly
const SVG_IDS = new Set([
  "az","bj","df","dt","dw","dx","dz","ee","eo","er","et","fp","fq","fu","fy",
  "gn","gs","gv","hd","hf","ia","ic","ie","il","jf","ki","kj","lv","mc","mh",
  "nq","of","og","oh","op","pg","qc","qm","qz","rc","rl","sx","tj","tt","up",
  "vf","wl","yb","yu",
])
// Services without any icon file — skip img, render letter directly (no 404s)
const NO_ICON_IDS = new Set([
  "ac","af","an","aq","ar","at","av","aw","ax","ba","bb","bc","be","bf","bn",
  "bo","bp","br","bu","bw","cc","cm","cn","cr","cy","da","de","dg","dj","dr",
  "du","dv","eh","em","eq","es","eu","ev","fc","fd","ff","fh","fi","fj","ft",
  "full","fv","fx","gc","gg","gk","gt","gy","hh","hj","hs","ib","ih","ij","ik",
  "io","ir","iu","jc","je","ji","jr","js","kb","kd","ke","kh","kk","ko","kp",
  "kq","ks","kv","ky","lb","lj","lm","lo","ma","mg","ml","mn","mp","mt","mv",
  "mw","my","nb","nh","ni","nt","nu","nw","ob","ok","ov","pc","pl","pp","ps",
  "py","pz","qi","qj","qn","qr","qt","qy","rd","rj","rm","ro","rs","rw","rz",
  "sa","sb","sc","sd","se","sg","sh","sl","ss","st","sv","sy","th","tk","ui",
  "un","uu","uv","vd","vg","vj","vk","vr","we","wf","wg","wj","wn","wq","ws",
  "wt","xh","xj","xm","xn","xp","xr","xu","ya","yg","yh","yj","yk","ym","yo",
  "yp","yx","yz","zb","zi","zj","zo","zr","zs",
])

function ServiceIcon({ serviceId, name }: { serviceId: string; name: string }) {
  if (NO_ICON_IDS.has(serviceId)) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
        {name.charAt(0)}
      </span>
    )
  }
  const [fallbackExt, setFallbackExt] = useState(false)
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--sea-ink)]/10 text-[var(--sea-ink)] text-sm font-semibold">
        {name.charAt(0)}
      </span>
    )
  }
  const ext = SVG_IDS.has(serviceId) ? 'svg' : 'webp'
  return (
    <img
      src={`/assets/services/${serviceId}.${fallbackExt ? (ext === 'svg' ? 'webp' : 'svg') : ext}`}
      alt={name}
      className="w-8 h-8 rounded-full object-cover bg-[var(--sea-ink)]/5"
      loading="lazy"
      onError={() => {
        if (!fallbackExt) setFallbackExt(true)
        else setErrored(true)
      }}
    />
  )
}</｜｜DSML｜｜parameter>
</｜｜DSML｜｜invoke>
</｜｜DSML｜｜tool_calls>
